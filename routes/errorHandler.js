module.exports = (err, req, res, next) => {
    if (!err) {
        return next();
    }
    if (err.name === 'UnauthorizedError') {
        res.statusCode = err.status;
    }
    if (err.name === 'ValidationError') {
        if (!err.statusCode) {
            res.statusCode = 422;
        }
    }
    if (err.name === 'MongoError' && err.code === 11000) {
        res.statusCode = 422;
    }

    const payload = {
        message: err.message || res.errorMessage || "Don't panic!",
        status: err.statusCode || res.statusCode || 500,
    };

    if (process.env.NODE_ENV === 'development') {
        payload.error = err;
    }

    res.json(payload);
};
