const express = require('express');
const { body } = require('express-validator');
const {
  checkoutAndCreateOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  adminGetAllOrders,
} = require('../controllers/orderController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

const checkoutValidation = [
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zip').notEmpty().withMessage('Zip/Postal code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('paymentMethod').optional().isString(),
  validate,
];

// Customer/Delivery get history routes
router.post('/checkout', restrictTo('customer'), checkoutValidation, checkoutAndCreateOrder);
router.get('/', restrictTo('customer', 'delivery'), getUserOrders);

// Admin all-orders route — MUST be before /:id to prevent 'admin' being parsed as an order ID
router.get('/admin/all', restrictTo('admin'), adminGetAllOrders);

// Shared route for order details (internally checks role-specific content)
router.get('/:id', getOrderById);

// Order cancellation by customer/admin
router.patch('/:id/cancel', restrictTo('customer', 'admin'), cancelOrder);

// Role-restricted order status updates
router.patch(
  '/:id/status',
  restrictTo('seller', 'delivery', 'admin'),
  [
    body('status').isIn(['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']).withMessage('Invalid order status'),
    body('note').optional().isString(),
    validate,
  ],
  updateOrderStatus
);

module.exports = router;
