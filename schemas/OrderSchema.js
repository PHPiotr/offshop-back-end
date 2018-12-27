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
    orderId: String,
    redirectUri: String,
    status: String,
    properties: {
        type: Map,
        of: String,
    }
}, {
    timestamps: true,
});

module.exports = OrderSchema;