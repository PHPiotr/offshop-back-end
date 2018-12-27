const express = require('express');
const router = express.Router();
const CategoryModel = require('../models/CategoryModel');

router.get('/', (req, res, next) => {
    res.json([]);
});

router.get('/:slug', (req, res, next) => {
    res.json({});
});

router.post('/', (req, res, next) => {
    res.json({});
});

router.put('/:slug', (req, res, next) => {
    res.json({});
});

router.delete('/:slug', (req, res, next) => {
    res.json({});
});

module.exports = router;
