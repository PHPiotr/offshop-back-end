module.exports = (err, req, res, next) => {
    if (!err) {
        return next();
    }
    res.json({
        errorMessage: err.message || res.errorMessage || 'Panic',
        errorCode: err.statusCode || res.statusCode || 500,
    });
};
