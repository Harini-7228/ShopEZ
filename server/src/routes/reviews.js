import express from 'express';
import { body } from 'express-validator';
import { createReview, getProductReviews, deleteReview, } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Public route to view product reviews
router.get('/product/:productId', getProductReviews);

// Protected routes (Customer or Admin delete)
router.use(protect);

router.post(
  '/',
  restrictTo('customer'),
  [
    body('productId').isMongoId().withMessage('Product ID must be a valid Mongo ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comment').trim().notEmpty().withMessage('Comment is required'),
    validate,
  ],
  createReview
);

router.delete('/:id', restrictTo('customer', 'admin'), deleteReview);

export default router;
