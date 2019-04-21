const nodemailer = require('nodemailer');

const mailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_ACCOUNT_SMTP_HOST,
    port: process.env.EMAIL_ACCOUNT_SMTP_PORT,
    auth: {
        user: process.env.EMAIL_ACCOUNT_USER,
        pass: process.env.EMAIL_ACCOUNT_PASS,
    }
});

const sendMail = async (from, to, subject, html) => {
    try {
        await mailTransporter.sendMail({
            from,
            to,
            subject,
            html,
        });
        return true;
    } catch (e) {
        return false;
        // TODO: Log it
    }
};

module.exports = sendMail;