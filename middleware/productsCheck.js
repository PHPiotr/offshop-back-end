const productsCheck = ProductModel => async (req, res, next) => {
    try {
        const {body: {products = {}, productsIds = []}} = req;
        if (!productsIds.length) {
            res.status(400);
            return next(new Error('Empty products ids'));
        }
        productsIds.forEach(productId => {
            const productData = products[productId];
            if (!productData) {
                res.status(400);
                return next(new Error(`No products[${productId}] data`));
            }
            ProductModel.findById(productId, function(err, product) {
                const {unitPrice, stock, name} = product;
                if (productData.unitPrice !== unitPrice * 100) {
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
                next();
            });
        });
    } catch (err) {
        res.status(400);
        return next(err);
    }
};

module.exports = productsCheck;
