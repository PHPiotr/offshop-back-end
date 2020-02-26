const deliveryMethodCheck = DeliveryMethodModel => async (req, res, next) => {
    try {
        const {body: {deliveryMethod}} = req;
        if (!deliveryMethod || !deliveryMethod.id) {
            res.status(400);
            return next(new Error('Missing delivery method'));
        }
        const doc = await DeliveryMethodModel.findById(deliveryMethod.id);
        if (!doc) {
            res.status(400);
            return next(new Error('Delivery method does not exist'));
        }
        if (!doc.active) {
            res.status(400);
            return next(new Error('Delivery method is nt active'));
        }
        if (Number(deliveryMethod.unitPrice) !== doc.unitPrice) {
            res.status(400);
            return next(new Error('Wrong delivery method unit price'));
        }
        if (deliveryMethod.name !== doc.name) {
            res.status(400);
            return next(new Error('Wrong delivery method name'));
        }
        if (deliveryMethod.slug !== doc.slug) {
            res.status(400);
            return next(new Error('Wrong delivery method slug'));
        }
        next();
    } catch (err) {
        res.status(400);
        return next(err);
    }
};

module.exports = deliveryMethodCheck;
