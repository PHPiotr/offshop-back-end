const getDeliveryMethodSchema = ({Schema, slugify}) => {
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
        stepPrice: {
            type: Number,
        },
        step: {
            type: Number,
        },
        active: {
            type: Boolean,
            default: true,
        },
        payAfterDelivery: {
            type: Boolean,
            default: false,
        }
    }, {
        timestamps: true,
    });

    DeliveryMethodSchema.pre('validate', async function() {
        this.slug = slugify(this.name, {lower: true});
        if (this.step) {
            this.step = Number(this.step);
        }
    });

    DeliveryMethodSchema.set('toJSON', {
        virtuals: true,
        versionKey: false,
        transform: function(doc, ret) {
            ret.unitPrice = '' + ret.unitPrice;
            ret.stepPrice = ret.stepPrice ? '' + ret.stepPrice : '';
            ret.step = ret.step ? Number(ret.step) : '';
            delete ret._id;
        },
    });

    return DeliveryMethodSchema;
};

module.exports = getDeliveryMethodSchema;
