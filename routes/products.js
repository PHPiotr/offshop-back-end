const queryOptionsCheck = require('../middleware/queryOptionsCheck');

module.exports = (io, router, ProductModel) => {

    router.get('/', queryOptionsCheck(ProductModel), async (req, res, next) => {
        try {
            const projection = null;
            const query = ProductModel.find({ active: true }, projection, req.query.validQueryOptions);
            const docs = await query.exec();
            res.json(docs);
        } catch (err) {
            next(err);
        }
    });

    router.get('/:slug', (req, res, next) => {
        res.json({});
    });

    router.post('/', (req, res, next) => {
        ProductModel.create(req.body, function(err, product) {
            if (err) {
                return next(err);
            }

            io.emit('createProduct', product);

            res.set('Location', `${process.env.API_URL}/products/${product.slug}`);
            res.status(201).json(product);
        });
    });

    router.put('/:slug', (req, res, next) => {
        res.json({});
    });

    router.delete('/:slug', (req, res, next) => {
        res.json({});
    });

    return router;
};

