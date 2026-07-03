const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to intercept validation results from express-validator.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Map error array into a readable format
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return sendError(res, 'Validation failed', 400, formattedErrors);
  }
  next();
};

module.exports = {
  validate,
};
