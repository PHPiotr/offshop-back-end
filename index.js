const isDevEnv = process.env.NODE_ENV === 'development';

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const aws = require('aws-sdk');
const axios = require('axios');

const {model, Schema} = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slugify = require('slugify');
const {possibleOrderStatuses, statusesDescriptions} = require('./utils/getPossibleOrderStatuses');

const DeliveryMethodSchema = require('./schemas/DeliveryMethodSchema')({Schema, slugify});
const OrderSchema = require('./schemas/OrderSchema')({Schema, possibleOrderStatuses});
const ProductSchema = require('./schemas/ProductSchema')({Schema, uniqueValidator, slugify});

const db = require('./db');
const ioModule = require('./io');

const app = express();

// routes
const authorize = require('./routes/authorize');
const orders = require('./routes/orders');
const products = require('./routes/products');
const deliveryMethods = require('./routes/deliveryMethods');
const payMethods = require('./routes/payMethods');
const errorHandler = require('./routes/errorHandler');

// admin routes
const deliveryMethodsManagement = require('./routes/admin/deliveryMethods');
const ordersManagement = require('./routes/admin/orders');
const productsManagement = require('./routes/admin/products');

// middleware
const jwtCheck = require('./middleware/jwtCheck');
const queryOptionsCheck = require('./middleware/queryOptionsCheck');
const accessTokenCheck = require('./middleware/accessTokenCheck');
const verifyNotificationSignature = require('./middleware/verifyNotificationSignature');
const productsCheckMiddleware = require('./middleware/productsCheck');
const deliveryMethodCheckMiddleware = require('./middleware/deliveryMethodCheck');
const setCreateOrderRequestConfig = require('./middleware/setCreateOrderRequestConfig')({
    createOrderUrl: `${process.env.PAYU_API}/orders`,
    notifyUrl: `${process.env.API_URL}/notify`,
    getObjectId: () => db.Types.ObjectId().toString(),
});

// utils
const resizeFile = require('./utils/resizeFile');
const removeFile = require('./utils/removeFile');
const renameFile = require('./utils/renameFile');
const readFile = require('./utils/readFile');
const s3UploadFile = require('./utils/s3UploadFile');
const s3DeleteFiles = require('./utils/s3DeleteFiles');
const sendMail = require('./utils/sendMail');

const PORT = process.env.PORT || 9000;
const apiUrl = process.env.API_URL;
const emailFrom = process.env.EMAIL_ACCOUNT_FROM;
const productPath = process.env.PRODUCT_PATH;
const server = http.createServer(app);

ioModule.initialize(server, {pingTimeout: 60000});
const io = ioModule.io();

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
    origin: (process.env.ACCESS_CONTROL_ALLOW_ORIGIN).split(','),
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.locals.db = db;
app.all('/admin/*', jwtCheck());
app.use('/authorize', authorize({
    axios,
    router: express.Router(),
    url: `${process.env.PAYU_HOST}/pl/standard/user/oauth/authorize`,
}));
app.use('/orders', orders({
    io,
    axios,
    router: express.Router(),
    model,
    DeliveryMethodSchema,
    OrderSchema,
    ProductSchema,
    accessTokenCheck,
    verifyNotificationSignature,
    productsCheckMiddleware,
    deliveryMethodCheckMiddleware,
    setCreateOrderRequestConfig,
    sendMail,
    emailFrom,
    statusesDescriptions,
    productPath,
}));
app.use('/products', products({
    model,
    ProductSchema,
    router: express.Router(),
    queryOptionsCheck,
}));
app.use('/delivery-methods', deliveryMethods({
    io,
    jwtCheck,
    model,
    DeliveryMethodSchema,
    router: express.Router(),
    queryOptionsCheck,
}));
app.use('/pay-methods', payMethods({
    accessTokenCheck,
    axios,
    router: express.Router(),
    url: `${process.env.PAYU_API}/paymethods`,
}));

// admin handlers
app.use('/admin/orders', ordersManagement({
    io,
    axios,
    model,
    OrderSchema,
    router: express.Router(),
    queryOptionsCheck,
}));
app.use('/admin/products', productsManagement({
    apiUrl,
    io,
    model,
    ProductSchema,
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
    apiUrl,
    io,
    model,
    DeliveryMethodSchema,
    router: express.Router(),
    queryOptionsCheck,
}));

app.all('*', (req, res, next) => {
    res.status(404);
    next(Error('Not found'));
});

app.use(errorHandler(isDevEnv));

server.listen(PORT, () => {
    console.log('server running at ' + PORT)
});
