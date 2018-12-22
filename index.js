const dotenv = require('dotenv');
dotenv.load();
const express = require('express');
const db = require('./db');
const app = express();
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const request = require('request');
const authorize = require('./routes/authorize');
const orders = require('./routes/orders');
const port = 9000;

app.use(express.json());
app.use(cors());
app.locals.db = db;
app.use('/authorize', authorize);
app.use('/orders', orders);

app.get('/', (req, res) => {
    res.send('WORKING!')
});

const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CRT),
    requestCert: false,
    rejectUnauthorized: false,
};
https.createServer(httpsOptions, app).listen(port, () => {
    console.log('server running at ' + port)
});
