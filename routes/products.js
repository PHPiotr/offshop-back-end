const queryOptionsCheck = require('../middleware/queryOptionsCheck');
const sharp = require('sharp');
const slugify = require('slugify');

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

    router.post('/', jwtCheck(), (req, res, next) => {
        if (!Object.keys(req.files).length) {
            res.status(400);
            return next(new Error('No files were uploaded.'));
        }
        const uploadedFile = req.files.img;

        const buffer = uploadedFile.data;
        const slug = slugify(req.body.name, {lower: true});

        Promise.all([
            resize(buffer, {width: 800, height: 600}, `./public/images/products/${slug}.800x600.png`),
            resize(buffer, {width: 320, height: 240}, `./public/images/products/${slug}.320x240.png`),
            resize(buffer, {width: 40, height: 40}, `./public/images/products/${slug}.40x40.png`),
        ]).then(() => {
            ProductModel.create(req.body, function (err, product) {
                if (err) {
                    return next(err);
                }
                io.emit('createProduct', product);

                res.set('Location', `${process.env.API_URL}/products/${product.slug}`);
                res.status(201).json(product);
            });
        }).catch(err => {
            return next(err);
        });
    });

    router.put('/:slug', jwtCheck(), (req, res, next) => {
        res.json({});
    });

    router.delete('/:slug', jwtCheck(), (req, res, next) => {
        res.json({});
    });

    return router;
};

