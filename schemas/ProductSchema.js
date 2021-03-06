const getProductSchema = ({Schema, uniqueValidator, slugify}) => {
    const ProductSchema = new Schema({
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
        description: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            minlength: 15,
            maxlength: 160,
        },
        longDescription: {
            type: String,
            trim: true,
            unique: true,
            minlength: 15,
            maxlength: 1000,
        },
        categoryId: {
            type: String,
        },
        active: {
            type: Boolean,
            default: true,
        },
        stock: {
            type: Number,
            default: 1,
        },
        unitPrice: {
            type: Number,
        },
        weight: {
            type: Number,
            required: true,
        },
        images: {
            type: [Object],
        },
    }, {
        timestamps: true,
    });

    ProductSchema.pre('validate', async function() {
        this.slug = slugify(this.name, {lower: true});
    });

    ProductSchema.set('toJSON', {
        virtuals: true,
        versionKey: false,
        transform: function(doc, ret) {
            ret.stock = '' + ret.stock;
            ret.unitPrice = '' + ret.unitPrice;
            ret.weight = '' + ret.weight;
            delete ret._id;
        },
    });

    ProductSchema.plugin(uniqueValidator, { message: '{PATH} to be unique.' });

    return ProductSchema;
};


module.exports = getProductSchema;
