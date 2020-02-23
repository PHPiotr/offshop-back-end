module.exports = ({axios, router, url}) => {

    router.post('/', async (req, res, next) => {

        const {client_id, client_secret} = req.body;
        if (typeof client_id !== 'string' || !client_id.trim()) {
            res.status(401);
            return next(Error('Invalid client id'));
        }
        if (typeof client_secret !== 'string') {
            res.status(401);
            return next(Error('Invalid client secret'));
        }
        const clientId = parseInt(client_id, 10);
        const clientSecret = client_secret.toString().trim();

        try {
            const {data} = await axios({
                url,
                data: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
                method: 'post',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache',
                },
                maxRedirects: 0,
            });
            res.json(data);
        } catch (e) {
            next(e);
        }
    });

    return router;

};
