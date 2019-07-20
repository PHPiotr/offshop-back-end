const mongoose = require('mongoose');
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;

const OrderSchema = new Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    extOrderId: {
        type: ObjectId,
        required: true,
        unique: true,
    },
    orderCreateDate: Date,
    notifyUrl: String,
    customerIp: String,
    merchantPosId: String,
    description: String,
    currencyCode: String,
    totalAmount: String,
    totalWithoutDelivery: Number,
    totalWeight: Number,
    buyer: Object,
    deliveryMethod: Object,
    payMethod: Object,
    status: {
        type: String,
        enum: ['PENDING', 'WAITING_FOR_CONFIRMATION', 'COMPLETED', 'CANCELED', 'REJECTED'],
        index: true,
    },
    products: [Object],
    productsIds: [ObjectId],
    productsById: Object,
    localReceiptDateTime: Date,
    properties: [Object],
}, {
    timestamps: true,
});


OrderSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function(doc, ret) {
        delete ret._id;
    },
});

module.exports = OrderSchema;
