const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CategorySchema = require('./CategorySchema');

const ProductSchema = new Schema({
    name: String,
    unitPrice: String,
    quantity: String,
    categoryId: String,
    category: CategorySchema,
    name: String,
    slug: String,
    active: {
        type: Boolean,
        default: true,
    },
    quantity: {
        type: Number,
        default: 0,
    },
    inCart: {
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
    img: String,
    unitsPerProduct: {
        type: Number,
        default: 1,
    },
    unit: {
        type: String,
        default: 'kg',
    },
}, {
    timestamps: true,
});

module.exports = ProductSchema;
