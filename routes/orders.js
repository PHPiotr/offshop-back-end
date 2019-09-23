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
            const foundOrder = await OrderModel.findOne({orderId: {$eq: order.orderId}}).exec();
            if (!foundOrder) {
                return res.sendStatus(200);
            }
            const {status, productsIds, products} = foundOrder;
            const hasStatusBeenUpdated = status !== possibleOrderStatusesLabels[order.status];

            Object.assign(foundOrder, order, {localReceiptDateTime, properties});
            foundOrder.save();

            if (status === possibleOrderStatusesLabels.COMPLETED) {
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

            if (hasStatusBeenUpdated) {
                io.emit('adminOrder', foundOrder);
                const {email, firstName, lastName} = foundOrder.buyer || {};
                if (!email || !firstName || !lastName) {
                    return res.sendStatus(200);
                }
                try {
                    await sendMail(
                        'order',
                        Object.assign(foundOrder, {productPath: process.env.PRODUCT_PATH}),
                        process.env.EMAIL_ACCOUNT_FROM,
                        `${firstName} ${lastName} <${email}>`);
                } finally {
                    return res.sendStatus(200);
                }
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
                const extOrderId = res.createOrderRequestConfig.data.extOrderId;

                // LOCAL_NEW_INITIATED
                const localNewInitiatedOrder = await OrderModel.findOneAndUpdate(
                    {extOrderId},
                    {$set: Object.assign(req.body, res.createOrderRequestConfig.data, {
                        status: 'LOCAL_NEW_INITIATED',
                        orderId: res.createOrderRequestConfig.data.extOrderId,
                    })},
                    {upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true}
                ).exec();
                io.emit('adminOrder', localNewInitiatedOrder);

                let updateAfterCreateOrderRequest;
                try {
                    const {data: {orderId, redirectUri}} = await axios(res.createOrderRequestConfig);
                    updateAfterCreateOrderRequest = {orderId, redirectUri};
                } catch (err) {
                    // LOCAL_NEW_REJECTED
                    const localNewRejectedOrder = await OrderModel.findOneAndUpdate(
                        {extOrderId},
                        {$set: Object.assign(localNewInitiatedOrder, {status: 'LOCAL_NEW_REJECTED', redirectUri: ''})},
                        {new: true, runValidators: true}
                    ).exec();
                    io.emit('adminOrder', localNewRejectedOrder);
                    return next(err);
                }

                // LOCAL_NEW_COMPLETED
                let localNewCompletedOrder = localNewInitiatedOrder;
                try {
                    localNewCompletedOrder = await OrderModel.findOneAndUpdate(
                        {extOrderId},
                        {$set: Object.assign(localNewInitiatedOrder, updateAfterCreateOrderRequest, {status: 'LOCAL_NEW_COMPLETED'})},
                        {new: true, runValidators: true}
                    ).exec();
                } catch {}

                res.json({
                    extOrderId,
                    redirectUri: localNewCompletedOrder.redirectUri,
                    productsIds: localNewCompletedOrder.productsIds,
                    status: localNewCompletedOrder.status,
                });
            } catch (err) {
                next(err);
            }
        });

    return router;
};
