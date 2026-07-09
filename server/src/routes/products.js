import express from 'express';
import { body } from 'express-validator';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, updateStock, } from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';

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

export default router;
