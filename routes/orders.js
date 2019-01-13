const express = require('express');
const router = express.Router();
const request = require('request');
const accessTokenCheck = require('../middleware/accessTokenCheck');
const orderCreateParamsCheck = require('../middleware/orderCreateParamsCheck');
const OrderModel = require('../models/OrderModel');

const MAX_RETRIEVE_ORDER_RETRIES = 10;
const PENDING = 'PENDING';

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
            products,
        }),
    };

    const callback = (err, response, body) => {
        if (err) {
            return next(err);
        }
        const json = JSON.parse(body);
        if (response.statusCode >= 400) {
            res.status(response.statusCode);
            console.error(json);
            return next(Error(`Problem po stronie systemu płatności PayU (${response.statusCode} ${response.statusMessage})`));
        }
        const {orderId, redirectUri} = json;

        const Order = new OrderModel({
            orderId,
            extOrderId,
            totalAmount,
            customerIp,
            description,
            buyer,
            buyerDelivery,
            currencyCode,
            products,
            productsIds,
            redirectUri,
        });
        Order.save(function (err, order) {
            if (err) {
                return next(err);
            }
            res.json(order);
        });
    };

    request.post(options, callback);
});

// OrderRetrieveRequest (and sync status if needed)
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
