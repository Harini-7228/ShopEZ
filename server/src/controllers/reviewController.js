import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc Create a product review
 * @route POST /api/v1/reviews
 * @access Private
 */
const createReview = asyncHandler(async (req, res, next) => {
  const { productId, rating, comment } = req.body;

  // 1. Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  // 2. Verify that user has purchased this product and it has been delivered
  const verifiedPurchase = await Order.findOne({
    userId: req.user._id,
    status: 'delivered',
    'items.productId': productId,
  });

  if (!verifiedPurchase) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You must have purchased and received this product to submit a review.',
      data: null,
    });
  }

  // 3. Check if user already submitted a review
  const existingReview = await Review.findOne({
    userId: req.user._id,
    productId,
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already submitted a review for this product. Delete or modify it instead.',
      data: null,
    });
  }

  // 4. Create review
  const review = await Review.create({
    userId: req.user._id,
    productId,
    rating,
    comment,
  });

  // Recalculate average rating explicitly to surface errors properly.
  try {
    await Review.calculateAverageRating(productId);
  } catch (ratingErr) {
    // Non-fatal: review was saved. Rating recalculates on the next review event.
    console.error(`[WARN] Rating recalculation failed for product ${productId}:`, ratingErr.message);
  }

  sendSuccess(res, review, 'Review submitted successfully', 201);
});

/**
 * @desc Get all reviews for a product
 * @route GET /api/v1/reviews/product/:productId
 * @access Public
 */
const getProductReviews = asyncHandler(async (req, res, next) => {
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip  = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ productId: req.params.productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ productId: req.params.productId }),
  ]);

  sendSuccess(res, { reviews, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }, 'Product reviews retrieved successfully');
});

/**
 * @desc Delete own review
 * @route DELETE /api/v1/reviews/:id
 * @access Private
 */
const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
      data: null,
    });
  }

  // Ensure owner is deleting
  if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review',
      data: null,
    });
  }

  // Use findByIdAndDelete to trigger post('findOneAndDelete') hook on Review schema
  await Review.findByIdAndDelete(req.params.id);

  sendSuccess(res, null, 'Review deleted successfully');
});

export { createReview, getProductReviews, deleteReview, };
