const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CategorySchema = require('./CategorySchema');
const slugify = require('slugify');

const getMoney = value => (value / 100).toFixed(2);

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
    unitPrice: {
        type: Number,
        get: getMoney,
    },
    weight: {
        type: Number,
        required: true,
    },
    img: String,
}, {
    timestamps: true,
});

ProductSchema.pre('save', async function() {
    this.slug = slugify(this.name, {lower: true});
    this.img = `${this.slug}.png`;
});

ProductSchema.set('toJSON', {getters: true});

module.exports = ProductSchema;
