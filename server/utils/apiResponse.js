/**
 * Standard API Response structure helper functions.
 */

/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {any} data - Response payload data
 * @param {string} message - Descriptive success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response. (Commonly used by error handling middleware)
 * @param {object} res - Express response object
 * @param {string} message - Error description message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {any} errorDetails - Additional debugging info or validation issues
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, errorDetails = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: errorDetails,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
