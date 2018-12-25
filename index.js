if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv');
    dotenv.load();
}
const express = require('express');
const db = require('./db');
const app = express();
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const authorize = require('./routes/authorize');
const orders = require('./routes/orders');
const errorHandler = require('./routes/errorHandler');
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.locals.db = db;
app.use('/authorize', authorize);
app.use('/orders', orders);

app.all('*', (req, res, next) => {
    res.status(404);
    next(Error('Not found'));
});

app.use(errorHandler);

const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CRT),
    requestCert: false,
    rejectUnauthorized: false,
};
https.createServer(httpsOptions, app).listen(port, () => {
    console.log('server running at ' + port)
});
