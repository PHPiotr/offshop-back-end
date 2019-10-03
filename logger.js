const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: '.log_error.log', level: 'error' }),
        new winston.transports.File({ filename: '.log_combined.log' }),
    ]
});

if (process.env.NODE_ENV === 'local') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
} else {

}

module.exports = logger;
