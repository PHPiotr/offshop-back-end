module.exports = ({crypto, secondKey, stringify}) => (req, res, next) => {
    const splittedSignature = req.get('Openpayu-Signature').split(';');
    const incomingSignature = splittedSignature.find(el => el.indexOf('signature=') !== -1).substring(10);
    const algorithm = splittedSignature.find(el => el.indexOf('algorithm=') !== -1).substring(10).toLowerCase();
    const concatenated = `${stringify(req.body)}${secondKey}`;
    const expectedSignature = crypto.createHash(algorithm).update(concatenated).digest('hex');

    let err = null;
    if (expectedSignature !== incomingSignature) {
        res.status(401);
        err = Error('Notification signatures mismatch');
    }
    return next(err);
};
