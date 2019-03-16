const nodemailer = require('nodemailer');

let mailConfig;

if (process.env.NODE_ENV === 'production' ) {
    mailConfig = {
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
            user: 'real.user',
            pass: 'verysecret'
        }
    };
} else {
    mailConfig = {
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: 'q6hiywhgzidefh7u@ethereal.email',
            pass: 'wz3qYs2Tz2gT5VkvVp',
        }
    };
}
module.exports = nodemailer.createTransport(mailConfig);
