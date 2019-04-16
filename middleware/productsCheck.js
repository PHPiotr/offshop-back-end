const productsCheck = ProductModel => async (req, res, next) => {
    const {body: {products = {}, productsIds = []}} = req;
    if (!productsIds.length) {
        res.status(400);
        return next(new Error('Empty products ids'));
    }
    productsIds.forEach(async productId => {
        const productData = products[productId];
        if (!productData) {
            res.status(400);
            return next(new Error(`No products[${productId}] data`));
        }
        try {
            const {unitPrice, stock, name} = await ProductModel.findById(productId).exec();
            if (productData.unitPrice / 100 !== parseFloat(unitPrice)) {
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
        } catch (err) {
            return next(err);
        }

    });
    return next();
};

module.exports = productsCheck;
