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
        host: process.env.EMAIL_ACCOUNT_SMTP_HOST,
        port: process.env.EMAIL_ACCOUNT_SMTP_PORT,
        secure: !!process.env.EMAIL_ACCOUNT_SMTP_SECURE,
        auth: {
            user: process.env.EMAIL_ACCOUNT_USER,
            pass: process.env.EMAIL_ACCOUNT_PASS,
        }
    };
}
module.exports = nodemailer.createTransport(mailConfig);
