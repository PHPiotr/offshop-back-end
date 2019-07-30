const mongoose = require('mongoose');
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;

const OrderSchema = new Schema({
    currencyCode: String,
    customerIp: String,
    description: String,
    extOrderId: {
        type: ObjectId,
        required: true,
        unique: true,
    },
    merchantPosId: String,
    notifyUrl: String,
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    products: [Object],
    status: {
        type: String,
        enum: ['LOCAL_SOFT_DELETED', 'LOCAL_NEW_INITIATED', 'LOCAL_NEW_REJECTED', 'LOCAL_NEW_COMPLETED', 'NEW', 'PENDING', 'WAITING_FOR_CONFIRMATION', 'COMPLETED', 'CANCELED', 'REJECTED'],
        index: true,
    },
    redirectUri: {
        type: String,
        default: '',
    },
    totalAmount: String,
    totalWithoutDelivery: Number,
    totalWeight: Number,
    buyer: Object,
    deliveryMethod: Object,
    payMethod: Object,
    shippingMethod: Object,
    productsIds: [ObjectId],
    productsById: Object,
    refund: Object,
    localReceiptDateTime: Date,
    properties: [Object],
}, {
    timestamps: {
        createdAt: 'orderCreateDate'
    },
});


OrderSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function(doc, ret) {
        delete ret._id;
    },
});

module.exports = OrderSchema;
