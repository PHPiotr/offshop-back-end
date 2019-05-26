if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv');
    dotenv.config();
}

const express = require('express');
const db = require('./db');
const app = express();
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const aws = require('aws-sdk');

// routes
const authorize = require('./routes/authorize');
const orders = require('./routes/orders');
const categories = require('./routes/categories');
const products = require('./routes/products');
const deliveryMethods = require('./routes/deliveryMethods');
const payMethods = require('./routes/payMethods');
const errorHandler = require('./routes/errorHandler');

// admin routes
const deliveryMethodsManagement = require('./routes/admin/deliveryMethods');
const productsManagement = require('./routes/admin/products');

// middleware
const jwtCheck = require('./middleware/jwtCheck');
const queryOptionsCheck = require('./middleware/queryOptionsCheck');

// utils
const resizeFile = require('./utils/resizeFile');
const removeFile = require('./utils/removeFile');
const renameFile = require('./utils/renameFile');
const readFile = require('./utils/readFile');
const s3UploadFile = require('./utils/s3UploadFile');
const s3DeleteFiles = require('./utils/s3DeleteFiles');

// models
const OrderModel = require('./models/OrderModel');
const ProductModel = require('./models/ProductModel');
const DeliveryMethodModel = require('./models/DeliveryMethodModel');

const PORT = process.env.PORT || 9000;
const server = http.createServer(app);
const io = require('socket.io')(server, {pingTimeout: 60000});
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    params: {
        Bucket: process.env.S3_BUCKET,
    },
});

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
app.all('/admin/*', jwtCheck());
app.use('/authorize', authorize);
app.use('/orders', orders(io, express.Router(), OrderModel, ProductModel, DeliveryMethodModel));
app.use('/categories', categories);
app.use('/products', products({
    ProductModel,
    router: express.Router(),
    queryOptionsCheck,
}));
app.use('/delivery-methods', deliveryMethods({
    io,
    jwtCheck,
    DeliveryMethodModel,
    router: express.Router(),
}));
app.use('/pay-methods', payMethods({router: express.Router()}));

// admin handlers
app.use('/admin/products', productsManagement({
    io,
    ProductModel,
    router: express.Router(),
    queryOptionsCheck,
    fileUtils: {
        resizeFile,
        removeFile,
        renameFile,
        readFile,
        s3UploadFile: s3UploadFile(s3),
        s3DeleteFiles: s3DeleteFiles(s3),
    },
}));
app.use('/admin/delivery-methods', deliveryMethodsManagement({
    io,
    DeliveryMethodModel,
    router: express.Router(),
    queryOptionsCheck,
}));

app.all('*', (req, res, next) => {
    res.status(404);
    next(Error('Not found'));
});

app.use(errorHandler);

server.listen(PORT, () => {
    console.log('server running at ' + PORT)
});
