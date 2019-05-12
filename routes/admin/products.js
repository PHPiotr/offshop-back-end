module.exports = (config) => {

    const {io, router, ProductModel, queryOptionsCheck, fileUtils} = config;

    const processUpload = async (buffer, id) => {
        try {
            let data = [];
            const tilePath = `./public/images/products/${id}.tile.jpg`;
            const avatarPath = `./public/images/products/${id}.avatar.jpg`;
            await Promise.all([
                fileUtils.resizeFile(buffer, {width: 320, height: 240}, tilePath),
                fileUtils.resizeFile(buffer, {width: 40, height: 40}, avatarPath),
            ]);
            try {
                const [tileBuffer, avatarBuffer] = await Promise.all([
                    fileUtils.readFile(tilePath),
                    fileUtils.readFile(avatarPath),
                ]);

                data = await Promise.all([
                    fileUtils.s3UploadFile(tileBuffer, `${id}.tile.jpg`),
                    fileUtils.s3UploadFile(avatarBuffer, `${id}.avatar.jpg`),
                ]);
            } catch (e) {
                console.error(e);
            }

            await Promise.all([
                fileUtils.removeFile(tilePath),
                fileUtils.removeFile(avatarPath),
            ]);

            return data;
        } catch (e) {
            console.error(e);
        }
    };

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
            const {id} = product;

            await processUpload(req.files.img.data, id);

            io.emit('createProduct', product);
            res.set('Location', `${process.env.API_URL}/admin/products/${id}`);
            res.status(201).json(product);
        } catch (e) {
            return next(e);
        }
    });

    router.put('/:productId', async (req, res, next) => {
        try {
            const currentProduct = await ProductModel.findById(req.params.productId).exec();
            if (!currentProduct) {
                return res.send(404);
            }

            const updatedProduct = await ProductModel.findByIdAndUpdate(
                req.params.productId,
                {$set: req.body},
                {runValidators: true, new: true}
            );

            if (Object.keys(req.files || {}).length) {
                const {id} = updatedProduct;
                try {
                    await Promise.all([
                        fileUtils.s3DeleteFiles([`${id}.tile.jpg`, `${id}.avatar.jpg`]),
                    ]);
                } catch (e) {
                    console.error(e);
                }
                await processUpload(req.files.img.data, id);
            }

            if (!updatedProduct) {
                return res.sendStatus(404);
            }
            io.emit('updateProduct', updatedProduct);
            res.set('Location', `${process.env.API_URL}/admin/products/${id}`);
            res.json(updatedProduct);
        } catch (e) {
            return next(e);
        }
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
                    fileUtils.s3DeleteFiles([`${product.id}.tile.jpg`, `${product.id}.avatar.jpg`]),
                ]);
            } catch (e) {
                console.error(e);
            } finally {
                io.emit('deleteProduct', product);
                res.sendStatus(204);
            }
        } catch (e) {
            return next(e);
        }
    });

    return router;
};
