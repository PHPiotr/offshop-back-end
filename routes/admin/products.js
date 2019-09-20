module.exports = (config) => {

    const {io, router, ProductModel, queryOptionsCheck, fileUtils} = config;

    const processUpload = async (buffer, id) => {
        try {
            let data = null;
            const avatarPath = `./public/images/products/${id}.avatar.jpg`;
            const cardPath = `./public/images/products/${id}.card.jpg`;
            const tilePath = `./public/images/products/${id}.tile.jpg`;
            await Promise.all([
                fileUtils.resizeFile(buffer, {width: 40, height: 40}, avatarPath),
                fileUtils.resizeFile(buffer, {width: 800, height: 600}, cardPath),
                fileUtils.resizeFile(buffer, {width: 320, height: 240}, tilePath),
            ]);
            try {
                const [avatarBuffer, cardBuffer, tileBuffer] = await Promise.all([
                    fileUtils.readFile(avatarPath),
                    fileUtils.readFile(cardPath),
                    fileUtils.readFile(tilePath),
                ]);

                const [avatar, card, tile] = await Promise.all([
                    fileUtils.s3UploadFile(avatarBuffer, `${id}.avatar.jpg`),
                    fileUtils.s3UploadFile(cardBuffer, `${id}.card.jpg`),
                    fileUtils.s3UploadFile(tileBuffer, `${id}.tile.jpg`),
                ]);
                data = {
                    avatar: `${avatar.Key}?${avatar.ETag.substring(1, avatar.ETag.length - 1)}`,
                    card: `${card.Key}?${card.ETag.substring(1, card.ETag.length - 1)}`,
                    tile: `${tile.Key}?${tile.ETag.substring(1, tile.ETag.length - 1)}`,
                };
            } catch (e) {
                console.error(e);
            }

            await Promise.all([
                fileUtils.removeFile(cardPath),
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

            const currentProduct = await new ProductModel(req.body).save();
            const {id} = currentProduct;

            const uploadedImagesData = await processUpload(req.files.img.data, id);
            Object.assign(currentProduct, {images: [uploadedImagesData]});
            await currentProduct.save();

            io.emit('createProduct', currentProduct);
            res.set('Location', `${process.env.API_URL}/admin/products/${id}`);
            res.status(201).json(currentProduct);
        } catch (e) {
            return next(e);
        }
    });

    router.put('/:productId', async (req, res, next) => {
        try {
            const {productId} = req.params;
            const currentProduct = await ProductModel.findById(productId).exec();
            if (!currentProduct) {
                return res.send(404);
            }

            let uploadedImagesData = null;
            if (Object.keys(req.files || {}).length) {
                uploadedImagesData = await processUpload(req.files.img.data, productId);
            }

            Object.assign(currentProduct, req.body, uploadedImagesData ? {images: [uploadedImagesData]} : {});
            await currentProduct.save();

            io.emit('updateProduct', currentProduct);
            res.set('Location', `${process.env.API_URL}/admin/products/${productId}`);
            res.json(currentProduct);
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
