const express = require('express');
const router = express.Router();
const ProductModel = require('../models/ProductModel');
const queryOptionsCheck = require('../middleware/queryOptionsCheck');

router.get('/', queryOptionsCheck, async (req, res, next) => {
    try {
        const projection = null;
        const query = ProductModel.find({ active: true }, projection, req.query.validQueryOptions);
        const docs = await query.exec();
        res.json(docs);
    } catch (err) {
        next(err);
    }
});

router.get('/:slug', (req, res, next) => {
    res.json({});
});

router.post('/', (req, res, next) => {
    ProductModel.create(req.body, function(err, product) {
        if (err) {
            return next(err);
        }

        res.set('Location', `https://localhost:9000/products/${product.slug}`);
        res.json(product);
    });
});

router.put('/:slug', (req, res, next) => {
    res.json({});
});

router.delete('/:slug', (req, res, next) => {
    res.json({});
});

module.exports = router;
