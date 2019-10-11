const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slugify = require('slugify');

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
    },
    active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

DeliveryMethodSchema.pre('validate', async function() {
    this.slug = slugify(this.slug || this.name, {lower: true});
});

DeliveryMethodSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function(doc, ret) {
        ret.unitPrice = '' + ret.unitPrice;
        delete ret._id;
    },
});

module.exports = DeliveryMethodSchema;
