const express = require('express');
const router = express.Router();
const ProductModel = require('../models/ProductModel');

router.get('/', (req, res, next) => {
    ProductModel.find({}, function(err, products) {
        if (err) {
            return next(err);
        }
        res.json(products);
    });
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
