import express from 'express';
import { body } from 'express-validator';
import { createPaymentIntent, verifyPayment, webhookHandler, createRazorpayPaymentOrder, verifyRazorpayPayment, } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Webhook is public (needs raw signature header, no session cookies required)
router.post('/webhook', webhookHandler);

// Protected routes (Customer only)
router.use(protect);
router.use(restrictTo('customer'));

router.post(
  '/intent',
  [
    body('amount').isNumeric().withMessage('Amount is required and must be a number'),
    validate,
  ],
  createPaymentIntent
);

router.post(
  '/verify',
  [
    body('gatewayRef').notEmpty().withMessage('gatewayRef is required'),
    body('orderId').isMongoId().withMessage('orderId must be a valid Mongo ID'),
    validate,
  ],
  verifyPayment
);

// Razorpay Routes
router.post(
  '/razorpay/create-order',
  [
    body('amount').isNumeric().withMessage('Amount is required and must be a number'),
    validate,
  ],
  createRazorpayPaymentOrder
);

router.post(
  '/razorpay/verify',
  [
    body('orderId').notEmpty().withMessage('orderId is required'),
    body('paymentId').notEmpty().withMessage('paymentId is required'),
    body('signature').notEmpty().withMessage('signature is required'),
    body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.state').notEmpty().withMessage('State is required'),
    body('shippingAddress.zip').notEmpty().withMessage('Zip/Postal code is required'),
    body('shippingAddress.country').notEmpty().withMessage('Country is required'),
    validate,
  ],
  verifyRazorpayPayment
);

export default router;
