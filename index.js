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
const crypto = require('crypto');
const jwt = require('express-jwt');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB, {
    autoCreate: isDevEnv,
    autoIndex: isDevEnv,
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.Promise = global.Promise;

const {model, Schema} = mongoose;
const uniqueValidator = require('mongoose-unique-validator');
const slugify = require('slugify');
const {possibleOrderStatuses, statusesDescriptions} = require('./utils/getPossibleOrderStatuses');

const DeliveryMethodSchema = require('./schemas/DeliveryMethodSchema')({Schema, slugify});
const OrderSchema = require('./schemas/OrderSchema')({Schema, possibleOrderStatuses});
const ProductSchema = require('./schemas/ProductSchema')({Schema, uniqueValidator, slugify});

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
const queryOptionsCheck = require('./middleware/queryOptionsCheck');
const accessTokenCheck = require('./middleware/accessTokenCheck');
const verifyNotificationSignature = require('./middleware/verifyNotificationSignature')({
    crypto,
    secondKey: process.env.SECOND_KEY,
    stringify: JSON.stringify,
});
const productsCheckMiddleware = require('./middleware/productsCheck');
const deliveryMethodCheckMiddleware = require('./middleware/deliveryMethodCheck');
const setCreateOrderRequestConfig = require('./middleware/setCreateOrderRequestConfig')({
    createOrderUrl: `${process.env.PAYU_API}/orders`,
    notifyUrl: `${process.env.API_URL}/orders/notify`,
    getObjectId: () => mongoose.Types.ObjectId().toString(),
});

// utils
const sharp = require('sharp');
const fs = require('fs').promises;
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    params: {
        Bucket: process.env.S3_BUCKET,
    },
});
const resizeFile = require('./utils/resizeFile')(sharp);
const removeFile = require('./utils/removeFile')(fs);
const readFile = require('./utils/readFile')(fs);
const s3UploadFile = require('./utils/s3UploadFile')(s3);
const s3DeleteFiles = require('./utils/s3DeleteFiles')(s3);
const nodemailer = require('nodemailer');
const sendMail = require('./utils/sendMail')({
    transport: nodemailer.createTransport({
        host: process.env.EMAIL_ACCOUNT_SMTP_HOST,
        port: process.env.EMAIL_ACCOUNT_SMTP_PORT,
        auth: {
            user: process.env.EMAIL_ACCOUNT_USER,
            pass: process.env.EMAIL_ACCOUNT_PASS,
        }
    }),
    Email: require('email-templates'),
});

const PORT = process.env.PORT || 9000;
const apiUrl = process.env.API_URL;
const emailFrom = process.env.EMAIL_ACCOUNT_FROM;
const productPath = process.env.PRODUCT_PATH;
const server = http.createServer(app);

const sio = require('socket.io');
const io = sio(server, {pingTimeout: 60000});
io.on('connect', socket => {
    socket.join('users');
    socket.on('userLoggedIn', () => {
        socket.leave('users');
        socket.join('admin');
    });
    socket.on('userLoggedOut', () => {
        socket.leave('admin');
        socket.join('users');
    });
    socket.on('disconnect', () => {
        socket.leave('admin');
        socket.leave('users');
    });
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
app.all('/admin/*', jwt({
    secret: process.env.JWT_SECRET,
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
}));
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
        readFile,
        s3UploadFile,
        s3DeleteFiles,
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
