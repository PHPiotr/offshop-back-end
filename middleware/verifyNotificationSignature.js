module.exports = (req, res, next) => {
    const splittedSignature = req.get('Openpayu-Signature').split(';');
    const incomingSignature = splittedSignature.find(el => el.indexOf('signature=') !== -1).substring(10);
    const algorithm = splittedSignature.find(el => el.indexOf('algorithm=') !== -1).substring(10).toLowerCase();
    const concatenated = `${JSON.stringify(req.body)}${process.env.SECOND_KEY}`;
    const expectedSignature = crypto.createHash(algorithm).update(concatenated).digest('hex');

    let err = null;
    if (expectedSignature == incomingSignature) {
        console.log('ok...');
    } else {
        res.status(401);
        err = Error('Notification signatures mismatch');
    }
    return next(err);
};
