import config from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Express centralized error handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message   || 'Internal Server Error';
  let details    = null;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message    = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Mongoose duplicate key — only expose the field name, not the value
  // (the value could contain sensitive data like email addresses)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `A record with this ${field} already exists`;
    statusCode = 400;
    details    = { field };
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    message    = 'Validation error occurred';
    statusCode = 400;
    details    = Object.values(err.errors).map((val) => val.message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message    = 'Invalid token. Please login again.';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message    = 'Token has expired. Please refresh your token.';
    statusCode = 401;
  }

  // Development-only: log full error to server console but never send
  // the stack trace in the HTTP response body — it leaks file paths and
  // internal structure to the client even in dev mode.
  if (config.env === 'development') {
    console.error('[ERROR]', err);
  }

  return sendError(res, message, statusCode, details);
};

export default errorHandler;
