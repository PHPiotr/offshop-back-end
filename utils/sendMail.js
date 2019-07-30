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

const sendMail = async (template, locals, from, to) => {
    try {
        const email = new Email({
            message: {from},
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
        await email.send({
            template: path.join(__dirname, '../', 'emails', template),
            message: {to},
            locals,
        });
    } catch (e) {
        console.error(e);
    }
};

module.exports = sendMail;