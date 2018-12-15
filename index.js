const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const request = require('request');
const bodyParser = require('body-parser');
const port = 9000;

app.use(bodyParser({extended: true}));
app.use(cors());

app.get('/', (req, res) => {
    res.send('WORKING!')
});

app.post('/authorize', (req, res) => {

    const {client_id, client_secret} = req.body;
    if (typeof client_id !== 'number') {
        return res.status(403).json('Problem with client id');
    }
    if (typeof client_secret !== 'string') {
        return res.status(403).json('Problem with client secret');
    }
    const clientId = parseInt(client_id, 10);
    const clientSecret = client_secret.toString().trim();

    const options = {
        url: 'https://secure.snd.payu.com/pl/standard/user/oauth/authorize',
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    };

    function callback(error, response, body) {
        console.log(error, response, body);
        if (!error) {
            res.json(JSON.parse(body));
        }
    }

    request.post(options, callback);
});

app.post('/google_pay', (req, res) => {

    const {token} = req.body;
    if (typeof token !== 'string') {
        return res.send(403);
    }
    const accessToken = token.toString().trim();
    if (!accessToken) {
        return res.send(403);
    }

    const options = {
        url: 'https://secure.snd.payu.com/api/v2_1/orders',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            "payMethods": {
                "payMethod": {
                    "value": "ap",
                    "type": "PBL",
                    "authorizationCode": "eyJzaWduYXR1cmUiOiJNRVlDSVFDeFFXMlhuQUF1dCt6bjd4NzNTT2JKL0ZFYVVydTNyTWxQYlhBSXdPbjZoUUloQUp0WUVoK2pZT2dmazZwQlZiSlpHSTlDeW5xMjIyanBqaXJGYXZMVnZuZ2ciLCJwcm90b2NvbFZlcnNpb24iOiJFQ3YxIiwic2lnbmVkTWVzc2FnZSI6IntcImVuY3J5cHRlZE1lc3NhZ2VcIjpcIlU3OXpNbjVwUGJFd2Rab1M2bnhQMytiU1VTdDV3VlR2c1ovNjZCNzdNeXRRd2sxU2t3Yi9Ob0ZBa25CQjNmaWVBS2lEVG5acWZOdDI1MS91TTdFd0xERjJGNkxiaGE0QWdHU1FoYUhtTCtDYUFORXpxZWZzaVAxMzJER2wxVGdlVmNMNXJiRklDM1ZJU0lET0FlOHhNTVRYM3lNMUZxaXZ6ZHFFcjBLVWRNT2YreG52aEhVZy9USnBHZ3NqM3M3ZmdtVDhVb05QU1BpQzRnb045bTh6YXBqVWlPNzVLNEVKOEx0ZEdHMndvdVVhUmNRNFdtcmx6YzFCVkRvNzZWMktKU21pM3V2N3NUR3dKTzlZZ0VwYVpEalJHT1k2WU04RHBGTG4zTWt4WXVmcVFKU1daMm9oR20rRGplNGFmRG5DbFB2VTJGMFdvbi9pay8xOTVtUjJWL0RxS1dpOG1OV2J6bk9oTDlMREhVSkZPRVFKSFFjSDJ3MEszNG5ybGxDOFltbXFKWEQvOS9Qc29PdU9xWnMzbnRRc2ZwbTdFWUg4RHNBTFRFTUZROGthM0hyYmFMOENzTFBIWkE0bmxYeG4rQVxcdTAwM2RcXHUwMDNkXCIsXCJlcGhlbWVyYWxQdWJsaWNLZXlcIjpcIkJCN01EMitscWt5RUVwQVFSY2ZSYWlsMUF4eFhIZ08yWU1sL0xUVTlnYy9zakxIbEtVVnB4RUQ2RFRNY0tZaGx1LzhaM1pxdE1UZCtlZTl5Qit3SzM1VVxcdTAwM2RcIixcInRhZ1wiOlwiWTBIRlRMdFVwVkxzR25sdzBKY2daY2xzOE9jTlJ3eUFiNFZpZElpSEtEZ1xcdTAwM2RcIn0ifQ=="
                }
            },
            "notifyUrl": "https://localhost:3000",
            "customerIp": "127.0.0.1",
            "merchantPosId": "348042",
            "description": "RTV market",
            "currencyCode": "PLN",
            "totalAmount": "7000",
            "buyer": {
                "email": "john.doe@example.com",
                "phone": "654111654",
                "firstName": "John",
                "lastName": "Doe",
                "language": "pl"
            },
            "settings": {
                "invoiceDisabled": "true"
            },
            "products": [
                {
                    "name": "Wireless Mouse for Laptop",
                    "unitPrice": "2000",
                    "quantity": "1"
                },
                {
                    "name": "HDMI cable",
                    "unitPrice": "5000",
                    "quantity": "1"
                }
            ]
        }),
    };

    function callback(error, response, body) {
        console.log(error, response, body);
        if (!error) {
            res.json(JSON.parse(body));
        }
    }

    request.post(options, callback);
});

const httpsOptions = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    requestCert: false,
    rejectUnauthorized: false,
};
const server = https.createServer(httpsOptions, app).listen(port, () => {
    console.log('server running at ' + port)
});
