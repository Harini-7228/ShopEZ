import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse.js';

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

export { validate, };
