import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';

/**
 * Formats the standard user payload sent to the client.
 */
const formatUserPayload = (user) => {
  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    addresses: user.addresses || [],
    isLocalSeller: user.isLocalSeller,
    sellerImpactScore: user.sellerImpactScore,
  };
};

/**
 * Handles credentials verification and returns token credentials + user payload.
 */
const authenticateUser = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  return {
    accessToken,
    refreshToken,
    userPayload: formatUserPayload(user),
  };
};

/**
 * Validates a refresh token string, checks database version for revocation,
 * and returns the authenticated user if valid.
 */
const verifyAndGetRefreshTokenUser = async (token) => {
  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id);
  if (!user) {
    const err = new Error('Owner of this token does not exist anymore.');
    err.statusCode = 401;
    throw err;
  }

  const tokenVersion = decoded.rtv ?? 0;
  const userVersion = user.refreshTokenVersion ?? 0;
  if (tokenVersion !== userVersion) {
    const err = new Error('Refresh token has been revoked. Please login again.');
    err.statusCode = 401;
    throw err;
  }

  return user;
};

/**
 * Revokes all issued refresh tokens for a user.
 */
const revokeRefreshTokens = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
};

export { authenticateUser, verifyAndGetRefreshTokenUser, revokeRefreshTokens, formatUserPayload, };
