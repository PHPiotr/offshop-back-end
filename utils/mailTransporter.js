const nodemailer = require('nodemailer');

module.exports = nodemailer.createTransport({
    host: process.env.EMAIL_ACCOUNT_SMTP_HOST,
    port: process.env.EMAIL_ACCOUNT_SMTP_PORT,
    secure: !!process.env.EMAIL_ACCOUNT_SMTP_SECURE,
    auth: {
        user: process.env.EMAIL_ACCOUNT_USER,
        pass: process.env.EMAIL_ACCOUNT_PASS,
    }
});
