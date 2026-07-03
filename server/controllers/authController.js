const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper to set cookies for authentication tokens
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
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
      user: {
        _id: user._id,    // Used by frontend components (ProductDetail, UserManagement)
        id: user._id,     // Kept for backwards-compat
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        addresses: user.addresses || [],
        isLocalSeller: user.isLocalSeller,
        sellerImpactScore: user.sellerImpactScore,
      },
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

  // Guard: even if route validator is bypassed, never allow admin self-registration (Fix #7)
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

  sendTokenResponse(user, 201, res, 'User registered successfully');
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

  sendTokenResponse(user, 200, res, 'Logged in successfully');
});

/**
 * @desc Refresh access token
 * @route POST /api/v1/auth/refresh-token
 * @access Public
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  let token = req.cookies.refreshToken;

  // Check if token was passed in body (fallback)
  if (!token && req.body.refreshToken) {
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
    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Owner of this token does not exist anymore.',
        data: null,
      });
    }

    sendTokenResponse(user, 200, res, 'Token refreshed successfully');
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token. Please login again.',
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
  // Mirror the same cookie attributes used at login so browsers correctly overwrite them (Fix #8)
  const cookieClearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(Date.now() + 5 * 1000), // effectively immediate
  };
  res.cookie('accessToken', 'none', cookieClearOptions);
  res.cookie('refreshToken', 'none', cookieClearOptions);

  sendSuccess(res, null, 'Logged out successfully');
});

/**
 * @desc Get current user profile
 * @route GET /api/v1/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res, next) => {
  // req.user is attached by protect middleware
  sendSuccess(res, req.user, 'Current user profile retrieved');
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

  sendSuccess(res, updatedUser, 'Profile updated successfully');
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateMe,
};
