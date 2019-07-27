module.exports = (err, req, res, next) => {
    if (!err) {
        return next();
    }
    if (err.response) {

        res.statusCode = err.response.status;

        // const errorMessage = e.message; // "Request failed with status code 403"
        // const errorStatusText = e.response.statusText // Forbidden
        // const errorDataStatusCode = e.response.data.status.code; // "8062"
        // const errorDataStatusCodeLiteral = e.response.data.status.codeLiteral; // "INVALID_AUTH_FOR_THIS_ORDER"
        // const errorDataStatusStatusCode = e.response.data.status.statusCode; // "ERROR_VALUE_INVALID"
        // const errorDataStatusStatusDesc = e.response.data.status.statusDesc; // "Permission denied for given action"
        // const errorHeadersCorrelationId = e.response.headers['correlation-id']; // 0A4DC804-0C11_AC110014-0050_5D3B02E8_740708-0015
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

    const responseStatusCode = parseInt(('' + res.statusCode).charAt(0), 10) > 3 ? res.statusCode : null;
    const statusCode = err.statusCode || responseStatusCode || 500;
    res.statusCode = statusCode;
    const payload = {
        message: err.message || res.errorMessage || `Don't panic! It's just ${statusCode} Error. We will fix it soon.`,
        status: statusCode,
    };

    if (process.env.NODE_ENV === 'development') {
        payload.error = err;
    }

    res.json(payload);
};
