const DEFAULT_SORT = 'updatedAt';
const DEFAULT_ORDER = -1;
const DEFAULT_LIMIT = 25;
const DEFAULT_SKIP = 0;

const ascendingValues = ['asc', 'ASC', '1', 1, true, 'true'];

const defaultOptions = {
    sort: {
        [DEFAULT_SORT]: DEFAULT_ORDER,
    },
    limit: DEFAULT_LIMIT,
    skip: DEFAULT_SKIP,
};

module.exports = (req, res, next) => {
    const {sort, order, limit, skip} = req.query;
    const integerPattern = /\d+/;
    const options = {};
    let orderBy = DEFAULT_SORT;
    let direction = DEFAULT_ORDER;
    if (typeof sort === 'string') {
        orderBy = sort;
    }
    if (ascendingValues.indexOf(order) !== -1) {
        direction = 1;
    }
    options.sort = {
        [orderBy]: direction,
    };
    if (integerPattern.test(limit)) {
        options.limit = parseInt(limit, 10);
    }
    if (integerPattern.test(skip)) {
        options.skip = parseInt(skip, 10);
    }
    req.query.validQueryOptions = Object.assign({}, defaultOptions, options);
    next();
};