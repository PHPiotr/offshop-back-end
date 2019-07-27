const productsCheck = ProductModel => async (req, res, next) => {
    try {
        const {body: {productsById = {}, productsIds = []}} = req;
        const productsIdsLength = productsIds.length;
        if (!productsIdsLength) {
            throw new Error('Empty products ids');
        }
        let totalWeight = Number(req.body.totalWeight) || 0;
        let totalWithoutDelivery = 0;

        for (let i = 0; i < productsIdsLength; i++) {
            const productId = productsIds[i];
            const productData = productsById[productId];
            if (!productData) {
                throw new Error(`No products[${productId}] data`);
            }
            const product = await ProductModel.findById(productId);
            const {unitPrice, stock, name, weight, active} = product;
            if (Number(productData.unitPrice) !== unitPrice) {
                throw new Error('Wrong product unit price');
            }
            if (Number(productData.quantity) > stock) {
                throw new Error('Wrong product quantity');
            }
            if (productData.name !== name) {
                throw new Error('Wrong product name');
            }
            if (!active) {
                throw new Error(`${name} - inactive product`);
            }
            totalWeight -= weight * Number(productData.quantity);
            totalWithoutDelivery += Number(productData.unitPrice) * Number(productData.quantity);
        }

        if (totalWeight !== 0) {
            throw new Error('Wrong total weight');
        }
        if (totalWithoutDelivery !== Number(req.body.totalWithoutDelivery)) {
            throw new Error('Wrong total amount');
        }
        next();
    } catch (err) {
        res.status(400);
        return next(err);
    }
};

module.exports = productsCheck;
