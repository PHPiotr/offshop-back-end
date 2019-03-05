if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv');
    dotenv.load();
}
const express = require('express');
const db = require('./db');
const app = express();
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const authorize = require('./routes/authorize');
const orders = require('./routes/orders');
const categories = require('./routes/categories');
const products = require('./routes/products');
const deliveryMethods = require('./routes/deliveryMethods');
const errorHandler = require('./routes/errorHandler');
const jwtCheck = require('./middleware/jwtCheck');
const fileUpload = require('express-fileupload');
const PORT = process.env.PORT || 9000;

const server = http.createServer(app);
const io = require('socket.io')(server, {pingTimeout: 60000});

const OrderModel = require('./models/OrderModel');
const ProductModel = require('./models/ProductModel');
const DeliveryMethodModel = require('./models/DeliveryMethodModel');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(fileUpload({
    safeFileNames: true,
}));
app.use(helmet());
app.use(cors({
    origin: process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.locals.db = db;
app.use('/authorize', authorize);
app.use('/orders', orders(io, express.Router(), OrderModel, ProductModel));
app.use('/categories', categories);
app.use('/products', products({
    io,
    jwtCheck,
    ProductModel,
    router: express.Router(),
}));
app.use('/delivery-methods', deliveryMethods({
    io,
    jwtCheck,
    DeliveryMethodModel,
    router: express.Router(),
}));
app.all('/admin/*', jwtCheck());
app.get('/admin', jwtCheck(), (req, res) => {
    res.send('hello')
});

app.all('*', (req, res, next) => {
    res.status(404);
    next(Error('Not found'));
});

app.use(errorHandler);

server.listen(PORT, () => {
    console.log('server running at ' + PORT)
});
