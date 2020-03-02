const path = require('path');

const sendMail = ({transport, Email}) => async (template, locals, from, to) => {
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
};

module.exports = sendMail;