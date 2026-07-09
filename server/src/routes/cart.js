import express from 'express';
import { body } from 'express-validator';
import { getCart, addItem, updateQuantity, removeItem, clearCart, } from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';

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
router.put('/items/:productId', [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be an integer of 1 or more'),
  validate,
], updateQuantity);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

export default router;
