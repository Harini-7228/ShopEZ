const config = require('../config/env');
const { sendError } = require('../utils/apiResponse');

/**
 * Express centralized error handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Handle Mongoose Duplicate Key Error (e.g. email already exists)
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
    // Extract duplicate fields
    details = err.keyValue;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    message = 'Validation error occurred';
    statusCode = 400;
    details = Object.values(err.errors).map((val) => val.message);
  }

  // Handle JSONWebTokenError
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token signature. Please login again.';
    statusCode = 401;
  }

  // Handle TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    message = 'Token has expired. Please refresh your token.';
    statusCode = 401;
  }

  // Include stack trace only in development mode
  if (config.env === 'development') {
    console.error('Error Details:', err);
    details = details || { stack: err.stack };
  }

  return sendError(res, message, statusCode, details);
};

module.exports = errorHandler;
