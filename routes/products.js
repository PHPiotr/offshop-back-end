const queryOptionsCheck = require('../middleware/queryOptionsCheck');

module.exports = (config) => {

    const {io, router, ProductModel, jwtCheck} = config;

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

    router.post('/', jwtCheck(), (req, res, next) => {
        if (!Object.keys(req.files).length) {
            res.status(400);
            return next(new Error('No files were uploaded.'));
        }
        const uploadedFile = req.files.img;

        req.body.img = uploadedFile.name;
        ProductModel.create(req.body, function(err, product) {
            if (err) {
                return next(err);
            }
            uploadedFile.mv(`./public/images/products/${product.img}`, function(err) {
                if (err) {
                    // TODO: Product created with no image
                }
                io.emit('createProduct', product);

                res.set('Location', `${process.env.API_URL}/products/${product.slug}`);
                res.status(201).json(product);
            });
        });
    });

    router.put('/:slug',  jwtCheck(), (req, res, next) => {
        res.json({});
    });

    router.delete('/:slug',  jwtCheck(), (req, res, next) => {
        res.json({});
    });

    return router;
};

