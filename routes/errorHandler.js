module.exports = isDevEnv => (err, req, res, next) => {
    if (!err) {
        return next();
    }
    if (err.isAxiosError && err.response) {
        return res
            .status(err.response.status)
            .json(Object.assign(err.response.data, {correlationId: err.response.headers['correlation-id']}));
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

    if (err.name === 'CastError') {
        return res.sendStatus(404);
    }

    const responseStatusCode = parseInt(('' + res.statusCode).charAt(0), 10) > 3 ? res.statusCode : null;
    const statusCode = err.statusCode || responseStatusCode || 500;
    res.statusCode = statusCode;
    const payload = {
        message: err.message || res.errorMessage || `Don't panic! It's just ${statusCode} Error. We will fix it soon.`,
        status: statusCode,
    };

    if (isDevEnv) {
        payload.error = err;
    }

    res.json(payload);
};
