const paymentGateway = require('../config/payment');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

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

module.exports = {
  createPaymentIntent,
  verifyPayment,
  webhookHandler,
};
