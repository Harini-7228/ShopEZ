const express = require('express');
const { body } = require('express-validator');
const {
  getWishlist,
  addRemoveItem,
  moveToCart,
} = require('../controllers/wishlistController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

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

module.exports = router;
