const express = require('express');
const { body } = require('express-validator');
const {
  createPaymentIntent,
  verifyPayment,
  webhookHandler,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

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

module.exports = router;
