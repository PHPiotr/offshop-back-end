const nodemailer = require('nodemailer');
const path = require('path');
const Email = require('email-templates');

const transport = nodemailer.createTransport({
    host: process.env.EMAIL_ACCOUNT_SMTP_HOST,
    port: process.env.EMAIL_ACCOUNT_SMTP_PORT,
    auth: {
        user: process.env.EMAIL_ACCOUNT_USER,
        pass: process.env.EMAIL_ACCOUNT_PASS,
    }
});

const email = new Email({
    message: {
        from: process.env.EMAIL_ACCOUNT_FROM,
    },
    send: true,
    transport,
    juice: true,
    juiceResources: {
        preserveImportant: true,
        webResources: {
            relativeTo: path.join(__dirname, '../', 'emails', template),
            images: true,
        }
    }
});

const sendMail = async (template, data) => {
    try {
        await email.send({
            template: path.join(__dirname, '../', 'emails', template),
            message: {
                to: `${data.buyer.firstName} ${data.buyer.lastName} <${data.buyer.email}>`
            },
            locals: data,
        });
    } catch (e) {
        console.error(e);
    }
};

module.exports = sendMail;