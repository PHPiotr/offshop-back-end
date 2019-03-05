const queryOptionsCheck = require('../middleware/queryOptionsCheck');

module.exports = (config) => {

    const {io, router, DeliveryMethodModel, jwtCheck} = config;

    router.get('/', queryOptionsCheck(DeliveryMethodModel), async (req, res, next) => {
        try {
            const projection = null;
            const query = DeliveryMethodModel.find({active: true}, projection, req.query.validQueryOptions);
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
            const delivery = await new DeliveryMethodModel(req.body).save();
            io.emit('createDelivery', delivery);
            res.set('Location', `${process.env.API_URL}/delivery-methods/${delivery.slug}`);
            res.status(201).json(delivery);
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

