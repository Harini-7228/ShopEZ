import User from '../models/User.js';
import crypto from 'node:crypto';
import config from '../config/env.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateUser, verifyAndGetRefreshTokenUser, revokeRefreshTokens, formatUserPayload, } from '../services/authService.js';
import { decodeTokenIgnoringExpiration, decodeRefreshTokenIgnoringExpiration } from '../utils/token.js';

/**
 * Helper to set cookies for authentication tokens
 */
const sendTokenResponse = async (user, statusCode, res, message) => {
  const { accessToken, refreshToken, userPayload } = await authenticateUser(user);

  // Cookie options
  // In production, frontend (Vercel) and backend (Render) are on different domains,
  // so SameSite must be 'none' (with Secure=true) to allow cross-site cookie sending.
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };

  // Set cookies
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return sendSuccess(
    res,
    {
      user: userPayload,
      accessToken,
    },
    message,
    statusCode
  );
};

/**
 * @desc Register user
 * @route POST /api/v1/auth/register
 * @access Public
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, addresses, isLocalSeller } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already registered with this email',
      data: null,
    });
  }

  // Prevent self-registration of administrative accounts
  const PROTECTED_ROLES = ['admin'];
  const requestedRole = role || 'customer';
  const safeRole = PROTECTED_ROLES.includes(requestedRole) ? 'customer' : requestedRole;

  // Create new user (role defaults to customer if not specified)
  const user = await User.create({
    name,
    email,
    passwordHash: password, // Pre-save hook hashes this
    role: safeRole,
    phone,
    addresses: addresses || [],
    isLocalSeller: !!isLocalSeller,
  });

  await sendTokenResponse(user, 201, res, 'User registered successfully');
});

/**
 * @desc Login user
 * @route POST /api/v1/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
      data: null,
    });
  }

  // Find user by email (include password hash for matching)
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      data: null,
    });
  }

  // Match password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      data: null,
    });
  }

  await sendTokenResponse(user, 200, res, 'Logged in successfully');
});

/**
 * @desc Request a password reset token
 * @route POST /api/v1/auth/forgot-password
 * @access Public
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const genericMessage = 'If an account exists for this email, password reset instructions have been prepared.';

  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
  if (!user) {
    return sendSuccess(res, null, genericMessage);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetPath = `/reset-password/${resetToken}`;
  const resetUrl = `${req.protocol}://${req.get('host')}${resetPath}`;

  const payload = config.env === 'production'
    ? null
    : { resetToken, resetPath, resetUrl, expiresInMinutes: 15 };

  sendSuccess(res, payload, genericMessage);
});

/**
 * @desc Reset password using a valid token
 * @route POST /api/v1/auth/reset-password/:token
 * @access Public
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Password reset link is invalid or has expired',
      data: null,
    });
  }

  user.passwordHash = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  await user.save();

  sendSuccess(res, null, 'Password reset successfully. Please login with your new password.');
});

/**
 * @desc Refresh access token
 * @route POST /api/v1/auth/refresh-token
 * @access Public
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  let token = req.cookies ? req.cookies.refreshToken : undefined;

  // Check if token was passed in body (fallback)
  if (!token && req.body && req.body.refreshToken) {
    token = req.body.refreshToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is missing or expired. Please login again.',
      data: null,
    });
  }

  try {
    const user = await verifyAndGetRefreshTokenUser(token);
    await sendTokenResponse(user, 200, res, 'Token refreshed successfully');
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired refresh token. Please login again.',
      data: null,
    });
  }
});

/**
 * @desc Logout user (clear cookies)
 * @route POST /api/v1/auth/logout
 * @access Private
 */
const logout = asyncHandler(async (req, res, next) => {
  let userId;

  // Retrieve token from cookies or Authorization header
  let token = req.cookies ? req.cookies.accessToken : undefined;
  if (!token && req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = decodeTokenIgnoringExpiration(token);
      userId = decoded.id;
    } catch (err) {
      // Fallback: Try decoding the refresh token if access token is missing or corrupted
      let rToken = req.cookies ? req.cookies.refreshToken : undefined;
      if (!rToken && req.body && req.body.refreshToken) {
        rToken = req.body.refreshToken;
      }
      if (rToken) {
        try {
          const decodedRefresh = decodeRefreshTokenIgnoringExpiration(rToken);
          userId = decodedRefresh.id;
        } catch (rErr) {
          // ignore invalid refresh tokens
        }
      }
    }
  }

  // Revoke all existing refresh tokens if user ID was resolved
  if (userId) {
    await revokeRefreshTokens(userId);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieClearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };
  res.clearCookie('accessToken', cookieClearOptions);
  res.clearCookie('refreshToken', cookieClearOptions);

  sendSuccess(res, null, 'Logged out successfully');
});

/**
 * @desc Get current user profile
 * @route GET /api/v1/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res, next) => {
  // Load full document since we're returning the complete profile
  const user = await req.loadFullUser();
  sendSuccess(res, formatUserPayload(user), 'Current user profile retrieved');
});

/**
 * @desc Update current user profile (name, phone, addresses)
 * @route PATCH /api/v1/auth/me
 * @access Private
 */
const updateMe = asyncHandler(async (req, res, next) => {
  const { name, phone, addresses } = req.body;

  // Only allow safe fields — role and email cannot be self-updated
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone;
  if (addresses !== undefined) updates.addresses = addresses;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields provided for update',
      data: null,
    });
  }

  if (updates.name && updates.name.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters',
      data: null,
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  sendSuccess(res, formatUserPayload(updatedUser), 'Profile updated successfully');
});

export { register, login, forgotPassword, resetPassword, refreshToken, logout, getMe, updateMe, };
