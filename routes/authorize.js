const express = require('express');
const router = express.Router();
const request = require('request');

// OAuth Authorization
router.post('/', (req, res) => {

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
        if (error) {
            return res.json({error});
        }
        const {statusCode, statusMessage} = response;
        switch (response.statusCode) {
            case 503:
                return res.status(statusCode).json({error: statusMessage});
            default:
                res.json(JSON.parse(body));
        }
    }

    request.post(options, callback);
});

module.exports = router;
