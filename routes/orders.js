const express = require('express');
const router = express.Router();
const request = require('request');
const accessTokenCheck = require('../middleware/accessTokenCheck');
const orderCreateParamsCheck = require('../middleware/orderCreateParamsCheck');
const OrderModel = require('../models/OrderModel');
const verifyNotificationSignature = require('../middleware/verifyNotificationSignature');

router.post('/notify', verifyNotificationSignature, async (req, res, next) => {
    const {body: {order, localReceiptDateTime, properties}} = req;

    try {
        const conditions = {orderId: {$eq: order.orderId}, status: {$ne: 'COMPLETED'}};
        const update = {$set: Object.assign(order, localReceiptDateTime, {properties})};
        const options = {'new': true, runValidators: true};

        const {status, merchantPosId} = await OrderModel.findOneAndUpdate(conditions, update, options).exec();

        if (status !== 'REJECTED') {
            return res.sendStatus(200);
        }

        // Cancel an order and proceed with a refund in case of REJECTED
        request.post({
            url: `${process.env.PAYU_HOST}/pl/standard/user/oauth/authorize`,
            body: `grant_type=client_credentials&client_id=${merchantPosId}&client_secret=${process.env.PAYU_CLIENT_SECRET}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        }, function(err, response, body) {
            if (err) {
                throw err;
            }
            const {access_token} = JSON.parse(body);
            request.delete({
                url: `${process.env.PAYU_API}/orders/${order.orderId}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
            }, function(err, {statusCode}) {
                if (err) {
                    throw err;
                }
                return res.sendStatus(statusCode);
            });
        });
    } catch (err) {
        next(err);
    }
});

// OrderCreateRequest
router.post('/', accessTokenCheck, orderCreateParamsCheck, (req, res, next) => {

    const {
        payMethods,
        merchantPosId,
        description,
        currencyCode,
        totalAmount,
        buyer,
        buyerDelivery,
        settings,
        products,
        productsIds,
        continueUrl,
        notifyUrl,
    } = req.body;
    const extOrderId = req.app.locals.db.Types.ObjectId().toString();
    const customerIp = req.ip;

    const options = {
        url: `${process.env.PAYU_API}/orders`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${req.headers.authorization}`,
        },
        body: JSON.stringify({
            extOrderId,
            payMethods,
            notifyUrl,
            continueUrl,
            customerIp,
            merchantPosId,
            description,
            currencyCode,
            totalAmount,
            buyer: Object.assign({}, buyer, {'buyer.delivery': buyerDelivery}),
            settings,
            products: productsIds.map(i => products[i]),
        }),
    };

    const callback = (err, response, body) => {
        if (err) {
            return next(err);
        }
        const json = JSON.parse(body);
        if (response.statusCode >= 400) {
            res.status(response.statusCode);
            const {status: {codeLiteral, statusDesc}} = json;
            return next(Error(`${codeLiteral} ${statusDesc}`));
        }
        const {orderId, redirectUri} = json;

        // Need to store buyerDelivery now as it is not retrievable later.
        OrderModel.findOneAndUpdate(
            {extOrderId},
            {$set: {orderId, extOrderId, buyerDelivery, productsIds}},
            {'new': true, upsert: true, runValidators: true, setDefaultsOnInsert: true}, function(err, doc) {
                if (err) {
                    console.log(err);
                    return next(err);
                }
                res.json({
                    extOrderId,
                    redirectUri,
                    productsIds,
                });
            });
    };

    request.post(options, callback);
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
            return setTimeout(function() {
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

module.exports = router;
