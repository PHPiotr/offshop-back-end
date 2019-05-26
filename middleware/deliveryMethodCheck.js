const deliveryMethodCheck = DeliveryMethodModel => async (req, res, next) => {
    try {
        const {body: {deliveryMethod}} = req;
        if (!deliveryMethod || !deliveryMethod.id) {
            res.status(400);
            return next(new Error('Missing delivery method'));
        }
        DeliveryMethodModel.findById(deliveryMethod.id, function(err, doc) {
            if (!doc) {
                res.status(400);
                return next(new Error('Delivery method does not exist'));
            }
            if (!doc.active) {
                res.status(400);
                return next(new Error('Delivery method is nt active'));
            }
            if (deliveryMethod.unitPrice !== doc.unitPrice) {
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
            const expectedTotal = doc.unitPrice * 100 * (req.body.totalWeight * 10 * 10) / 100;
            const receivedTotal = req.body.totalAmount - req.body.totalWithoutDelivery;
            if (expectedTotal !== receivedTotal) {
                res.status(400);
                return next(new Error('Wrong delivery cost'));
            }
            return next(err);
        });
    } catch (err) {
        res.status(400);
        return next(err);
    }
};

module.exports = deliveryMethodCheck;
