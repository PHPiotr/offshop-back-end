module.exports = (config) => {

    const {io, router, DeliveryMethodModel, queryOptionsCheck} = config;

    router.get('/', queryOptionsCheck(DeliveryMethodModel), async (req, res, next) => {
        try {
            const projection = null;
            const query = DeliveryMethodModel.find({}, projection, req.query.validQueryOptions);
            const docs = await query.exec();
            res.json(docs);
        } catch (err) {
            next(err);
        }
    });

    router.get('/:deliveryMethodId', async (req, res, next) => {
        try {
            const deliveryMethod = await DeliveryMethodModel.findById(req.params.deliveryMethodId).exec();
            if (!deliveryMethod) {
                return res.send(404);
            }
            res.json(deliveryMethod);
        } catch (e) {
            next(e);
        }
    });

    router.post('/', async (req, res, next) => {
        try {
            const {name, slug, unitPrice} = req.body;
            const deliveryMethod = await new DeliveryMethodModel({name, slug, unitPrice}).save();

            io.emit('createDeliveryMethod', deliveryMethod);
            res.set('Location', `${process.env.API_URL}/admin/delivery-methods/${deliveryMethod.id}`);
            res.status(201).json(deliveryMethod);
        } catch (e) {
            return next(e);
        }
    });

    router.put('/:deliveryMethodId', async (req, res, next) => {
        try {
            const currentDeliveryMethod = await DeliveryMethodModel.findById(req.params.deliveryMethodId).exec();
            if (!currentDeliveryMethod) {
                return res.send(404);
            }

            const {name, slug, unitPrice} = req.body;

            const updatedDeliveryMethod = await DeliveryMethodModel.findByIdAndUpdate(
                req.params.deliveryMethodId,
                {$set: {name, slug, unitPrice: unitPrice}},
                {runValidators: true, new: true}
            );

            if (!updatedDeliveryMethod) {
                return res.sendStatus(404);
            }
            io.emit('updateDeliveryMethod', updatedDeliveryMethod);
            res.set('Location', `${process.env.API_URL}/admin/delivery-methods/${updatedDeliveryMethod.id}`);
            res.json(updatedDeliveryMethod);
        } catch (e) {
            return next(e);
        }
    });

    router.delete('/:deliveryMethodId', async (req, res, next) => {
        try {
            const deliveryMethod = await DeliveryMethodModel.findById(req.params.deliveryMethodId).exec();
            if (!deliveryMethod) {
                return res.send(404);
            }
            await DeliveryMethodModel.deleteOne({ _id: deliveryMethod._id });
            io.emit('deleteDeliveryMethod', deliveryMethod);
            res.sendStatus(204);
        } catch (e) {
            return next(e);
        }
    });

    return router;
};
