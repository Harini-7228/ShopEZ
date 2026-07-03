const express = require('express');
const { body } = require('express-validator');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');

const router = express.Router();

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('parentCategory').optional().isMongoId().withMessage('Parent Category must be a valid ID'),
  validate,
];

// Public
router.get('/', getCategories);

// Protected (Admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', categoryValidation, createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
