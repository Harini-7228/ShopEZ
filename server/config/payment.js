/**
 * Payment Gateway Adapter Placeholder (Razorpay/Stripe-style adapter)
 * This interface is designed to be easily swappable with a live payment API.
 */
class MockPaymentGatewayAdapter {
  constructor() {
    this.name = 'MockGateway';
  }

  /**
   * Simulates creating a payment intent/order on the gateway side.
   * @param {number} amount - Amount in basic currency unit (e.g. cents/paise)
   * @param {string} currency - e.g. 'USD' or 'INR'
   * @returns {Promise<{id: string, amount: number, status: string, clientSecret: string}>}
   */
  async createPaymentIntent(amount, currency = 'USD') {
    // Generate a mock gateway order/intent ID
    const intentId = 'pi_' + Math.random().toString(36).substring(2, 15);
    return {
      id: intentId,
      amount,
      currency,
      status: 'requires_payment_method',
      clientSecret: `${intentId}_secret_${Math.random().toString(36).substring(2, 8)}`,
    };
  }

  /**
   * Simulates verifying/confirming payment details.
   * @param {string} gatewayRef - The gateway transaction or payment intent reference ID.
   * @returns {Promise<{status: 'success' | 'failed', ref: string}>}
   */
  async verifyPayment(gatewayRef) {
    // For mock testing, any payment intent ID starting with 'pi_' containing even digits returns success, odd returns failure (or just succeed all for demo)
    const isFailedId = gatewayRef.includes('fail');
    return {
      status: isFailedId ? 'failed' : 'success',
      ref: gatewayRef,
    };
  }

  /**
   * Simulates receiving a webhook event signature confirmation.
   * @param {object} payload - Webhook request payload
   * @param {string} signature - Webhook signature header
   * @returns {object} - The parsed and verified event
   */
  verifyWebhook(payload, signature) {
    // Mock validation logic
    if (!signature) {
      throw new Error('Invalid signature');
    }
    return {
      type: payload.type || 'payment_intent.succeeded',
      data: payload.data || {},
    };
  }
}

module.exports = new MockPaymentGatewayAdapter();
