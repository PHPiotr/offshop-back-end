module.exports = ({accessTokenCheck, axios, router, url}) => {

    router.get('/', accessTokenCheck, async (req, res, next) => {
        try {
            const {data: {cardTokens, payByLinks, pexTokens}} = await axios({
                url,
                method: 'get',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Authorization': req.headers.authorization,
                },
                maxRedirects: 0,
            });

            res.json({
                cardTokens: cardTokens.filter(({status}) => status === 'ENABLED'),
                payByLinks: payByLinks.filter(({status}) => status === 'ENABLED'),
                pexTokens: pexTokens.filter(({status}) => status === 'ENABLED')
            });
        } catch (err) {
            next(err);
        }
    });

    return router;
};

