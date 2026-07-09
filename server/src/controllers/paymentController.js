import paymentGateway from '../services/paymentService.js';
import { createRazorpayOrder, verifyRazorpaySignature, fetchPaymentDetails, refundRazorpayPayment } from '../config/razorpay.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getValidatedCart, buildProductMap, processCheckout } from '../services/checkoutService.js';
import { applyCoupon } from '../utils/couponUtils.js';

/**
 * @desc Create payment intent
 * @route POST /api/v1/payments/intent
 * @access Private
 */
const createPaymentIntent = asyncHandler(async (req, res, next) => {
  const { amount, currency = 'USD' } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid payment amount',
      data: null,
    });
  }

  const intent = await paymentGateway.createPaymentIntent(amount, currency);

  sendSuccess(res, intent, 'Payment intent created successfully');
});

/**
 * @desc Verify payment status
 * @route POST /api/v1/payments/verify
 * @access Private
 */
const verifyPayment = asyncHandler(async (req, res, next) => {
  const { gatewayRef, orderId } = req.body;

  if (!gatewayRef || !orderId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide gatewayRef and orderId parameters',
      data: null,
    });
  }

  const verification = await paymentGateway.verifyPayment(gatewayRef);

  // Update order status if payment succeeds
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Associated order not found',
      data: null,
    });
  }

  const payment = await Payment.findOne({ orderId });
  if (payment) {
    payment.status = verification.status === 'success' ? 'success' : 'failed';
    payment.gatewayRef = gatewayRef;
    await payment.save();
  }

  if (verification.status === 'success') {
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: `Payment confirmed via gateway: ${gatewayRef}`,
    });
    await order.save();
  }

  sendSuccess(res, { verification }, `Payment transaction verification status: ${verification.status}`);
});

/**
 * @desc Mock Webhook receiver
 * @route POST /api/v1/payments/webhook
 * @access Public
 */
const webhookHandler = asyncHandler(async (req, res, next) => {
  const sig = req.headers['x-webhook-signature'];

  try {
    const verifiedEvent = paymentGateway.verifyWebhook(req.body, sig);

    // Mock processing logic based on event type
    console.log(`Received webhook event: ${verifiedEvent.type}`);

    if (verifiedEvent.type === 'payment_intent.succeeded') {
      const intentData = verifiedEvent.data;
      // Handle business logic for success event (e.g. updating order flags, email notification)
    }

    sendSuccess(res, { received: true }, 'Webhook received and processed');
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Webhook signature verification failed: ${error.message}`,
      data: null,
    });
  }
});

/**
 * @desc Create Razorpay Order (without creating ShopEZ order yet)
 * @route POST /api/v1/payments/razorpay/create-order
 * @access Private
 */
const createRazorpayPaymentOrder = asyncHandler(async (req, res, next) => {
  const { amount, currency = 'INR', couponCode } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid payment amount',
      data: null,
    });
  }

  // Validate cart and compute server-side total
  const cart = await getValidatedCart(req.user._id);
  const productMap = await buildProductMap(cart.items);

  let subtotal = 0;
  for (const item of cart.items) {
    const product = productMap.get(item.productId.toString());
    const price =
      product.discountPrice != null && product.discountPrice > 0
        ? product.discountPrice
        : product.price;
    subtotal += price * item.quantity;
  }

  const { discountAmount } = applyCoupon(couponCode, subtotal);
  const payableAmount = Math.max(subtotal - discountAmount, 0);

  const result = await createRazorpayOrder(payableAmount, currency, {
    notes: {
      userId: req.user._id.toString(),
      cartItemCount: cart.items.length,
      originalAmount: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      requestedAmount: Number(amount).toFixed(2),
      payableAmount: payableAmount.toFixed(2),
      couponCode: couponCode || '',
    },
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error || 'Failed to create Razorpay order',
      data: null,
    });
  }

  sendSuccess(res, result.data, 'Razorpay order created successfully');
});

/**
 * @desc Verify Razorpay Payment and Create Order
 * @route POST /api/v1/payments/razorpay/verify
 * @access Private
 */
const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  const { orderId, paymentId, signature, shippingAddress, couponCode } = req.body;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      message: 'orderId (razorpayOrderId), paymentId, and signature are required',
      data: null,
    });
  }

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Shipping address is required',
      data: null,
    });
  }

  const isSignatureValid = verifyRazorpaySignature(orderId, paymentId, signature);
  if (!isSignatureValid) {
    return res.status(400).json({
      success: false,
      message: 'Payment signature verification failed',
      data: null,
    });
  }

  const paymentDetails = await fetchPaymentDetails(paymentId);
  if (!paymentDetails.success) {
    return res.status(400).json({ success: false, message: 'Failed to fetch payment details', data: null });
  }

  if (!paymentDetails.data.captured) {
    return res.status(400).json({ success: false, message: 'Payment not captured yet', data: null });
  }

  try {
    const { order } = await processCheckout({
      userId: req.user._id,
      shippingAddress,
      paymentMethod: 'razorpay',
      couponCode,
      gatewayRef: paymentId,
      razorpayOrderId: orderId,
      razorpaySignature: signature,
      paymentStatus: 'success',
    });

    sendSuccess(
      res,
      { payment: paymentDetails.data, verified: true, order },
      'Payment verified and order created successfully'
    );
  } catch (err) {
    console.error('CRITICAL: Payment captured but checkout failed! Initiating automated refund...', err);
    try {
      const refundResult = await refundRazorpayPayment(paymentId);
      if (refundResult.success) {
        console.log('Automated refund successful:', refundResult.data);
        return res.status(err.statusCode || 500).json({
          success: false,
          message: `${err.message} Since your payment was already captured, a full refund has been automatically initiated.`,
          data: { refunded: true, refundId: refundResult.data.id },
        });
      } else {
        console.error('CRITICAL ERROR: Automated refund call failed to execute:', refundResult.error);
        return res.status(err.statusCode || 500).json({
          success: false,
          message: `${err.message} Payment was captured, but automated refund failed. Please contact support.`,
          data: { refunded: false, error: refundResult.error },
        });
      }
    } catch (refundErr) {
      console.error('CRITICAL ERROR: Exception while attempting automated refund:', refundErr);
      return res.status(err.statusCode || 500).json({
        success: false,
        message: `${err.message} Payment was captured, but automated refund encountered an error. Please contact support.`,
        data: { refunded: false, error: refundErr.message },
      });
    }
  }
});

export { createPaymentIntent, verifyPayment, webhookHandler, createRazorpayPaymentOrder, verifyRazorpayPayment, };
