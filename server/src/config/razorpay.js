import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from './env.js';

// Guard: fail fast if keys are missing rather than silently using hardcoded fallbacks.
// Hardcoded secrets must never appear in source — use environment variables.
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (razorpayInstance) return razorpayInstance;

  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    throw new Error('Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  razorpayInstance = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });

  return razorpayInstance;
};

/**
 * Create Razorpay Order
 * @param {number} amount - Amount in paise (₹1 = 100 paise)
 * @param {string} currency - Currency code (default: INR)
 * @param {object} options - Additional order options
 * @returns {Promise<object>}
 */
const createRazorpayOrder = async (amount, currency = 'INR', options = {}) => {
  try {
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: options.notes || {},
      ...options,
    };

    const order = await getRazorpayInstance().orders.create(orderData);
    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verify Razorpay Payment Signature
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} signature - Razorpay Signature
 * @returns {boolean}
 */
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    if (!config.razorpayKeySecret) {
      console.error('[Razorpay] RAZORPAY_KEY_SECRET not set — signature verification will always fail');
      return false;
    }
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(text)
      .digest('hex');
    return generated_signature === signature;
  } catch (error) {
    console.error('Signature Verification Error:', error);
    return false;
  }
};

/**
 * Fetch Payment Details
 * @param {string} paymentId - Razorpay Payment ID
 * @returns {Promise<object>}
 */
const fetchPaymentDetails = async (paymentId) => {
  try {
    const payment = await getRazorpayInstance().payments.fetch(paymentId);
    return {
      success: true,
      data: payment,
    };
  } catch (error) {
    console.error('Razorpay Payment Fetch Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Capture Razorpay Payment
 * @param {string} paymentId - Razorpay Payment ID
 * @param {number} amount - Amount to capture in paise
 * @returns {Promise<object>}
 */
const captureRazorpayPayment = async (paymentId, amount) => {
  try {
    const payment = await getRazorpayInstance().payments.capture(
      paymentId,
      Math.round(amount * 100)
    );
    return {
      success: true,
      data: payment,
    };
  } catch (error) {
    console.error('Razorpay Payment Capture Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Refund Razorpay Payment
 * @param {string} paymentId - Razorpay Payment ID
 * @param {number} [amount] - Amount to refund (optional, defaults to full refund)
 * @returns {Promise<object>}
 */
const refundRazorpayPayment = async (paymentId, amount = null) => {
  try {
    const refundData = {};
    if (amount !== null) {
      refundData.amount = Math.round(amount * 100); // convert to paise
    }
    const refund = await getRazorpayInstance().payments.refund(paymentId, refundData);
    return {
      success: true,
      data: refund,
    };
  } catch (error) {
    console.error('Razorpay Payment Refund Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export { razorpayInstance, createRazorpayOrder, verifyRazorpaySignature, fetchPaymentDetails, captureRazorpayPayment, refundRazorpayPayment, };
