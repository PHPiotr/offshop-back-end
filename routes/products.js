module.exports = (config) => {

    const {router, ProductModel, queryOptionsCheck} = config;

    router.get('/', queryOptionsCheck(ProductModel), async (req, res, next) => {
        try {
            const projection = null;
            const query = ProductModel.find({active: true}, projection, req.query.validQueryOptions);
            const docs = await query.exec();
            res.json(docs);
        } catch (err) {
            next(err);
        }
    });

    router.get('/:slug', async (req, res, next) => {
        try {
            const product = await ProductModel.findOne({slug: {$eq: req.params.slug}}, {active: 0}).exec();
            if (product) {
                res.json(product);
            } else {
                res.sendStatus(404);
            }
        } catch (e) {
            next(e);
        }
    });

    return router;
};

