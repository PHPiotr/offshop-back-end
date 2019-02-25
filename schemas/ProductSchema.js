const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CategorySchema = require('./CategorySchema');
const slugify = require('slugify');

const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    slug: {
        type: String,
        trim: true,
        unique: true,
    },
    categoryId: {
        type: String,
    },
    category: CategorySchema,
    active: {
        type: Boolean,
        default: true,
    },
    quantity: {
        type: Number,
        default: 1,
    },
    price: {
        type: Number,
        required: true,
    },
    unitPrice: {
        type: Number,
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

ProductSchema.pre('save', async function() {
    this.slug = slugify(this.name, {lower: true});
    this.unitPrice = this.unitsPerProduct === 1 ? this.price : this.price / this.unitsPerProduct;
    this.img = slugify(this.img);
});

module.exports = ProductSchema;
