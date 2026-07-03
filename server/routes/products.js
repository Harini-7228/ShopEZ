const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} = require('../controllers/productController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

const router = express.Router();

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a valid number'),
  body('discountPrice').optional().isNumeric().withMessage('Discount price must be a valid number'),
  body('category').isMongoId().withMessage('Category must be a valid ID'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be an integer 0 or greater'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('isLocalListing').optional().isBoolean(),
  validate,
];

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes (Sellers and Admins only)
router.use(protect);
router.use(restrictTo('seller', 'admin'));

router.post('/', productValidation, createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/stock', updateStock);

module.exports = router;
