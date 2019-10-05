module.exports = (config) => {

    const {
        io,
        router,
        OrderModel,
        ProductModel,
        DeliveryMethodModel,
        accessTokenCheck,
        orderCreateParamsCheck,
        verifyNotificationSignature,
        productsCheckMiddleware,
        deliveryMethodCheckMiddleware,
        setCreateOrderRequestConfig,
        sendMail,
        axios,
        possibleOrderStatusesLabels,
        statusesDescriptions,
    } = config;

    const productsCheck = productsCheckMiddleware(ProductModel);
    const deliveryMethodCheck = deliveryMethodCheckMiddleware(DeliveryMethodModel);

    router.post('/notify', verifyNotificationSignature, async (req, res, next) => {

        const {body: {order, orderId, localReceiptDateTime, properties, refund}} = req;

        if (refund) {
            try {
                const refundedOrder = await OrderModel.findOneAndUpdate(
                    {orderId: {$eq: orderId}},
                    {$set: {refund}},
                    {new: true, runValidators: true}
                ).exec();
                io.emit('refund', {[refundedOrder.extOrderId]: refundedOrder});
            } finally {
                return res.sendStatus(200);
            }
        }

        try {
            let localOrder;
            try {
                localOrder = await OrderModel.findOne({orderId: {$eq: order.orderId}}).exec();
            } catch (e) {
                console.log('Error when finding order in local db', e);
            } finally {
                if (!localOrder) {
                    return res.sendStatus(200);
                }
            }

            const {status, productsIds, products} = localOrder;
            const hasStatusBeenUpdated = status !== possibleOrderStatusesLabels[order.status];

            Object.assign(localOrder, order, {localReceiptDateTime, properties});
            localOrder.save();

            if (!hasStatusBeenUpdated) {
                return res.sendStatus(200);
            }

            if (order.status === 'COMPLETED') {
                const productsList = await ProductModel.find({_id: {$in: productsIds}});
                const productsById = {};
                productsList.forEach(async (doc, index) => {
                    const newQuantity = doc.stock - products[index].quantity;
                    doc.stock = newQuantity < 0 ? 0 : newQuantity;
                    productsById[doc.id] = doc;
                    return await doc.save();
                });
                io.emit('quantities', {productsIds, productsById});
            }

            io.to('admin').emit('adminUpdateOrder', localOrder);
            const {email, firstName, lastName} = localOrder.buyer || {};
            if (!email || !firstName || !lastName) {
                return res.sendStatus(200);
            }
            try {
                await sendMail(
                    'order',
                    Object.assign(localOrder, {
                        productPath: process.env.PRODUCT_PATH,
                        statusDescription: statusesDescriptions[order.status],
                    }),
                    process.env.EMAIL_ACCOUNT_FROM,
                    `${firstName} ${lastName} <${email}>`);
            } finally {
                return res.sendStatus(200);
            }

        } catch (err) {
            next(err);
        }
    });

    // OrderCreateRequest
    router.post('/',
        accessTokenCheck,
        orderCreateParamsCheck,
        productsCheck,
        deliveryMethodCheck,
        setCreateOrderRequestConfig,
        async (req, res, next) => {
            try {
                const {extOrderId} = req.createOrderRequestConfig.data;

                // 1. Store order locally (status: LOCAL_NEW_INITIATED)
                let localOrder = await OrderModel.findOneAndUpdate(
                    {extOrderId},
                    {$set: Object.assign(req.body, req.createOrderRequestConfig.data, {
                        status: 'LOCAL_NEW_INITIATED',
                        orderId: extOrderId,
                    })},
                    {upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true}
                ).exec();

                // 2. Send createOrderRequest to PayU
                let updateAfterCreateOrderRequest;
                try {
                    const {data: {orderId, redirectUri}} = await axios(req.createOrderRequestConfig);
                    updateAfterCreateOrderRequest = {orderId, redirectUri};
                } catch (e) {

                    // 3a. Not good. Try rejecting order locally (status: LOCAL_NEW_REJECTED)
                    let error = e;
                    try {
                        localOrder = await OrderModel.findOneAndUpdate(
                            {extOrderId},
                            {$set: Object.assign(localOrder, {status: 'LOCAL_NEW_REJECTED', redirectUri: ''})},
                            {new: true, runValidators: true}
                        ).exec();
                    } catch(e) {
                        error = e;
                    } finally {
                        io.to('admin').emit('adminCreateOrder', localOrder);
                        return next(error);
                    }
                }

                // 3b. All good. Try completing order locally (status: LOCAL_NEW_COMPLETED)
                try {
                    localOrder = await OrderModel.findOneAndUpdate(
                        {extOrderId},
                        {$set: Object.assign(localOrder, updateAfterCreateOrderRequest, {status: 'LOCAL_NEW_COMPLETED'})},
                        {new: true, runValidators: true}
                    ).exec();
                } finally {
                    io.to('admin').emit('adminCreateOrder', localOrder);

                    res.json({
                        extOrderId,
                        redirectUri: localOrder.redirectUri,
                    });
                }
            } catch (err) {
                next(err);
            }
        });

    return router;
};
