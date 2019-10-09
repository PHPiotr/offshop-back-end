const mongoose = require('mongoose');
uniqueValidator = require('mongoose-unique-validator');
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
    description: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 15,
        maxlength: 160,
    },
    longDescription: {
        type: String,
        trim: true,
        unique: true,
        minlength: 15,
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
    },
    weight: {
        type: Number,
        required: true,
    },
    images: {
        type: [Object],
    },
}, {
    timestamps: true,
});

ProductSchema.pre('validate', async function() {
    this.slug = slugify(this.slug || this.name, {lower: true});
});

ProductSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function(doc, ret) {
        delete ret._id;
    },
});

ProductSchema.plugin(uniqueValidator, { message: '{PATH} to be unique.' });

module.exports = ProductSchema;
