const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slugify = require('slugify');
const getMoney = require('../utils/getMoney');

const DeliveryMethodSchema = new Schema({
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
    unitPrice: {
        type: Number,
        get: getMoney,
    },
}, {
    timestamps: true,
});

DeliveryMethodSchema.pre('save', async function() {
    this.slug = slugify(this.slug || this.name, {lower: true});
});

DeliveryMethodSchema.set('toJSON', {getters: true});

module.exports = DeliveryMethodSchema;
