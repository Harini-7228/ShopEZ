const express = require('express');
const { body } = require('express-validator');
const {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(protect);
router.use(restrictTo('customer')); // Restrict to customer role

const itemValidation = [
  body('productId').isMongoId().withMessage('Product ID is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be an integer of 1 or more'),
  validate,
];

router.get('/', getCart);
router.post('/items', itemValidation, addItem);
router.put('/items/:productId', updateQuantity);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

module.exports = router;
