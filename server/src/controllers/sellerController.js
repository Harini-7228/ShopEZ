import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { calculateSellerImpactScore } from '../services/sellerService.js';

/**
 * @desc Get seller dashboard details (products, orders, trust breakdown)
 * @route GET /api/v1/seller/dashboard
 * @access Private (Seller and Admin only)
 */
const getSellerDashboard = asyncHandler(async (req, res, next) => {
  const sellerId = req.user._id;

  // Use cached score from User document by default to optimize performance.
  // Recalculation can be forced by appending ?refresh=true.
  let scoreData;
  if (req.query.refresh === 'true') {
    scoreData = await calculateSellerImpactScore(sellerId);
  } else {
    const seller = await User.findById(sellerId).select('sellerImpactScore').lean();
    scoreData = {
      finalScore: seller?.sellerImpactScore ?? 0,
      breakdown: null, // full breakdown available via ?refresh=true
    };
  }

  // Run products count + recent orders + full product list in parallel
  const [productsCount, ordersCount, products, recentOrders] = await Promise.all([
    Product.countDocuments({ sellerId }),
    Order.countDocuments({ 'items.sellerId': sellerId }),
    Product.find({ sellerId }).populate('category', 'name').lean(),
    // Cap at 50 most recent orders — full history available via /orders/admin/all
    Order.find({ 'items.sellerId': sellerId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  sendSuccess(
    res,
    {
      trustScore:     scoreData.finalScore,
      trustBreakdown: scoreData.breakdown,
      productsCount,
      ordersCount,
      products,
      orders: recentOrders,
    },
    'Seller dashboard data retrieved successfully'
  );
});

export { getSellerDashboard, calculateSellerImpactScore };
