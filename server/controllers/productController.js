const Product = require('../models/Product');
const Category = require('../models/Category');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc Get all products (with optional filtering)
 * @route GET /api/v1/products
 * @access Public
 */
const getProducts = asyncHandler(async (req, res, next) => {
  const { category, minPrice, maxPrice, search, inStock, localOnly, hasDiscount, sortBy, page = 1, limit = 10 } = req.query;

  // Build filter query object
  const filter = {};

  // Status is active by default
  filter.status = 'active';

  // Category filter (handles subcategories check if child categories are passed)
  if (category) {
    // Find all categories matching or having this as parentCategory
    const subCategories = await Category.find({
      $or: [{ _id: category }, { parentCategory: category }],
    }).select('_id');
    const categoryIds = subCategories.map((c) => c._id);
    filter.category = { $in: categoryIds };
  }

  // Price range filters
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // Search keyword (RegEx search in name or description)
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // In stock check
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  // Local/Premium/Featured listings check
  if (localOnly === 'true' || req.query.premiumOnly === 'true' || req.query.featuredOnly === 'true') {
    filter.isLocalListing = true;
  }

  // Discount filter: only show products that have a discountPrice set
  if (hasDiscount === 'true') {
    filter.discountPrice = { $exists: true, $gt: 0 };
  }

  // Dynamic specifications filter (e.g. ?specs[Color]=Red&specs[Size]=M)
  if (req.query.specs && typeof req.query.specs === 'object') {
    for (const [key, value] of Object.entries(req.query.specs)) {
      if (value) {
        if (Array.isArray(value)) {
          filter[`specifications.${key}`] = { $in: value };
        } else if (typeof value === 'string' && value.includes(',')) {
          filter[`specifications.${key}`] = { $in: value.split(',') };
        } else {
          filter[`specifications.${key}`] = value;
        }
      }
    }
  }

  // Sort logic
  let sortObj = { createdAt: -1 }; // default: newest first
  if (sortBy === 'price_asc')  sortObj = { price: 1 };
  if (sortBy === 'price_desc') sortObj = { price: -1 };
  if (sortBy === 'discount')   sortObj = { discountPrice: 1 };
  if (sortBy === 'name_asc')   sortObj = { name: 1 };

  // Pagination calculation
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .populate('sellerId', 'name email isLocalSeller sellerImpactScore')
    .skip(skip)
    .limit(parseInt(limit, 10))
    .sort(sortObj);

  const total = await Product.countDocuments(filter);

  sendSuccess(
    res,
    {
      products,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    },
    'Products retrieved successfully'
  );
});

/**
 * @desc Get single product details
 * @route GET /api/v1/products/:id
 * @access Public
 */
const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('sellerId', 'name email isLocalSeller sellerImpactScore');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  sendSuccess(res, product, 'Product details retrieved successfully');
});

/**
 * @desc Create new product
 * @route POST /api/v1/products
 * @access Private (Seller/Admin only)
 */
const createProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, discountPrice, category, images, stock, sku, isLocalListing, specifications } = req.body;

  // Verify category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return res.status(400).json({
      success: false,
      message: 'Specified category does not exist',
      data: null,
    });
  }

  // Double check SKU uniqueness
  const skuExists = await Product.findOne({ sku });
  if (skuExists) {
    return res.status(400).json({
      success: false,
      message: 'Product SKU must be unique',
      data: null,
    });
  }

  const product = await Product.create({
    name,
    description,
    price,
    discountPrice,
    category,
    sellerId: req.user._id, // Set current seller
    images: images || [],
    stock: stock || 0,
    sku,
    isLocalListing: !!isLocalListing,
    specifications: specifications || {},
  });

  sendSuccess(res, product, 'Product created successfully', 201);
});

/**
 * @desc Update product
 * @route PUT /api/v1/products/:id
 * @access Private (Seller/Admin only)
 */
const updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  // Ensure seller owns the product, or user is an admin
  if (product.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this product listing',
      data: null,
    });
  }

  // If category is being updated, verify it exists
  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Specified category does not exist',
        data: null,
      });
    }
  }

  // If SKU is being updated, check uniqueness
  if (req.body.sku && req.body.sku !== product.sku) {
    const skuExists = await Product.findOne({ sku: req.body.sku });
    if (skuExists) {
      return res.status(400).json({
        success: false,
        message: 'Product SKU already exists',
        data: null,
      });
    }
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, product, 'Product updated successfully');
});

/**
 * @desc Delete product
 * @route DELETE /api/v1/products/:id
 * @access Private (Seller/Admin only)
 */
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  // Check ownership
  if (product.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this product listing',
      data: null,
    });
  }

  await Product.findByIdAndDelete(req.params.id);

  sendSuccess(res, null, 'Product deleted successfully');
});

/**
 * @desc Update product stock levels
 * @route PATCH /api/v1/products/:id/stock
 * @access Private (Seller/Admin only)
 */
const updateStock = asyncHandler(async (req, res, next) => {
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid stock quantity (0 or greater)',
      data: null,
    });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  // Check ownership
  if (product.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to modify this stock',
      data: null,
    });
  }

  product.stock = stock;
  await product.save();

  sendSuccess(res, product, 'Product stock level updated successfully');
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
};
