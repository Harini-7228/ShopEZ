/**
 * Middleware to restrict route access to specific roles.
 * @param {...string} roles - Allowed roles (e.g. 'customer', 'seller', 'admin', 'delivery')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Ensure req.user exists and has a role
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'none'}' does not have permission to access this resource.`,
        data: null,
      });
    }
    next();
  };
};

module.exports = {
  restrictTo,
};
