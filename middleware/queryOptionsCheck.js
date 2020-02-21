const DEFAULT_SORT = 'updatedAt';
const DEFAULT_ORDER = -1;
const DEFAULT_LIMIT = null;
const DEFAULT_SKIP = 0;

const ascendingValues = ['asc', '1', 'true'];

const defaultOptions = {
    sort: {
        [DEFAULT_SORT]: DEFAULT_ORDER,
    },
    limit: DEFAULT_LIMIT,
    skip: DEFAULT_SKIP,
};

const getValidInt = value => {
    const parsedInt = parseInt(value, 10);

    if (isNaN(parsedInt)) {
        return null;
    }

    if (isNaN(Number(value))) {
        return null;
    }

    return parsedInt;
};

module.exports = model => {

  return (req, res, next) => {

      const {sort, order, limit, skip} = req.query;
      const options = {};
      let orderBy = DEFAULT_SORT;
      let direction = DEFAULT_ORDER;
      if (Object.keys(model.schema.paths).indexOf(sort) !== -1) {
          orderBy = sort;
      }
      if (ascendingValues.indexOf(('' + order).toLowerCase()) !== -1) {
          direction = 1;
      }
      options.sort = {
          [orderBy]: direction,
      };

      if (limit) {
          const validLimitInt = getValidInt(limit);
          if (validLimitInt && validLimitInt > 0) {
              options.limit = validLimitInt;
          }
      }

      if (skip) {
          const validSkipInt = getValidInt(skip);
          if (validSkipInt) {
              options.skip = validSkipInt;
          }
      }

      req.query.validQueryOptions = Object.assign({}, defaultOptions, options);
      next();
  };
};
