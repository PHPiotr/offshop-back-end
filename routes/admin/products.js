module.exports = (config) => {

    const {
        apiUrl,
        io,
        router,
        model,
        ProductSchema,
        queryOptionsCheck,
        fileUtils,
    } = config;

    const ProductModel = model('Product', ProductSchema);

    const processUpload = async (buffer, id) => {
        let data = null;
        const avatarPath = `./public/images/products/${id}.avatar.jpg`;
        const cardPath = `./public/images/products/${id}.card.jpg`;
        const tilePath = `./public/images/products/${id}.tile.jpg`;
        try {
            await Promise.all([
                fileUtils.resizeFile(buffer, {width: 40, height: 40}, avatarPath),
                fileUtils.resizeFile(buffer, {width: 800, height: 600}, cardPath),
                fileUtils.resizeFile(buffer, {width: 320, height: 240}, tilePath),
            ]);
            const [avatarBuffer, cardBuffer, tileBuffer] = await Promise.all([
                fileUtils.readFile(avatarPath),
                fileUtils.readFile(cardPath),
                fileUtils.readFile(tilePath),
            ]);
            try {
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
                return data;
            } catch (e) {
                await fileUtils.s3DeleteFiles([`${id}.avatar.jpg`, `${id}.card.jpg`, `${id}.tile.jpg`]);
            }
        } catch {
            await Promise.all([
                fileUtils.removeFile(cardPath),
                fileUtils.removeFile(tilePath),
                fileUtils.removeFile(avatarPath),
            ]);
        } finally {
            return data;
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
                return res.sendStatus(404);
            }
            res.json(product);
        } catch (e) {
            next(e);
        }
    });

    router.post('/', async (req, res, next) => {
        try {
            if (!req.files || !Object.keys(req.files).length) {
                res.status(400);
                throw new Error('No files were uploaded.');
            }

            const product = await new ProductModel(req.body).save();
            const {id, active} = product;

            const uploadedImagesData = await processUpload(req.files.img.data, id);
            Object.assign(product, {images: [uploadedImagesData]});
            await product.save();

            io.to('admin').emit('adminCreateProduct', {product, isActive: active});
            io.to('users').emit('createProduct', {product, isActive: active});
            res.set('Location', `${apiUrl}/admin/products/${id}`);
            res.status(201).json(product);
        } catch (e) {
            return next(e);
        }
    });

    router.put('/:productId', async (req, res, next) => {
        try {
            const {params: {productId}} = req;
            const product = await ProductModel.findById(productId).exec();
            if (!product) {
                return res.sendStatus(404);
            }
            const wasActive = product.active;

            let uploadedImagesData = null;
            if (Object.keys(req.files || {}).length) {
                uploadedImagesData = await processUpload(req.files.img.data, productId);
            }

            Object.assign(product, req.body, uploadedImagesData ? {images: [uploadedImagesData]} : {});
            await product.save();
            const isActive = product.active;

            io.to('admin').emit('adminUpdateProduct', {product, wasActive, isActive});
            io.to('users').emit('updateProduct', {product, wasActive, isActive});
            res.set('Location', `${apiUrl}/admin/products/${productId}`);
            res.json(product);
        } catch (e) {
            return next(e);
        }
    });

    router.delete('/:productId', async (req, res, next) => {
        try {
            const {params: {productId}} = req;
            const product = await ProductModel.findById(productId).exec();
            if (!product) {
                return res.sendStatus(404);
            }
            const {active} = product;
            await ProductModel.deleteOne({ _id: product._id });
            await Promise.all([
                fileUtils.s3DeleteFiles([`${product.id}.tile.jpg`, `${product.id}.avatar.jpg`]),
            ]);
            io.to('admin').emit('adminDeleteProduct', {product, wasActive: active});
            io.to('users').emit('deleteProduct', {product, wasActive: active});
            res.sendStatus(204);
        } catch (e) {
            return next(e);
        }
    });

    return router;
};
