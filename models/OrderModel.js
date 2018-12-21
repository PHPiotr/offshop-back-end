const mongoose = require('mongoose');
const OrderSchema = require('../schemas/OrderSchema');

const OrderModel = mongoose.model('Order', OrderSchema);

module.exports = OrderModel;
