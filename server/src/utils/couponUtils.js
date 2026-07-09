/**
 * Coupon definitions and calculation logic.
 */

const VALID_COUPONS = {
  SAVE10: {
    discount: 10,
    minAmount: 500,
    description: '10% off on orders ₹500+',
  },
  SHOPEZ15: {
    discount: 15,
    minAmount: 3000,
    description: '15% off on orders ₹3000+',
  },
};

/**
 * Look up a coupon by code (case-insensitive).
 * @param {string} code
 * @returns {object|null} coupon definition or null if not found
 */
const getCoupon = (code) => {
  if (!code) return null;
  return VALID_COUPONS[code.trim().toUpperCase()] || null;
};

/**
 * Calculate the discount amount for a given subtotal and coupon code.
 * Returns 0 if the coupon is invalid or the minimum amount is not met.
 *
 * @param {string} couponCode
 * @param {number} subtotal
 * @returns {{ discountAmount: number, coupon: object|null }}
 */
const applyCoupon = (couponCode, subtotal) => {
  const coupon = getCoupon(couponCode);
  if (!coupon || subtotal < coupon.minAmount) {
    return { discountAmount: 0, coupon: coupon || null };
  }
  const discountAmount = Math.round((subtotal * coupon.discount) / 100 * 100) / 100;
  return { discountAmount, coupon };
};

/**
 * Return the full list of available coupons as an array.
 * @returns {Array<{ code, discount, minAmount, description }>}
 */
const listCoupons = () =>
  Object.entries(VALID_COUPONS).map(([code, details]) => ({ code, ...details }));

export { VALID_COUPONS, getCoupon, applyCoupon, listCoupons };
