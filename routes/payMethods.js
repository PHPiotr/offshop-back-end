const axios = require('axios');
module.exports = (config) => {

    const {router} = config;

    router.get('/', async (req, res, next) => {
        try {
            const {data: {access_token}} = await axios({
                url: `${process.env.PAYU_HOST}/pl/standard/user/oauth/authorize`,
                method: 'post',
                data: `grant_type=client_credentials&client_id=${process.env.PAYU_MERCHANT_POS_ID}&client_secret=${process.env.PAYU_CLIENT_SECRET}`,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });

            const {data: {payByLinks = []}} = await axios({
                url: `${process.env.PAYU_API}/paymethods`,
                method: 'get',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Authorization': `Bearer ${access_token}`,
                },
                maxRedirects: 0,
                validateStatus: status => status === 200,
            });

            res.json(payByLinks.filter(i => i.status === 'ENABLED' && ['c', 'ap'].indexOf(i.value) > -1));
        } catch (err) {
            next(err);
        }
    });

    return router;
};

