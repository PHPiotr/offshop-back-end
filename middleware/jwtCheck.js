const jwt = require('express-jwt');

const jwtCheck = () => {
    return jwt({
        secret: process.env.JWT_SECRET,
        audience: process.env.JWT_AUDIENCE,
        issuer: process.env.JWT_ISSUER,
    });
};

module.exports = jwtCheck;
