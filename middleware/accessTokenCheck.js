module.exports = (req, res, next) => {
    const accessToken = req.headers.authorization;
    let err = null;
    if (typeof accessToken !== 'string' || !accessToken.trim()) {
        res.status(401);
        err = new Error('Invalid access token');
    }
    return next(err);
};