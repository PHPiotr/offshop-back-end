module.exports = (req, res, next) => {
    const {body} = req;

    if (typeof body.notifyUrl !== 'string') {
        res.status(401);
        return next(new Error('Invalid notifyUrl parameter'));
    }
    if (typeof body.merchantPosId !== 'string') {
        res.status(401);
        return next(new Error('Invalid merchantPosId parameter'));
    }
    if (typeof body.description !== 'string') {
        res.status(401);
        return next(new Error('Invalid description parameter'));
    }
    if (typeof body.currencyCode !== 'string') {
        res.status(401);
        return next(new Error('Invalid currencyCode parameter'));
    }
    if (typeof body.totalAmount !== 'string') {
        res.status(401);
        return next(new Error('Invalid totalAmount parameter'));
    }
    if (typeof body.notifyUrl !== 'string') {
        res.status(401);
        return next(new Error('Invalid notifyUrl parameter'));
    }
    if (typeof body.continueUrl !== 'string') {
        res.status(401);
        return next(new Error('Invalid continueUrl parameter'));
    }

    // TODO: Validate props of objects below
    const buyer = body.buyer;
    if (typeof buyer !== 'object') {
        res.status(401);
        return next(new Error('Invalid buyer parameter'));
    }
    const settings = body.settings;
    if (typeof settings !== 'object') {
        res.status(401);
        return next(new Error('Invalid settings parameter'));
    }
    const products = body.products;
    if (typeof products !== 'object') {
        res.status(401);
        return next(new Error('Invalid products parameter'));
    }
    const payMethods = body.payMethods;
    if (typeof payMethods !== 'object') {
        res.status(401);
        return next(new Error('Invalid payMethods parameter'));
    }

    next();
};