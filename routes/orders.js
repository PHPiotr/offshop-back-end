const express = require('express');
const router = express.Router();
const request = require('request');
const accessTokenCheck = require('../middleware/accessTokenCheck');
const orderCreateParamsCheck = require('../middleware/orderCreateParamsCheck');
const OrderModel = require('../models/OrderModel');

// OrderCreateRequest
router.post('/', accessTokenCheck, orderCreateParamsCheck, (req, res, next) => {

    const {
        authorizationCode,
        merchantPosId,
        description,
        currencyCode,
        totalAmount,
        buyer,
        settings,
        products,
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
            payMethods: {
                payMethod: {
                    value: "ap",
                    type: "PBL",
                    authorizationCode,
                }
            },
            notifyUrl: 'https://localhost:3000',
            continueUrl: `https://localhost:3000/checkout`,
            customerIp,
            merchantPosId,
            description,
            currencyCode,
            totalAmount,
            buyer,
            settings,
            products,
        }),
    };

    let orderDoc;

    const callback = (err, response, body) => {
        if (err) {
            return next(err);
        }
        const json = JSON.parse(body);
        const {orderId, redirectUri, status: {statusCode}} = json;
        orderDoc.set({orderId, redirectUri, statusCode});
        orderDoc.save(function (err, updatedOrder) {
            if (err) {
                return next(err);
            }
            res.json(updatedOrder);
        });
    };

    const Order = new OrderModel({
        extOrderId,
        totalAmount,
        customerIp,
        description,
        buyer,
        currencyCode,
        products,
    });

    Order.save(function (err, order) {
        if (err) {
            return next(err);
        }
        orderDoc = order;
        request.post(options, callback);
    });
});

// OrderRetrieveRequest (and sync status if needed)
router.get('/:extOrderId', accessTokenCheck, (req, res, next) => {

    const {extOrderId} = req.params;
    if (typeof extOrderId !== 'string' || !extOrderId.trim()) {
        res.status(401);
        return next(Error('Invalid order id'));
    }

    let orderDoc;

    const callback = (err, response, body) => {
        if (err) {
            return next(err);
        }

        if (response.statusCode !== 200) {
            res.status(response.statusCode);
            return next(Error(response.statusMessage));
        }

        const json = JSON.parse(body);
        const properties = (json.properties || []).reduce((acc, {name, value}) => {
            acc[name] = value;
            return acc;
        }, {});

        const statusCode = json.orders[0].status;
        if (orderDoc.statusCode === statusCode) {
            return res.json(orderDoc);
        }

        orderDoc.set({
            statusCode,
            properties,
        });
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

        const options = {
            url: `${process.env.PAYU_API}/orders/${orderDoc.orderId}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${req.headers.authorization}`,
            },
        };

        request.get(options, callback);
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
