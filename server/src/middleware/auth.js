import { verifyAccessToken } from '../utils/token.js';
import User from '../models/User.js';

/**
 * protect — JWT verification middleware.
 *
 * Performance strategy:
 *   For the vast majority of routes, the JWT payload already contains
 *   { id, role, email } — enough to run business logic and role checks
 *   without a DB round-trip on every request.
 *
 *   A live DB lookup is only performed when the route explicitly opts in
 *   via `req.needsFullUser = true` (set in the route file before this
 *   middleware), or when the decoded token is missing the role field
 *   (older tokens issued before the role was added to the payload).
 *
 *   This eliminates one MongoDB query per authenticated API call.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Missing token.',
      data: null,
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Fast path: build req.user from JWT payload without hitting the DB.
    // Routes that need the full Mongoose document (e.g. profile update,
    // password change) should call `await req.loadFullUser()` themselves.
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    // Lazy loader — called only when the full document is needed.
    req.loadFullUser = async () => {
      if (req.user._isFullDocument) return req.user;
      const user = await User.findById(decoded.id).select('-passwordHash').lean();
      if (!user) {
        const err = new Error('The user belonging to this token no longer exists.');
        err.statusCode = 401;
        throw err;
      }
      // Merge full document fields into req.user in-place
      Object.assign(req.user, user, { _isFullDocument: true });
      return req.user;
    };

    // Back-compat: if role is missing from token (old tokens), force a DB load
    if (!decoded.role) {
      await req.loadFullUser();
    }

    next();
  } catch (error) {
    // Return explicit 401 for token-specific errors — do NOT let them surface as 500s
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        success: false,
        message:
          error.name === 'TokenExpiredError'
            ? 'Token has expired. Please refresh your session.'
            : 'Invalid token. Please login again.',
        data: null,
      });
    }
    // Programming errors (DB down, etc.) → global error handler
    next(error);
  }
};

export { protect };
