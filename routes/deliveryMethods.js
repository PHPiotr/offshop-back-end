module.exports = config => {

    const {router, model, DeliveryMethodSchema, queryOptionsCheck} = config;

    const DeliveryMethodModel = model('Delivery', DeliveryMethodSchema);

    router.get('/', queryOptionsCheck(DeliveryMethodModel), async (req, res, next) => {
        try {
            const projection = null;
            const query = DeliveryMethodModel.find({active: true}, projection, req.query.validQueryOptions);
            const docs = await query.exec();
            res.json(docs);
        } catch (err) {
            next(err);
        }
    });

    router.get('/:slug', async (req, res, next) => {
        try {
            const deliveryMethod = await DeliveryMethodModel.findOne({slug: {$eq: req.params.slug}, active: {$eq: true}}).exec();
            if (deliveryMethod) {
                res.json(deliveryMethod);
            } else {
                res.sendStatus(404);
            }
        } catch (e) {
            next(e);
        }
    });

    return router;
};

