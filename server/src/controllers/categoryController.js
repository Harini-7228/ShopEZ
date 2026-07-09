import Category from '../models/Category.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Utility to escape regex metacharacters to prevent ReDoS attacks.
const escapeRegex = (str) => str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @desc Get all categories
 * @route GET /api/v1/categories
 * @access Public
 */
const getCategories = asyncHandler(async (req, res, next) => {
  // lean() — client only needs plain objects for dropdown rendering
  const categories = await Category.find()
    .populate('parentCategory', 'name slug')
    .lean();
  sendSuccess(res, categories, 'Categories retrieved successfully');
});

/**
 * @desc Create a new category
 * @route POST /api/v1/categories
 * @access Private (Admin only)
 */
const createCategory = asyncHandler(async (req, res, next) => {
  const { name, parentCategory } = req.body;

  // Case-insensitive duplicate check using escaped regex.
  const existingCategory = await Category.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
  });
  if (existingCategory) {
    return res.status(400).json({ success: false, message: 'Category already exists', data: null });
  }

  // Verify parentCategory if provided
  if (parentCategory) {
    const parentExists = await Category.findById(parentCategory);
    if (!parentExists) {
      return res.status(400).json({
        success: false,
        message: 'Parent category does not exist',
        data: null,
      });
    }
  }

  const category = await Category.create({
    name,
    parentCategory: parentCategory || null,
  });

  sendSuccess(res, category, 'Category created successfully', 201);
});

/**
 * @desc Update a category
 * @route PUT /api/v1/categories/:id
 * @access Private (Admin only)
 */
const updateCategory = asyncHandler(async (req, res, next) => {
  const { name, parentCategory } = req.body;
  const categoryId = req.params.id;

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found',
      data: null,
    });
  }

  // Prevent setting self as parent
  if (parentCategory && parentCategory.toString() === categoryId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'A category cannot be its own parent category',
      data: null,
    });
  }

  // Bugs C + G fix:
  //   C — updateCategory previously used plain findOne({ name }) which is case-sensitive,
  //       allowing "groceries" to coexist with "Groceries" created via createCategory.
  //   G — Missing { _id: { $ne: categoryId } } caused the category to flag its OWN
  //       current name as "already taken" when saving with no name change.
  if (name) {
    const trimmedName = name.trim();
    if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
      const nameExists = await Category.findOne({
        name: { $regex: `^${escapeRegex(trimmedName)}$`, $options: 'i' },
        _id: { $ne: categoryId }, // exclude self so own name never triggers duplicate
      });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'A category with this name already exists',
          data: null,
        });
      }
      category.name = trimmedName;
    }
  }

  if (parentCategory !== undefined) {
    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: 'Specified parent category does not exist',
          data: null,
        });
      }
      category.parentCategory = parentCategory;
    } else {
      category.parentCategory = null;
    }
  }

  await category.save();

  sendSuccess(res, category, 'Category updated successfully');
});

/**
 * @desc Delete a category
 * @route DELETE /api/v1/categories/:id
 * @access Private (Admin only)
 */
const deleteCategory = asyncHandler(async (req, res, next) => {
  const categoryId = req.params.id;

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found',
      data: null,
    });
  }

  // Check if any subcategories depend on this one, update them to have null parent
  await Category.updateMany({ parentCategory: categoryId }, { parentCategory: null });

  await Category.findByIdAndDelete(categoryId);

  sendSuccess(res, null, 'Category deleted successfully');
});

export { getCategories, createCategory, updateCategory, deleteCategory, };
