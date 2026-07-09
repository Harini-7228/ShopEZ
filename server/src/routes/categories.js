import express from 'express';
import { body } from 'express-validator';
import { getCategories, createCategory, updateCategory, deleteCategory, } from '../controllers/categoryController.js';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('parentCategory').optional().isMongoId().withMessage('Parent Category must be a valid ID'),
  validate,
];

const categoryUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
  body('parentCategory').optional({ nullable: true }).isMongoId().withMessage('Parent Category must be a valid ID'),
  validate,
];

// Public
router.get('/', getCategories);

// Protected (Admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', categoryValidation, createCategory);
router.put('/:id', categoryUpdateValidation, updateCategory);
router.delete('/:id', deleteCategory);

export default router;
