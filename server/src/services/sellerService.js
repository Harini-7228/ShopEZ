import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

/**
 * Recalculates a seller's trust rating based on:
 * - Number of orders fulfilled successfully
 * - Average review ratings of their products
 * - Repeat customer rate (proportion of unique customers who bought multiple times)
 * Updates the seller's User record and returns the breakdown.
 */
const calculateSellerImpactScore = async (sellerId) => {
  // 1. Fetch all product IDs owned by this seller
  const products = await Product.find({ sellerId }).select('_id').lean();
  const productIds = products.map((p) => p._id);

  if (productIds.length === 0) {
    await User.findByIdAndUpdate(sellerId, { sellerImpactScore: 0 });
    return { finalScore: 0, breakdown: { ordersFulfilled: 0, avgRating: 0, repeatCustomerRate: 0, totalDeliveredOrders: 0, scores: { fulfillmentScore: 0, ratingScore: 0, repeatScore: 0 } } };
  }

  // 2. Fetch delivered orders — lean() since we only need userId
  const orders = await Order.find({
    status: 'delivered',
    'items.productId': { $in: productIds },
  }).select('userId').lean();

  const ordersFulfilled = orders.length;
  const customerPurchaseCounts = {};
  orders.forEach((order) => {
    const custId = order.userId.toString();
    customerPurchaseCounts[custId] = (customerPurchaseCounts[custId] || 0) + 1;
  });

  const totalCustomers   = Object.keys(customerPurchaseCounts).length;
  const repeatCustomers  = Object.values(customerPurchaseCounts).filter((c) => c > 1).length;
  const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

  // 3. Compute average rating via aggregation — avoids loading all review
  //    documents into memory (previously: Review.find → in-memory reduce)
  const ratingAgg = await Review.aggregate([
    { $match: { productId: { $in: productIds } } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } },
  ]);
  const avgRating = ratingAgg[0]?.avgRating ?? 0;

  // 4. Score calculation
  const fulfillmentScore = Math.min(ordersFulfilled * 4, 40);
  const ratingScore      = avgRating * 8;
  const repeatScore      = (repeatCustomerRate / 100) * 20;
  const finalScore       = Math.min(Math.round(fulfillmentScore + ratingScore + repeatScore), 100);

  await User.findByIdAndUpdate(sellerId, { sellerImpactScore: finalScore });

  return {
    finalScore,
    breakdown: {
      ordersFulfilled,
      avgRating: Math.round(avgRating * 10) / 10,
      repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
      totalDeliveredOrders: orders.length,
      scores: { fulfillmentScore, ratingScore, repeatScore },
    },
  };
};

export { calculateSellerImpactScore, };
