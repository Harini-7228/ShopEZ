const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

// Import controllers
const {
  getSalesSummary,
  getTopSellers,
  getLowStockReport,
  getUsers,
  updateUserRole,
  deleteUser,
} = require('../controllers/adminController');

const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');

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

module.exports = router;
