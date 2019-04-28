module.exports = (config) => {

    const {io, router, ProductModel, queryOptionsCheck, resize, removeFile} = config;

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

    router.get('/:productId', async (req, res, next) => {
        try {
            const product = await ProductModel.findById(req.params.productId).exec();
            if (!product) {
                return res.send(404);
            }
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

    router.delete('/:productId', async (req, res, next) => {
        try {
            const product = await ProductModel.findById(req.params.productId).exec();
            if (!product) {
                return res.send(404);
            }
            await ProductModel.deleteOne({ _id: product._id });
            try {
                await Promise.all([
                    removeFile(`./public/images/products/${product.slug}.tile.png`),
                    removeFile(`./public/images/products/${product.slug}.avatar.png`),
                ]);
            } catch (e) {
                // Just log it
                console.error(e);
            } finally {
                res.sendStatus(204);
            }
        } catch (e) {
            return next(e);
        }
    });

    return router;
};
