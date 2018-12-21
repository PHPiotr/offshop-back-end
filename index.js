const dotenv = require('dotenv');
dotenv.load();
const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const request = require('request');
const port = 9000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('WORKING!')
});

app.post('/authorize', (req, res) => {

    const {client_id, client_secret} = req.body;
    if (typeof client_id !== 'string') {
        return res.status(403).json('Problem with client id');
    }
    if (typeof client_secret !== 'string') {
        return res.status(403).json('Problem with client secret');
    }
    const clientId = parseInt(client_id, 10);
    const clientSecret = client_secret.toString().trim();

    const options = {
        url: `${process.env.PAYU_HOST}/pl/standard/user/oauth/authorize`,
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };

    function callback(error, response, body) {
        console.log(error, response, body);
        if (!error) {
            res.json(JSON.parse(body));
        }
    }

    request.post(options, callback);
});

app.post('/google_pay/orders', (req, res) => {

    const {
        accessToken,
        authorizationCode,
        notifyUrl,
        merchantPosId,
        description,
        currencyCode,
        totalAmount,
        buyer,
        settings,
        products,
    } = req.body;
    if (typeof accessToken !== 'string') {
        return res.send(403);
    }
    if (typeof authorizationCode !== 'string') {
        return res.send(403);
    }
    if (typeof notifyUrl !== 'string') {
        return res.send(403);
    }
    if (typeof merchantPosId !== 'string') {
        return res.send(403);
    }
    if (typeof description !== 'string') {
        return res.send(403);
    }
    if (typeof currencyCode !== 'string') {
        return res.send(403);
    }
    if (typeof totalAmount !== 'string') {
        return res.send(403);
    }
    if (typeof buyer !== 'object') {
        return res.send(403);
    }
    if (typeof settings !== 'object') {
        return res.send(403);
    }
    if (typeof products !== 'object') {
        return res.send(403);
    }

    const options = {
        url: `${process.env.PAYU_API}/orders`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            payMethods: {
                payMethod: {
                    value: "ap",
                    type: "PBL",
                    authorizationCode: authorizationCode,
                }
            },
            notifyUrl: notifyUrl,
            customerIp: req.ip,
            merchantPosId: merchantPosId,
            description: description,
            currencyCode: currencyCode,
            totalAmount: totalAmount,
            buyer: buyer,
            settings: settings,
            products: products,
        }),
    };

    function callback(error, response, body) {
        if (!error) {
            const jsonParsedBody = JSON.parse(body);
            jsonParsedBody.originalStatusCode = response.statusCode;
            jsonParsedBody.originalStatusMessage = response.statusMessage;
            jsonParsedBody.originalCompleted = response.complete;

            res.json(JSON.parse(body));
        }
    }

    request.post(options, callback);
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
