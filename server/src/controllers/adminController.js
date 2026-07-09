import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import PriceAlert from '../models/PriceAlert.js';
import ReorderReminder from '../models/ReorderReminder.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc Get platform sales summary
 * @route GET /api/v1/admin/dashboard/sales-summary
 * @access Private (Admin only)
 */
const getSalesSummary = asyncHandler(async (req, res, next) => {
  // Run all 5 queries in parallel instead of sequentially
  const [paymentStats, totalOrders, pendingOrders, deliveredOrders, cancelledOrders] =
    await Promise.all([
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' }, transactionCount: { $sum: 1 } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
    ]);

  sendSuccess(
    res,
    {
      totalRevenue:     paymentStats[0]?.totalRevenue     ?? 0,
      transactionCount: paymentStats[0]?.transactionCount ?? 0,
      orders: { total: totalOrders, pending: pendingOrders, delivered: deliveredOrders, cancelled: cancelledOrders },
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
        totalRevenue:   { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        totalItemsSold: { $sum: '$items.quantity' },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
  ]);

  // Batch-fetch all seller profiles in one query instead of N individual lookups
  const sellerIds = topSellersAgg.map((s) => s._id);
  const sellers   = await User.find({ _id: { $in: sellerIds } })
    .select('name email sellerImpactScore isLocalSeller')
    .lean();
  const sellerMap = new Map(sellers.map((s) => [s._id.toString(), s]));

  const topSellers = topSellersAgg
    .map((s) => {
      const seller = sellerMap.get(s._id?.toString());
      if (!seller) return null;
      return { seller, totalRevenue: s.totalRevenue, totalItemsSold: s.totalItemsSold };
    })
    .filter(Boolean);

  sendSuccess(res, topSellers, 'Top sellers list retrieved successfully');
});

/**
 * @desc Get low-stock product report (stock <= 5)
 * @route GET /api/v1/admin/dashboard/low-stock
 * @access Private (Admin only)
 */
const getLowStockReport = asyncHandler(async (req, res, next) => {
  const threshold = Math.min(parseInt(req.query.threshold, 10) || 5, 50);

  const lowStockProducts = await Product.find({
    stock:  { $lte: threshold },
    status: { $ne: 'inactive' },
  })
    .populate('sellerId', 'name email')
    .sort({ stock: 1 })   // lowest stock first
    .limit(200)            // hard cap — use exports for full data
    .lean();

  sendSuccess(res, lowStockProducts, 'Low stock report generated successfully');
});

/**
 * @desc List all platform users
 * @route GET /api/v1/admin/users
 * @access Private (Admin only)
 */
const getUsers = asyncHandler(async (req, res, next) => {
  const page     = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit    = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const skip     = (page - 1) * limit;
  const { role, search } = req.query;

  const filter = {};
  if (role)   filter.role = role;
  if (search) {
    const safe = search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name:  { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, { users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }, 'Users list retrieved successfully');
});

/**
 * @desc Update user role
 * @route PUT /api/v1/admin/users/:id/role
 * @access Private (Admin only)
 */
const updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!role || !['customer', 'seller', 'admin', 'delivery'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid user role', data: null });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null });
  }

  // Prevent self-role change (could accidentally lock out the admin)
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot change your own role', data: null });
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
    return res.status(404).json({ success: false, message: 'User not found', data: null });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Self-deletion of admin accounts is restricted', data: null });
  }

  // Cascade-delete all data owned by this user in parallel.
  // Leaves Orders intact (they belong to order history) but deactivates
  // any products they sell so they stop appearing in the catalog.
  await Promise.all([
    Cart.deleteOne({ userId: user._id }),
    Wishlist.deleteOne({ userId: user._id }),
    PriceAlert.deleteMany({ userId: user._id }),
    ReorderReminder.deleteMany({ userId: user._id }),
    // Deactivate seller products rather than hard-delete
    // (hard delete would orphan existing order items)
    Product.updateMany({ sellerId: user._id }, { $set: { status: 'inactive' } }),
  ]);

  await User.findByIdAndDelete(req.params.id);

  sendSuccess(res, null, 'User deleted and associated data cleaned up successfully');
});

export { getSalesSummary, getTopSellers, getLowStockReport, getUsers, updateUserRole, deleteUser, };
