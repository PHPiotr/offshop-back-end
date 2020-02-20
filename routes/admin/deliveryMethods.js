module.exports = (config) => {

    const {
        apiUrl,
        io,
        router,
        model,
        DeliveryMethodSchema,
        queryOptionsCheck,
    } = config;

    const DeliveryMethodModel = model('Delivery', DeliveryMethodSchema);

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
                return res.sendStatus(404);
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

            io.to('admin').emit('adminCreateDelivery', {deliveryMethod});
            io.to('users').emit('createDelivery', {deliveryMethod});
            res.set('Location', `${apiUrl}/admin/delivery-methods/${deliveryMethod.id}`);
            res.status(201).json(deliveryMethod);
        } catch (e) {
            return next(e);
        }
    });

    router.put('/:deliveryMethodId', async (req, res, next) => {
        try {
            const {params: {deliveryMethodId}, body: {name, slug, unitPrice}} = req;
            const deliveryMethod = await DeliveryMethodModel.findById(deliveryMethodId).exec();
            if (!deliveryMethod) {
                return res.sendStatus(404);
            }
            Object.assign(deliveryMethod, {name, slug, unitPrice});
            await deliveryMethod.save();
            io.to('admin').emit('adminUpdateDelivery', {deliveryMethod});
            io.to('users').emit('updateDelivery', {deliveryMethod});
            res.set('Location', `${apiUrl}/admin/delivery-methods/${deliveryMethod.id}`);
            res.json(deliveryMethod);
        } catch (e) {
            return next(e);
        }
    });

    router.delete('/:deliveryMethodId', async (req, res, next) => {
        try {
            const deliveryMethod = await DeliveryMethodModel.findById(req.params.deliveryMethodId).exec();
            if (!deliveryMethod) {
                return res.sendStatus(404);
            }
            await DeliveryMethodModel.deleteOne({ _id: deliveryMethod._id });
            io.to('admin').emit('adminDeleteDelivery', {deliveryMethod});
            io.to('users').emit('deleteDelivery', {deliveryMethod});
            res.sendStatus(204);
        } catch (e) {
            return next(e);
        }
    });

    return router;
};
