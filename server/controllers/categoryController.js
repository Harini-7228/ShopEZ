const Category = require('../models/Category');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc Get all categories
 * @route GET /api/v1/categories
 * @access Public
 */
const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find().populate('parentCategory', 'name slug');
  sendSuccess(res, categories, 'Categories retrieved successfully');
});

/**
 * @desc Create a new category
 * @route POST /api/v1/categories
 * @access Private (Admin only)
 */
const createCategory = asyncHandler(async (req, res, next) => {
  const { name, parentCategory } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: 'Category already exists',
      data: null,
    });
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

  sendSuccess(res, category, 'Category created successfully', 211);
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

  // Check if new name already exists elsewhere
  if (name && name !== category.name) {
    const nameExists = await Category.findOne({ name });
    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists',
        data: null,
      });
    }
    category.name = name;
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

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
