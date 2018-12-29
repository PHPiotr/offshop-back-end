module.exports = (err, req, res, next) => {
    if (!err) {
        return next();
    }
    res.json({
        errorMessage: err.message || res.errorMessage || "Don't panic!",
        errorCode: err.statusCode || res.statusCode || 500,
    });
};
