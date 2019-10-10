module.exports = (config) => {

    const {axios, io, router, OrderModel, queryOptionsCheck} = config;

    // listOrders
    router.get('/', queryOptionsCheck(OrderModel), async (req, res, next) => {
        try {
            const projection = 'extOrderId status totalAmount orderCreateDate';
            const query = OrderModel.find({status: {$nin: ['LOCAL_SOFT_DELETED']}}, projection, req.query.validQueryOptions);
            const docs = await query.exec();
            res.json(docs);
        } catch (err) {
            next(err);
        }
    });

    // viewOrder
    router.get('/:extOrderId', async (req, res, next) => {
        try {
            const doc = await OrderModel.findOne({extOrderId: req.params.extOrderId}).exec();
            if (!doc) {
                return res.sendStatus(404);
            }
            res.json(doc);
        } catch (e) {
            next(e);
        }
    });

    // cancelOrder
    router.put('/:extOrderId', async (req, res, next) => {
        try {
            const doc = await OrderModel.findOne({extOrderId: req.params.extOrderId}).exec();
            if (!doc) {
                return res.sendStatus(404);
            }

            const cancelOrderResponse = await axios({
                url: `${process.env.PAYU_API}/orders/${doc.orderId}`,
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.body.payuToken}`,
                },
                maxRedirects: 0,
                validateStatus: status => status === 200,
            });
            if (cancelOrderResponse.data.error) {
                return next(new Error(cancelOrderResponse.data.error));
            }

            const canceledOrder = await OrderModel.findOneAndUpdate(
                {extOrderId: cancelOrderResponse.data.extOrderId},
                {$set: {status: 'CANCELED'}},
                {new: true, runValidators: true}
            ).exec();

            return res.json(canceledOrder);
        } catch (e) {
            next(e);
        }
    });

    // deleteOrder
    router.delete('/:extOrderId', async (req, res, next) => {
        try {
            const doc = await OrderModel.findOne({extOrderId: req.params.extOrderId}).exec();
            if (!doc) {
                return res.sendStatus(404);
            }

            await OrderModel.findOneAndUpdate(
                {extOrderId: req.params.extOrderId},
                {$set: {status: 'LOCAL_SOFT_DELETED'}},
                {runValidators: true}
            ).exec();

            res.sendStatus(204);
        } catch (e) {
            next(e);
        }
    });

    // refundOrder
    router.post('/:extOrderId/refunds', async (req, res, next) => {
        try {
            const doc = await OrderModel.findOne({extOrderId: req.params.extOrderId}).exec();
            if (!doc) {
                return res.sendStatus(404);
            }

            const refundOrderResponse = await axios({
                url: `${process.env.PAYU_API}/orders/${doc.orderId}/refunds`,
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.body.payuToken}`,
                },
                data: {
                    refund: req.body.refund,
                },
                maxRedirects: 0,
                validateStatus: status => status === 200,
            });

            try {
                await OrderModel.findOneAndUpdate(
                    {extOrderId: req.params.extOrderId},
                    {$set: {refund: refundOrderResponse.data}},
                    {runValidators: true}
                ).exec();
            } finally {
                res.status(refundOrderResponse.status).json(refundOrderResponse.data);
            }

        } catch (e) {
            next(e);
        }
    });

    return router;
};
