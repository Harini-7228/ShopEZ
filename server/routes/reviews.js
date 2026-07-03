const express = require('express');
const { body } = require('express-validator');
const {
  createReview,
  getProductReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

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

router.delete('/:id', deleteReview);

module.exports = router;
