const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generates an Access Token for a user.
 * @param {object} user - User object/payload (id, role, email)
 * @returns {string} Signed JWT Access Token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, role: user.role, email: user.email },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpiry }
  );
};

/**
 * Generates a Refresh Token for a user.
 * @param {object} user - User object/payload (id, role, email)
 * @returns {string} Signed JWT Refresh Token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiry }
  );
};

/**
 * Verifies an Access Token.
 * @param {string} token - Signed JWT Access Token
 * @returns {object} Decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtAccessSecret);
};

/**
 * Verifies a Refresh Token.
 * @param {string} token - Signed JWT Refresh Token
 * @returns {object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
