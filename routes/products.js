const queryOptionsCheck = require('../middleware/queryOptionsCheck');
const sharp = require('sharp');

const resize = (buffer, dimensions, toFile) => sharp(buffer).resize(dimensions).toFile(toFile);

module.exports = (config) => {

    const {io, router, ProductModel, jwtCheck} = config;

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

    router.get('/:slug', (req, res, next) => {
        res.json({});
    });

    router.post('/', jwtCheck(), async (req, res, next) => {
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

    router.put('/:slug', jwtCheck(), (req, res, next) => {
        res.json({});
    });

    router.delete('/:slug', jwtCheck(), (req, res, next) => {
        res.json({});
    });

    return router;
};

