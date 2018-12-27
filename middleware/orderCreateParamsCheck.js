module.exports = (req, res, next) => {
    const {body} = req;

    if (typeof body.notifyUrl !== 'string') {
        res.status(401);
        return next(Error('Invalid notify url'));
    }
    if (typeof body.merchantPosId !== 'string') {
        res.status(401);
        return next(Error('Invalid point of sale'));
    }
    if (typeof body.description !== 'string') {
        res.status(401);
        return next(Error('Invalid description'));
    }
    if (typeof body.currencyCode !== 'string') {
        res.status(401);
        return next(Error('Invalid currency code'));
    }
    if (typeof body.totalAmount !== 'string') {
        res.status(401);
        return next(Error('Invalid total amount'));
    }
    if (typeof body.notifyUrl !== 'string') {
        res.status(401);
        return next(Error('Invalid notify url'));
    }
    if (typeof body.continueUrl !== 'string') {
        res.status(401);
        return next(Error('Invalid continue url'));
    }

    // TODO: Validate props of objects below
    const buyer = body.buyer;
    if (typeof buyer !== 'object') {
        res.status(401);
        return next(Error('Invalid buyer'));
    }
    const settings = body.settings;
    if (typeof settings !== 'object') {
        res.status(401);
        return next(Error('Invalid settings'));
    }
    const products = body.products;
    if (typeof products !== 'object') {
        res.status(401);
        return next(Error('Invalid products'));
    }
    const payMethods = body.payMethods;
    if (typeof payMethods !== 'object') {
        res.status(401);
        return next(Error('Invalid pay methods'));
    }

    next();
};