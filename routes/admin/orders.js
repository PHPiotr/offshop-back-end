module.exports = (config) => {

    const {io, router, OrderModel, queryOptionsCheck} = config;

    router.get('/', queryOptionsCheck(OrderModel), async (req, res, next) => {
        try {
            const projection = null;
            const query = OrderModel.find({}, projection, req.query.validQueryOptions);
            const docs = await query.exec();
            res.json(docs);
        } catch (err) {
            next(err);
        }
    });

    router.get('/:extOrderId', async (req, res, next) => {
        try {
            const doc = await OrderModel.findOne({extOrderId: req.params.extOrderId}).exec();
            if (!doc) {
                return res.send(404);
            }
            res.json(doc);
        } catch (e) {
            next(e);
        }
    });

    return router;
};
