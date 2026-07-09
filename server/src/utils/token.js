import jwt from 'jsonwebtoken';
import config from '../config/env.js';

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
 * Includes `rtv` (refresh token version) so that incrementing it on logout
 * immediately invalidates any outstanding refresh tokens for that user.
 * @param {object} user - User object/payload (id, refreshTokenVersion)
 * @returns {string} Signed JWT Refresh Token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, rtv: user.refreshTokenVersion ?? 0 },
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

/**
 * Decodes an Access Token ignoring its expiration.
 * @param {string} token - Signed JWT Access Token
 * @returns {object} Decoded payload
 */
const decodeTokenIgnoringExpiration = (token) => {
  return jwt.verify(token, config.jwtAccessSecret, { ignoreExpiration: true });
};

/**
 * Decodes a Refresh Token ignoring its expiration.
 * @param {string} token - Signed JWT Refresh Token
 * @returns {object} Decoded payload
 */
const decodeRefreshTokenIgnoringExpiration = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret, { ignoreExpiration: true });
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeTokenIgnoringExpiration,
  decodeRefreshTokenIgnoringExpiration,
};
