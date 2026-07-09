/**
 * Middleware to restrict route access to specific roles.
 *
 * Security note: the 403 response deliberately does NOT echo back the
 * user's role or the list of allowed roles — doing so lets an attacker
 * enumerate valid roles by probing endpoints with different credentials.
 *
 * @param {...string} roles - Allowed roles (e.g. 'customer', 'seller', 'admin', 'delivery')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource.',
        data: null,
      });
    }
    next();
  };
};

export { restrictTo };
