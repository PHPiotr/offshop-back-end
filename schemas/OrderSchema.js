const mongoose = require('mongoose');
const {possibleOrderStatuses} = require('../utils/getPossibleOrderStatuses');
const Schema = mongoose.Schema;
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
        enum: possibleOrderStatuses,
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
    refund: {
        type: Object,
        get: function(refund) {
            if (refund) {
                return refund;
            }
            return {
                status: '',
            };
        }
    },
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
