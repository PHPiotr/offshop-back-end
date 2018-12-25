const express = require('express');
const router = express.Router();
const request = require('request');

// OAuth Authorization
router.post('/', (req, res, next) => {

    const {client_id, client_secret} = req.body;
    if (typeof client_id !== 'string' || !client_id.trim()) {
        res.status(403);
        return next(Error('Invalid client id'));
    }
    if (typeof client_secret !== 'string') {
        res.status(403);
        return next(Error('Invalid client secret'));
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

    function callback(err, response, body) {
        if (err) {
            return next(err);
        }
        const {statusCode, statusMessage} = response;
        switch (response.statusCode) {
            case 503:
                res.status(statusCode);
                return next(Error(statusMessage));
            default:
                res.json(JSON.parse(body));
        }
    }

    request.post(options, callback);
});

module.exports = router;
