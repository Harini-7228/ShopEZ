import express from 'express';
import { getCoupon, applyCoupon, listCoupons } from '../utils/couponUtils.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = express.Router();

/**
 * POST /api/v1/coupons/validate
 * Validate a coupon code against a given order amount.
 */
router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const { code, amount } = req.body;

    if (!code || !amount) {
      return sendError(res, 'Coupon code and amount are required', 400);
    }

    const coupon = getCoupon(code);
    if (!coupon) {
      return sendError(res, 'Invalid coupon code', 404);
    }

    if (amount < coupon.minAmount) {
      return sendError(
        res,
        `Minimum order amount ₹${coupon.minAmount} required for this coupon`,
        400
      );
    }

    const { discountAmount } = applyCoupon(code, amount);

    return sendSuccess(res, {
      code: code.toUpperCase(),
      discount: discountAmount,
      discountPercentage: coupon.discount,
      description: coupon.description,
    }, 'Coupon applied successfully');
  })
);

/**
 * GET /api/v1/coupons/available
 * Return all active coupons.
 */
router.get(
  '/available',
  asyncHandler(async (_req, res) => {
    sendSuccess(res, listCoupons(), 'Available coupons retrieved');
  })
);

export default router;
