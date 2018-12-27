const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    name: String,
    slug: String,
}, {
    timestamps: true,
});

module.exports = CategorySchema;
