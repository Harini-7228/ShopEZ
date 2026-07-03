const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

/**
 * Middleware to protect routes and verify JWT Access Token.
 */
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Missing token.',
      data: null,
    });
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch user from DB and attach to request
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
        data: null,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Let the error handling middleware capture it
    next(error);
  }
};

module.exports = {
  protect,
};
