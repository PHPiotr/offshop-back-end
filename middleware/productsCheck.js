const productsCheck = ProductModel => async (req, res, next) => {
    try {
        const {body: {products = {}, productsIds = []}} = req;
        const productsIdsLength = productsIds.length;
        if (!productsIdsLength) {
            res.status(400);
            return next(new Error('Empty products ids'));
        }
        let totalWeight = Number(req.body.totalWeight) || 0;
        let totalWithoutDelivery = 0;

        productsIds.forEach((productId, index) => {
            const productData = products[productId];
            if (!productData) {
                res.status(400);
                return next(new Error(`No products[${productId}] data`));
            }
            ProductModel.findById(productId, function(err, product) {
                const {unitPrice, stock, name} = product;
                if (Number(productData.unitPrice) !== unitPrice * 100) {
                    res.status(400);
                    return next(new Error('Wrong product unit price'));
                }
                if (parseInt(productData.quantity, 2) > stock) {
                    res.status(400);
                    return next(new Error('Wrong product quantity'));
                }
                if (productData.name !== name) {
                    res.status(400);
                    return next(new Error('Wrong product name'));
                }
                totalWeight -= product.weight * 100 * productData.quantity / 100;
                totalWithoutDelivery += Number(productData.unitPrice) * productData.quantity;
                if (productsIdsLength === index + 1) {
                    if (totalWeight !== 0) {
                        res.status(400);
                        return next(new Error('Wrong total weight'));
                    }
                    if (totalWithoutDelivery !== req.body.totalWithoutDelivery) {
                        res.status(400);
                        return next(new Error('Wrong total amount'));
                    }
                    next(err);
                }
            });
        });
    } catch (err) {
        res.status(400);
        return next(err);
    }
};

module.exports = productsCheck;
