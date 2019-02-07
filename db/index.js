const mongoose = require('mongoose');

//Set up default mongoose connection
const mongoDB = process.env.MONGODB;
const PRODUCTION_MODE = process.env.NODE_ENV === 'production';
mongoose.connect(mongoDB, {
    autoCreate: !PRODUCTION_MODE,
    autoIndex: !PRODUCTION_MODE,
    useNewUrlParser: true,
});
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = mongoose;
