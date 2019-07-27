const request = require('request');
const accessTokenCheck = require('../middleware/accessTokenCheck');
const orderCreateParamsCheck = require('../middleware/orderCreateParamsCheck');
const verifyNotificationSignature = require('../middleware/verifyNotificationSignature');
const productsCheckMiddleware = require('../middleware/productsCheck');
const deliveryMethodCheckMiddleware = require('../middleware/deliveryMethodCheck');
const setCreateOrderRequestConfig = require('../middleware/setCreateOrderRequestConfig');
const sendMail = require('../utils/sendMail');
const axios = require('axios');

module.exports = (io, router, OrderModel, ProductModel, DeliveryMethodModel) => {

    const productsCheck = productsCheckMiddleware(ProductModel);
    const deliveryMethodCheck = deliveryMethodCheckMiddleware(DeliveryMethodModel);

    router.post('/notify', verifyNotificationSignature, async (req, res, next) => {

        const {body: {order, localReceiptDateTime, properties}} = req;

        try {
            const conditions = {orderId: {$eq: order.orderId}, status: {$nin: ['COMPLETED', 'CANCELED']}};

            const foundOrder = await OrderModel.findOne(conditions).exec();

            const update = {$set: Object.assign(foundOrder, order, {localReceiptDateTime}, {properties})};
            const options = {'new': true, runValidators: true};

            const updatedOrder = await OrderModel.findOneAndUpdate(conditions, update, options).exec();

            if (!updatedOrder) {
                return res.sendStatus(200);
            }

            io.emit('order', updatedOrder);

            const {status, merchantPosId, productsIds, products} = updatedOrder;

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
                try {
                    await sendMail('order', Object.assign(updatedOrder, {productPath: process.env.PRODUCT_PATH}));
                } catch (e) {
                    console.error(e);
                }
            }

            if (status !== 'REJECTED') {
                return res.sendStatus(200);
            }

            // Cancel an order and proceed with a refund in case of REJECTED
            const {data: {access_token}} = await axios({
                url: `${process.env.PAYU_HOST}/pl/standard/user/oauth/authorize`,
                method: 'post',
                data: `grant_type=client_credentials&client_id=${merchantPosId}&client_secret=${process.env.PAYU_CLIENT_SECRET}`,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
            const cancelOrderResponse = await axios({
                url: `${process.env.PAYU_API}/orders/${order.orderId}`,
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                maxRedirects: 0,
                validateStatus: status => status === 200,
            });
            return res.sendStatus(cancelOrderResponse.status);
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

                // LOCAL_NEW
                const localNewOrder = await OrderModel.findOneAndUpdate(
                    {extOrderId},
                    {$set: Object.assign(req.body, res.createOrderRequestConfig.data, {
                        status: 'LOCAL_NEW',
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

    // OrderRetrieveRequest
    router.get('/:extOrderId', accessTokenCheck, (req, res, next) => {

        const {extOrderId} = req.params;
        if (typeof extOrderId !== 'string' || !extOrderId.trim()) {
            res.status(401);
            return next(Error('Invalid order id'));
        }

        let orderDoc;
        let alreadyRetriedTimes = 0;
        let requestOptions;

        const callback = (err, response, body) => {
            if (err) {
                return next(err);
            }

            if (response.statusCode !== 200) {
                res.status(response.statusCode);
                return next(Error(response.statusMessage));
            }

            const json = JSON.parse(body);
            const status = json.orders[0].status;
            if (status === PENDING && MAX_RETRIEVE_ORDER_RETRIES > alreadyRetriedTimes) {
                alreadyRetriedTimes++;
                return setTimeout(function () {
                    request.get(requestOptions, callback);
                }, 300);
            }
            console.log('retried times: ', alreadyRetriedTimes);
            if (orderDoc.status === status) {
                return res.json(orderDoc);
            }

            const properties = (json.properties || []).reduce((acc, {name, value}) => {
                acc[name] = value;
                return acc;
            }, {});

            orderDoc.set({status, properties});
            orderDoc.save(function (err, updatedOrder) {
                if (err) {
                    return next(err);
                }
                res.json(updatedOrder);
            });
        };

        OrderModel.findOne({extOrderId: extOrderId}, function (err, order) {
            if (err) {
                return next(err);
            }
            orderDoc = order;

            requestOptions = {
                url: `${process.env.PAYU_API}/orders/${orderDoc.orderId}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${req.headers.authorization}`,
                },
            };

            request.get(requestOptions, callback);
        });
    });

    // TransactionRetrieveRequest
    router.get('/:orderId/transactions', accessTokenCheck, (req, res, next) => {

        const {orderId} = req.params;
        if (typeof orderId !== 'string' || !orderId.trim()) {
            res.status(401);
            return next(Error('Invalid order id'));
        }

        const options = {
            url: `${process.env.PAYU_API}/orders/${orderId}/transactions`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${req.headers.accessToken}`,
            },
        };

        const callback = (err, response, body) => {
            if (err) {
                return next(err);
            }
            res.json(JSON.parse(body));
        };

        request.get(options, callback);
    });

    return router;
};
