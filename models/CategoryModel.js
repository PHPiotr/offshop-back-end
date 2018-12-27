const mongoose = require('mongoose');
const CategorySchema = require('../schemas/CategorySchema');

const CategoryModel = mongoose.model('Category', CategorySchema);

module.exports = CategoryModel;
