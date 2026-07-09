import PriceAlert from '../models/PriceAlert.js';
import Product from '../models/Product.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc Subscribe to price-drop or back-in-stock alert
 * @route POST /api/v1/alerts/subscribe
 * @access Private
 */
const subscribeAlert = asyncHandler(async (req, res, next) => {
  const { productId, type, targetPrice } = req.body;

  // 1. Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  // 2. Validate request properties
  if (!type || !['price_drop', 'back_in_stock'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid alert type: price_drop | back_in_stock',
      data: null,
    });
  }

  if (type === 'price_drop') {
    const parsedTarget = parseFloat(targetPrice);
    if (!targetPrice || isNaN(parsedTarget) || parsedTarget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a valid positive target price for price drop notifications',
        data: null,
      });
    }
    // Also ensure target is below current price — otherwise the alert would never fire
    const currentPrice = (product.discountPrice != null && product.discountPrice > 0)
      ? product.discountPrice
      : product.price;
    if (parsedTarget >= currentPrice) {
      return res.status(400).json({
        success: false,
        message: `Target price must be below the current price of ₹${currentPrice}`,
        data: null,
      });
    }
  }

  // 3. Create or update alert subscription
  const alert = await PriceAlert.findOneAndUpdate(
    { userId: req.user._id, productId, type },
    {
      targetPrice: type === 'price_drop' ? targetPrice : undefined,
      active: true,
    },
    { new: true, upsert: true }
  );

  sendSuccess(res, alert, `Successfully subscribed to ${type.replace('_', ' ')} alert`);
});

/**
 * @desc List currently active alerts for logged-in user
 * @route GET /api/v1/alerts
 * @access Private
 */
const listAlerts = asyncHandler(async (req, res, next) => {
  const alerts = await PriceAlert.find({ userId: req.user._id, active: true })
    .populate('productId', 'name price discountPrice stock images status')
    .sort({ createdAt: -1 });

  sendSuccess(res, alerts, 'Active price alerts retrieved successfully');
});

/**
 * @desc Unsubscribe from alert
 * @route DELETE /api/v1/alerts/:id
 * @access Private
 */
const unsubscribeAlert = asyncHandler(async (req, res, next) => {
  const alert = await PriceAlert.findById(req.params.id);

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: 'Alert subscription not found',
      data: null,
    });
  }

  // Ensure owner is unsubscribing
  if (alert.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to unsubscribe this alert',
      data: null,
    });
  }

  await PriceAlert.findByIdAndDelete(req.params.id);

  sendSuccess(res, null, 'Unsubscribed from alert successfully');
});

export { subscribeAlert, listAlerts, unsubscribeAlert, };
