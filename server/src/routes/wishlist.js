import express from 'express';
import { body } from 'express-validator';
import { getWishlist, addRemoveItem, moveToCart, } from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('customer'));

const toggleValidation = [
  body('productId').isMongoId().withMessage('Product ID is required'),
  validate,
];

router.get('/', getWishlist);
router.post('/toggle', toggleValidation, addRemoveItem);
router.post('/move-to-cart', toggleValidation, moveToCart);

export default router;
