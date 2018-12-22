const express = require('express');
const router = express.Router();
const request = require('request');
const OrderModel = require('../models/OrderModel');

// OrderCreateRequest
router.post('/', (req, res) => {

    const {
        accessToken,
        authorizationCode,
        notifyUrl,
        merchantPosId,
        description,
        currencyCode,
        totalAmount,
        buyer,
        settings,
        products,
    } = req.body;
    if (typeof accessToken !== 'string') {
        return res.send(403);
    }
    if (typeof authorizationCode !== 'string') {
        return res.send(403);
    }
    if (typeof notifyUrl !== 'string') {
        return res.send(403);
    }
    if (typeof merchantPosId !== 'string') {
        return res.send(403);
    }
    if (typeof description !== 'string') {
        return res.send(403);
    }
    if (typeof currencyCode !== 'string') {
        return res.send(403);
    }
    if (typeof totalAmount !== 'string') {
        return res.send(403);
    }
    if (typeof buyer !== 'object') {
        return res.send(403);
    }
    if (typeof settings !== 'object') {
        return res.send(403);
    }
    if (typeof products !== 'object') {
        return res.send(403);
    }

    const extOrderId = req.app.locals.db.Types.ObjectId().toString();
    const customerIp = req.ip;

    const options = {
        url: `${process.env.PAYU_API}/orders`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            extOrderId,
            payMethods: {
                payMethod: {
                    value: "ap",
                    type: "PBL",
                    authorizationCode: authorizationCode,
                }
            },
            notifyUrl: 'https://localhost:9000/notify',
            continueUrl: `https://localhost:3000/order/${extOrderId}`,
            customerIp,
            merchantPosId: merchantPosId,
            description: description,
            currencyCode: currencyCode,
            totalAmount: totalAmount,
            buyer: buyer,
            settings: settings,
            products: products,
        }),
    };

    let orderDoc;

    const callback = (err, response, body) => {
        if (err) {
            throw err;
        }
        const json = JSON.parse(body);

        orderDoc.set({
            orderId: json.orderId,
            redirectUri: json.redirectUri,
            statusCode: json.status.statusCode,
        });
        orderDoc.save(function(err, updatedOrder) {
            if (err) {
                throw err;
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
            throw err;
        }
        orderDoc = order;
        request.post(options, callback);
    });
});

// OrderRetrieveRequest
router.get('/:extOrderId', (req, res) => {
    const accessToken = req.headers.authorization;
    if (typeof accessToken !== 'string') {
        return res.send(403);
    }

    const { extOrderId } = req.params;
    if (typeof extOrderId !== 'string' || !extOrderId.trim()) {
        return res.send(403);
    }

    let orderDoc;

    const callback = (err, response, body) => {
        if (err) {
            throw err;
        }
        const json = JSON.parse(body);
        const properties = (json.properties || []).reduce((acc, {name, value}) => {
            acc[name] = value;
            return acc;
        }, {});

        orderDoc.set(Object.assign(properties, {statusCode: json.orders[0].status}));
        orderDoc.save(function(err, updatedOrder) {
            if (err) {
                throw err;
            }
            res.json(updatedOrder);
        });
    };

    OrderModel.findOne({ extOrderId: extOrderId }, function (err, order) {
        if (err) {
            throw err;
        }
        orderDoc = order;

        const options = {
            url: `${process.env.PAYU_API}/orders/${orderDoc.orderId}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${accessToken}`,
            },
        };

        request.get(options, callback);
    });
});

module.exports = router;
