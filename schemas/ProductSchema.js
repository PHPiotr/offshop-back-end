const mongoose = require('mongoose');
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;

const ProductSchema = new Schema({
    name: String,
    unitPrice: String,
    quantity: String,
}, {
    timestamps: true,
});

module.exports = ProductSchema;
