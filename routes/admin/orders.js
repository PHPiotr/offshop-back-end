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

    return router;
};
