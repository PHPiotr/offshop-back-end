const productsCheck = ProductModel => async (req, res, next) => {
    try {
        const {body: {products = {}, productsIds = []}} = req;
        const productsIdsLength = productsIds.length;
        if (!productsIdsLength) {
            throw new Error('Empty products ids');
        }
        let totalWeight = Number(req.body.totalWeight) || 0;
        let totalWithoutDelivery = 0;

        for (let i = 0; i < productsIdsLength; i++) {
            const productId = productsIds[i];
            const productData = products[productId];
            if (!productData) {
                throw new Error(`No products[${productId}] data`);
            }
            const product = await ProductModel.findById(productId);
            const {unitPrice, stock, name, weight} = product;
            if (Number(productData.unitPrice) !== unitPrice * 100) {
                throw new Error('Wrong product unit price');
            }
            if (parseInt(productData.quantity, 2) > stock) {
                throw new Error('Wrong product quantity');
            }
            if (productData.name !== name) {
                throw new Error('Wrong product name');
            }
            totalWeight -= weight * 100 * productData.quantity;
            totalWithoutDelivery += Number(productData.unitPrice) * productData.quantity;
        }

        if (totalWeight !== 0) {
            throw new Error('Wrong total weight');
        }
        if (totalWithoutDelivery !== req.body.totalWithoutDelivery) {
            throw new Error('Wrong total amount');
        }
        next();
    } catch (err) {
        res.status(400);
        return next(err);
    }
};

module.exports = productsCheck;
