module.exports = (config) => {

    const {io, router, ProductModel, queryOptionsCheck, fileUtils} = config;

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

            const buffer = req.files.img.data;
            const {slug} = product;
            await Promise.all([
                fileUtils.resizeFile(buffer, {width: 320, height: 240}, `./public/images/products/${slug}.tile.png`),
                fileUtils.resizeFile(buffer, {width: 40, height: 40}, `./public/images/products/${slug}.avatar.png`),
            ]);

            const [tileBuffer, avatarBuffer] = await Promise.all([
                fileUtils.readFile(`./public/images/products/${slug}.tile.png`),
                fileUtils.readFile(`./public/images/products/${slug}.avatar.png`),
            ]);

            await Promise.all([
                fileUtils.s3UploadFile(tileBuffer, `${slug}.tile.png`),
                fileUtils.s3UploadFile(avatarBuffer, `${slug}.avatar.png`),
            ]);

            await Promise.all([
                fileUtils.removeFile(`./public/images/products/${slug}.tile.png`),
                fileUtils.removeFile(`./public/images/products/${slug}.avatar.png`),
            ]);

            io.emit('createProduct', product);
            res.set('Location', `${process.env.API_URL}/products/${product.slug}`);
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
                const buffer = req.files.img.data;
                try {
                    await Promise.all([
                        fileUtils.removeFile(`./public/images/products/${currentProduct.slug}.tile.png`),
                        fileUtils.removeFile(`./public/images/products/${currentProduct.slug}.avatar.png`),
                    ]);
                } catch (e) {
                    // Just log it
                    console.error(e);
                }
                try {
                    await Promise.all([
                        fileUtils.resizeFile(buffer, {width: 320, height: 240}, `./public/images/products/${updatedProduct.slug}.tile.png`),
                        fileUtils.resizeFile(buffer, {width: 40, height: 40}, `./public/images/products/${updatedProduct.slug}.avatar.png`),
                    ]);
                } catch (e) {
                    // Just log it
                    console.error(e);
                }
            } else {
                if (currentProduct.slug !== updatedProduct.slug) {
                    try {
                        await Promise.all([
                            fileUtils.renameFile(`./public/images/products/${currentProduct.slug}.tile.png`, `./public/images/products/${updatedProduct.slug}.tile.png`),
                            fileUtils.renameFile(`./public/images/products/${currentProduct.slug}.avatar.png`, `./public/images/products/${updatedProduct.slug}.avatar.png`),
                        ]);
                    } catch (e) {
                        // Just log it
                        console.error(e);
                    }
                }
            }

            if (!updatedProduct) {
                return res.sendStatus(404);
            }
            io.emit('updateProduct', updatedProduct);
            res.set('Location', `${process.env.API_URL}/admin/products/${updatedProduct.id}`);
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
                    fileUtils.removeFile(`./public/images/products/${product.slug}.tile.png`),
                    fileUtils.removeFile(`./public/images/products/${product.slug}.avatar.png`),
                ]);
            } catch (e) {
                // Just log it
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
