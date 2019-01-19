module.exports = (err, req, res, next) => {
    if (!err) {
        return next();
    }
    if (err.name === 'ValidationError') {
        if (!err.statusCode) {
            res.statusCode = 422;
        }
    }

    const payload = {
        errorMessage: err._message || err.message || res.errorMessage || "Don't panic!",
        errorCode: err.statusCode || res.statusCode || 500,
    };

    if (process.env.NODE_ENV === 'development') {
        payload.error = err;
    }

    res.json(payload);
};
