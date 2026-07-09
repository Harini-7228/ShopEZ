import apiClient from './apiClient';

// Razorpay Key ID (public key from environment or hardcoded for demo)
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5ibUubEsb3e';

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in INR
 * @returns {Promise}
 */
export const createRazorpayOrder = async (amount, couponCode) => {
  try {
    const response = await apiClient.post('/payments/razorpay/create-order', {
      amount,
      couponCode,
      currency: 'INR',
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify Razorpay payment and create order
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} signature - Razorpay Signature
 * @param {object} shippingAddress - Shipping address object
 * @param {string} couponCode - Optional coupon code
 * @returns {Promise}
 */
export const verifyRazorpayPayment = async (orderId, paymentId, signature, shippingAddress, couponCode) => {
  try {
    const response = await apiClient.post('/payments/razorpay/verify', {
      orderId,
      paymentId,
      signature,
      shippingAddress,
      couponCode,
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    throw error;
  }
};

/**
 * Load Razorpay script — idempotent.
 * Checks if the script is already present before injecting a new tag,
 * so navigating back to Checkout does not append duplicate scripts.
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Already loaded — resolve immediately
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    // Script tag already injected but not yet executed
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.onload = () => resolve(true);
      existing.onerror = () => resolve(false);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Open Razorpay Checkout Modal
 * @param {object} options - Checkout options
 * @returns {Promise}
 */
export const openRazorpayCheckout = (options) => {
  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay({
      ...options,
      handler: (response) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
    });
    razorpay.open();
  });
};
