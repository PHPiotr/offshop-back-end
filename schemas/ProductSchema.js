const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CategorySchema = require('./CategorySchema');
const slugify = require('slugify');

const getMoney = require('../utils/getMoney');

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
    description: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 100,
        maxlength: 160,
    },
    longDescription: {
        type: String,
        trim: true,
        unique: true,
        minlength: 250,
        maxlength: 1000,
    },
    categoryId: {
        type: String,
    },
    category: CategorySchema,
    active: {
        type: Boolean,
        default: true,
    },
    stock: {
        type: Number,
        default: 1,
    },
    unitPrice: {
        type: Number,
        get: getMoney,
    },
    weight: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});

ProductSchema.pre('save', async function() {
    this.slug = slugify(this.slug || this.name, {lower: true});
});

ProductSchema.set('toJSON', {getters: true});

module.exports = ProductSchema;
