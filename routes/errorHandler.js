module.exports = isDevEnv => (err, req, res, next) => {
    if (err.isAxiosError && err.response) {
        return res.status(err.response.status).json(err.response.data);
    }
    if (err.name === 'UnauthorizedError') {
        res.statusCode = err.status;
    }
    if (err.name === 'ValidationError') {
        res.statusCode = err.statusCode || 422;
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
        message: `Don't panic! It's just ${statusCode} Error. We will fix it soon.`,
        status: statusCode,
        error: err,
    };
    if (isDevEnv) {
        payload.message = err.message || res.errorMessage || err.toString();
    }

    res.json(payload);
};
