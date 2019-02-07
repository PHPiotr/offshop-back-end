const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CategorySchema = require('./CategorySchema');

const ProductSchema = new Schema({
    name: String,
    slug: String,
    categoryId: String,
    category: CategorySchema,
    active: {
        type: Boolean,
        default: true,
    },
    quantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        default: 0,
    },
    unitPrice: {
        type: Number,
        default: 0,
    },
    unitsPerProduct: {
        type: Number,
        default: 1,
    },
    unit: {
        type: String,
        default: 'kg',
    },
    img: String,
}, {
    timestamps: true,
});

module.exports = ProductSchema;
