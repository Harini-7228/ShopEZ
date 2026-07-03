const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * =========================================================================
 * ISOLATED FUNCTION: MERCHANT TRUST SCORE CALCULATION
 * =========================================================================
 * Recalculates a seller's trust rating based on:
 * - Number of orders fulfilled successfully
 * - Average review ratings of their products
 * - Repeat customer rate (proportion of unique customers who bought multiple times)
 * Updates the seller's User record and returns the breakdown.
 */
const calculateSellerImpactScore = async (sellerId) => {
  // 1. Fetch all products owned by this seller
  const products = await Product.find({ sellerId }).select('_id');
  const productIds = products.map((p) => p._id);

  // 2. Fetch all completed/delivered orders containing this seller's products
  const orders = await Order.find({
    status: 'delivered',
    'items.productId': { $in: productIds },
  });

  // Calculate orders fulfilled
  let ordersFulfilled = orders.length;
  const customerPurchaseCounts = {}; // Track repeat customers

  orders.forEach((order) => {
    // Track customer purchase frequencies
    const custId = order.userId.toString();
    customerPurchaseCounts[custId] = (customerPurchaseCounts[custId] || 0) + 1;
  });

  // Calculate Repeat Customer Rate
  const totalCustomers = Object.keys(customerPurchaseCounts).length;
  const repeatCustomers = Object.values(customerPurchaseCounts).filter((count) => count > 1).length;
  const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

  // 3. Get average ratings for the seller's products
  const reviews = await Review.find({ productId: { $in: productIds } });
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length
    : 0;

  // 4. Score Calculation Formula
  // Fulfillment: 40% weight (e.g. 4 points per order up to 40)
  const fulfillmentScore = Math.min(ordersFulfilled * 4, 40);
  // Average Rating: 40% weight (rating out of 5 scaled to 40)
  const ratingScore = avgRating * 8;
  // Repeat Customers: 20% weight (scaled rate up to 20)
  const repeatScore = (repeatCustomerRate / 100) * 20;

  const finalScore = Math.min(Math.round(fulfillmentScore + ratingScore + repeatScore), 100);

  // Update user model (reuse sellerImpactScore schema property as trust rating)
  await User.findByIdAndUpdate(sellerId, { sellerImpactScore: finalScore });

  return {
    finalScore,
    breakdown: {
      ordersFulfilled,
      avgRating: Math.round(avgRating * 10) / 10,
      repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
      totalDeliveredOrders: orders.length,
      scores: {
        fulfillmentScore,
        ratingScore,
        repeatScore,
      },
    },
  };
};

/**
 * @desc Get seller dashboard details (products, orders, trust breakdown)
 * @route GET /api/v1/seller/dashboard
 * @access Private (Seller and Admin only)
 */
const getSellerDashboard = asyncHandler(async (req, res, next) => {
  const sellerId = req.user._id;

  // Recalculate trust score
  const scoreData = await calculateSellerImpactScore(sellerId);

  // Get products list
  const products = await Product.find({ sellerId }).populate('category', 'name');

  // Get orders list (containing seller items)
  const orders = await Order.find({
    'items.sellerId': sellerId,
  })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  sendSuccess(
    res,
    {
      trustScore: scoreData.finalScore,
      trustBreakdown: scoreData.breakdown,
      productsCount: products.length,
      ordersCount: orders.length,
      products,
      orders,
    },
    'Seller dashboard data retrieved successfully'
  );
});

module.exports = {
  getSellerDashboard,
  calculateSellerImpactScore,
};
