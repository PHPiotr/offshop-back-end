module.exports = (config) => {

    const {io, router, ProductModel, queryOptionsCheck, resize} = config;

    router.get('/', queryOptionsCheck(ProductModel), async (req, res, next) => {
        try {
            const projection = null;
            const query = ProductModel.find({}, projection, req.query.validQueryOptions);
            const docs = await query.exec();
            res.json(docs);
        } catch (err) {
            next(err);
        }
    });

    router.get('/:slug', async (req, res, next) => {
        try {
            const product = await ProductModel.findOne({slug: {$eq: req.params.slug}}).exec();
            res.json(product);
        } catch (e) {
            next(e);
        }
    });

    router.post('/', async (req, res, next) => {
        try {
            if (!Object.keys(req.files).length) {
                res.status(400);
                throw new Error('No files were uploaded.');
            }

            const product = await new ProductModel(req.body).save();

            const uploadedFile = req.files.img;
            const buffer = uploadedFile.data;
            const {slug} = product;
            await Promise.all([
                resize(buffer, {width: 320, height: 240}, `./public/images/products/${slug}.tile.png`),
                resize(buffer, {width: 40, height: 40}, `./public/images/products/${slug}.avatar.png`),
            ]);

            io.emit('createProduct', product);
            res.set('Location', `${process.env.API_URL}/products/${product.slug}`);
            res.status(201).json(product);
        } catch (e) {
            return next(e);
        }
    });

    router.put('/:slug', (req, res, next) => {
        res.json({});
    });

    router.patch('/:slug', (req, res, next) => {
        res.json({});
    });

    router.delete('/:slug', (req, res, next) => {
        res.json({});
    });

    return router;
};
