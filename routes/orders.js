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
        axios
    } = config;

    const productsCheck = productsCheckMiddleware(ProductModel);
    const deliveryMethodCheck = deliveryMethodCheckMiddleware(DeliveryMethodModel);

    router.post('/notify', verifyNotificationSignature, async (req, res, next) => {

        const {body: {order, localReceiptDateTime, properties}} = req;

        try {
            const updatedOrder = await OrderModel.findOneAndUpdate(
                {orderId: {$eq: order.orderId}, status: {$neq: order.status}},
                {$set: Object.assign(order, {localReceiptDateTime, properties})},
                {new: true, runValidators: true}
            ).exec();

            if (!updatedOrder) {
                return res.sendStatus(200);
            }

            const {status, productsIds, products} = updatedOrder;

            if (status === 'COMPLETED') {
                const productsList = await ProductModel.find({_id: {$in: productsIds}});
                const productsById = {};
                productsList.forEach(async function (doc, index) {
                    const newQuantity = doc.stock - products[index].quantity;
                    doc.stock = newQuantity < 0 ? 0 : newQuantity;
                    productsById[doc.id] = doc;
                    await doc.save();
                });
                io.emit('quantities', {productsIds, productsById});
            }

            try {
                await sendMail('order', Object.assign(updatedOrder, {productPath: process.env.PRODUCT_PATH}));
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
                const extOrderId = res.createOrderRequestConfig.data.extOrderId;

                // LOCAL_NEW_INITIATED
                const localNewOrder = await OrderModel.findOneAndUpdate(
                    {extOrderId},
                    {$set: Object.assign(req.body, res.createOrderRequestConfig.data, {
                        status: 'LOCAL_NEW_INITIATED',
                        orderId: res.createOrderRequestConfig.data.extOrderId,
                    })},
                    {upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true}
                ).exec();

                let updateAfterCreateOrderRequest;
                try {
                    const {data: {orderId, redirectUri}} = await axios(res.createOrderRequestConfig);
                    updateAfterCreateOrderRequest = {orderId, redirectUri};
                } catch (err) {
                    // LOCAL_NEW_REJECTED
                    await OrderModel.findOneAndUpdate(
                        {extOrderId},
                        {$set: Object.assign(localNewOrder, {status: 'LOCAL_NEW_REJECTED', redirectUri: ''})},
                        {new: true, runValidators: true}
                    ).exec();
                    return next(err);
                }

                // LOCAL_NEW_COMPLETED
                let localOrderAfterCreateOrderRequest = localNewOrder;
                try {
                    localOrderAfterCreateOrderRequest = await OrderModel.findOneAndUpdate(
                        {extOrderId},
                        {$set: Object.assign(localNewOrder, updateAfterCreateOrderRequest, {status: 'LOCAL_NEW_COMPLETED'})},
                        {new: true, runValidators: true}
                    ).exec();
                } catch {}

                res.json({
                    extOrderId,
                    redirectUri: localOrderAfterCreateOrderRequest.redirectUri,
                    productsIds: localOrderAfterCreateOrderRequest.productsIds,
                    status: localOrderAfterCreateOrderRequest.status,
                });
            } catch (err) {
                next(err);
            }
        });

    return router;
};
