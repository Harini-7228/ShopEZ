const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc Get platform sales summary
 * @route GET /api/v1/admin/dashboard/sales-summary
 * @access Private (Admin only)
 */
const getSalesSummary = asyncHandler(async (req, res, next) => {
  // Aggregate successful payments
  const paymentStats = await Payment.aggregate([
    { $match: { status: 'success' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  const totalRevenue = paymentStats.length > 0 ? paymentStats[0].totalRevenue : 0;
  const transactionCount = paymentStats.length > 0 ? paymentStats[0].transactionCount : 0;

  // Count orders by status
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
  const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

  sendSuccess(
    res,
    {
      totalRevenue,
      transactionCount,
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
    },
    'Sales summary retrieved successfully'
  );
});

/**
 * @desc Get top selling sellers based on order items
 * @route GET /api/v1/admin/dashboard/top-sellers
 * @access Private (Admin only)
 */
const getTopSellers = asyncHandler(async (req, res, next) => {
  const topSellersAgg = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.sellerId',
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        totalItemsSold: { $sum: '$items.quantity' },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
  ]);

  // Populate seller profiles
  const topSellers = [];
  for (const seller of topSellersAgg) {
    const userDetails = await User.findById(seller._id).select('name email sellerImpactScore isLocalSeller');
    if (userDetails) {
      topSellers.push({
        seller: userDetails,
        totalRevenue: seller.totalRevenue,
        totalItemsSold: seller.totalItemsSold,
      });
    }
  }

  sendSuccess(res, topSellers, 'Top sellers list retrieved successfully');
});

/**
 * @desc Get low-stock product report (stock <= 5)
 * @route GET /api/v1/admin/dashboard/low-stock
 * @access Private (Admin only)
 */
const getLowStockReport = asyncHandler(async (req, res, next) => {
  const lowStockProducts = await Product.find({
    stock: { $lte: 5 },
    status: { $ne: 'inactive' },
  }).populate('sellerId', 'name email');

  sendSuccess(res, lowStockProducts, 'Low stock report generated successfully');
});

/**
 * @desc List all platform users
 * @route GET /api/v1/admin/users
 * @access Private (Admin only)
 */
const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  sendSuccess(res, users, 'Users list retrieved successfully');
});

/**
 * @desc Update user role
 * @route PUT /api/v1/admin/users/:id/role
 * @access Private (Admin only)
 */
const updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!role || !['customer', 'seller', 'admin', 'delivery'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid user role',
      data: null,
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      data: null,
    });
  }

  user.role = role;
  await user.save();

  sendSuccess(res, { id: user._id, role: user.role }, 'User role updated successfully');
});

/**
 * @desc Delete user
 * @route DELETE /api/v1/admin/users/:id
 * @access Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      data: null,
    });
  }

  // Prevent admin from deleting self
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Self-deletion of admin accounts is restricted',
      data: null,
    });
  }

  await User.findByIdAndDelete(req.params.id);

  sendSuccess(res, null, 'User deleted successfully');
});

module.exports = {
  getSalesSummary,
  getTopSellers,
  getLowStockReport,
  getUsers,
  updateUserRole,
  deleteUser,
};
