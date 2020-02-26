module.exports = (req, res, next) => {
    const accessToken = req.headers.authorization;
    let err = null;
    if (typeof accessToken !== 'string') {
        res.status(401);
        err = new Error('Invalid access token');
    }
    if (!accessToken.trim()) {
        res.status(401);
        err = new Error('Missing access token');
    }
    return next(err);
};