const getOrderSchema = ({Schema, possibleOrderStatuses}) => {
    const ObjectId = Schema.Types.ObjectId;
    const OrderSchema = new Schema({
        currencyCode: {
            type: String,
            required: true,
        },
        customerIp: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        extOrderId: {
            type: ObjectId,
            required: true,
            unique: true,
        },
        merchantPosId: {
            type: String,
            required: true,
        },
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
        totalAmount: {
            type: String,
            required: true,
        },
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

    return OrderSchema;
};

module.exports = getOrderSchema;
