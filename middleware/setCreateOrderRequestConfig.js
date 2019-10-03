module.exports = (req, res, next) => {

    const extOrderId = req.app.locals.db.Types.ObjectId().toString();
    const customerIp = req.ip;

    req.createOrderRequestConfig = {
        url: `${process.env.PAYU_API}/orders`,
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${req.headers.authorization}`,
        },
        data: {
            extOrderId,
            payMethods: req.body.payMethods,
            notifyUrl: req.body.notifyUrl,
            continueUrl: req.body.continueUrl,
            customerIp,
            merchantPosId: req.body.merchantPosId,
            description: `${req.body.description} ${extOrderId}`,
            currencyCode: req.body.currencyCode,
            totalAmount: `${req.body.totalAmount}`,
            buyer: req.body.buyer,
            settings: req.body.settings,
            products: req.body.productsIds.map(i => req.body.productsById[i]),
        },
        maxRedirects: 0,
        validateStatus: status => status === 201 || status === 302,
    };

    next();
};