import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';

// Import controllers
import { getSalesSummary, getTopSellers, getLowStockReport, getUsers, updateUserRole, deleteUser, } from '../controllers/adminController.js';

import * as productController from '../controllers/productController.js';
import * as categoryController from '../controllers/categoryController.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

// Enforce admin privileges across all routes
router.use(protect);
router.use(restrictTo('admin'));

// Dashboards and stats
router.get('/dashboard/sales-summary', getSalesSummary);
router.get('/dashboard/top-sellers', getTopSellers);
router.get('/dashboard/low-stock', getLowStockReport);

// User Management
router.get('/users', getUsers);
router.put(
  '/users/:id/role',
  [
    body('role').isIn(['customer', 'seller', 'admin', 'delivery']).withMessage('Invalid role'),
    validate,
  ],
  updateUserRole
);
router.delete('/users/:id', deleteUser);

// All Orders view
router.get('/orders', orderController.adminGetAllOrders);

// Category Management CRUD
router.post(
  '/categories',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    validate,
  ],
  categoryController.createCategory
);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Product Management CRUD
router.post(
  '/products',
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isNumeric().withMessage('Price must be a valid number'),
    body('category').isMongoId().withMessage('Category must be a valid Mongo ID'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    validate,
  ],
  productController.createProduct
);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

export default router;
