const mongoose = require('mongoose');
const ProductSchema = require('../schemas/ProductSchema');

const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel;
