const mongoose = require('mongoose');
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;
const ProductSchema = require('./ProductSchema');

const OrderSchema = new Schema({
    extOrderId: ObjectId,
    totalAmount: String,
    customerIp: String,
    description: String,
    buyer: {
        type: Map,
        of: String,
    },
    currencyCode: String,
    products: [ProductSchema],
    payuOrderId: String,
    payuRedirectUri: String,
    payuStatusSeverity: String,
    payuStatusCode: String,
}, {
    timestamps: true,
});

module.exports = OrderSchema;
