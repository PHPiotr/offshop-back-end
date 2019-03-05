const mongoose = require('mongoose');
const DeliveryMethodSchema = require('../schemas/DeliveryMethodSchema');
module.exports = mongoose.model('Delivery', DeliveryMethodSchema);
