import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import PriceAlert from '../models/PriceAlert.js';
import ReorderReminder from '../models/ReorderReminder.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// ── In-process category ID cache ─────────────────────────────────────────────
// Category data changes rarely. Cache the parent→children mapping for 5 minutes
// to avoid an extra DB round-trip on every product list request.
const categoryCache = new Map(); // key: parentId string → { ids: ObjectId[], expiresAt: number }
const CATEGORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCategoryIds = async (categoryId) => {
  const key = String(categoryId);
  const cached = categoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.ids;

  const subCategories = await Category.find({
    $or: [{ _id: categoryId }, { parentCategory: categoryId }],
  }).select('_id').lean();

  const ids = subCategories.map((c) => c._id);
  categoryCache.set(key, { ids, expiresAt: Date.now() + CATEGORY_CACHE_TTL });
  return ids;
};

/**
 * @desc Get all products (with optional filtering)
 * @route GET /api/v1/products
 * @access Public
 */
const getProducts = asyncHandler(async (req, res, next) => {
  const { category, minPrice, maxPrice, search, inStock, localOnly, hasDiscount, sortBy, page = 1, limit = 10, exclude } = req.query;

  // Build match query object for basic fields
  const filter = {};
  filter.status = 'active';

  // Exclude product IDs
  if (exclude) {
    const excludeIds = (typeof exclude === 'string' ? exclude.split(',') : Array.isArray(exclude) ? exclude : [exclude])
      .map(id => id.trim())
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    if (excludeIds.length > 0) {
      filter._id = { $nin: excludeIds };
    }
  }

  // Category filter — uses in-process cache to avoid DB round-trip
  if (category) {
    const categoryIds = await getCategoryIds(category);
    filter.category = { $in: categoryIds };
  }

  // Search keyword — escape all regex metacharacters before building the
  // pattern to prevent ReDoS (Regular Expression Denial of Service).
  // An unescaped user string like "(a+)+" causes catastrophic backtracking
  // in the DB regex engine, blocking the thread at 100% CPU.
  if (search) {
    const MAX_SEARCH_LENGTH = 100;
    const safeSearch = search
      .slice(0, MAX_SEARCH_LENGTH)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape all regex metacharacters

    filter.$or = [
      { name:        { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
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

  // Discount filter
  if (hasDiscount === 'true') {
    filter.discountPrice = { $exists: true, $gt: 0 };
  }

  // Dynamic specifications filter
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

  // Build the aggregation pipeline
  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        effectivePrice: {
          $cond: {
            if: { $and: [{ $gt: ['$discountPrice', 0] }, { $ne: ['$discountPrice', null] }] },
            then: '$discountPrice',
            else: '$price',
          },
        },
      },
    },
  ];

  // Price range filters on effectivePrice
  if (minPrice || maxPrice) {
    const priceMatch = {};
    if (minPrice) priceMatch.$gte = parseFloat(minPrice);
    if (maxPrice) priceMatch.$lte = parseFloat(maxPrice);
    pipeline.push({ $match: { effectivePrice: priceMatch } });
  }

  // ── Single round-trip: count + paginated data via $facet ────────────────
  const pageNum  = Math.max(parseInt(page,  10) || 1, 1);
  // Cap limit at 100 — without this a caller can send limit=999999 and
  // pull the entire product collection in one request, hammering the DB.
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip     = (pageNum - 1) * limitNum;

  let sortObj = { createdAt: -1, _id: 1 };
  if (sortBy === 'price_asc')  sortObj = { effectivePrice: 1,  _id: 1 };
  if (sortBy === 'price_desc') sortObj = { effectivePrice: -1, _id: 1 };
  if (sortBy === 'discount')   sortObj = { discountPrice:  -1, _id: 1 };
  if (sortBy === 'name_asc')   sortObj = { name:            1, _id: 1 };
  if (sortBy === 'popular')    sortObj = { views: -1, createdAt: -1, _id: 1 };

  pipeline.push({
    $facet: {
      data: [
        { $sort:  sortObj   },
        { $skip:  skip      },
        { $limit: limitNum  },
      ],
      meta: [{ $count: 'total' }],
    },
  });

  const [facetResult] = await Product.aggregate(pipeline);
  const rawProducts = facetResult?.data  || [];
  const total       = facetResult?.meta?.[0]?.total ?? 0;

  // Populate references (only the fields each consumer actually uses)
  const products = await Product.populate(rawProducts, [
    { path: 'category',  select: 'name slug parentCategory' },
    { path: 'sellerId',  select: 'name isLocalSeller sellerImpactScore' },
  ]);

  sendSuccess(
    res,
    {
      products,
      pagination: {
        total,
        page:  pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
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
    .populate('category', 'name slug parentCategory')
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

  // ── Whitelist allowed update fields ──────────────────────────────────────
  // Never pass req.body directly to findByIdAndUpdate — doing so allows
  // an attacker to overwrite protected fields like sellerId, status,
  // ratingsAvg, ratingsCount, or sku (to steal another product's identity).
  const ALLOWED_FIELDS = [
    'name', 'description', 'price', 'discountPrice',
    'category', 'images', 'stock', 'sku',
    'isLocalListing', 'specifications',
  ];

  const safeUpdates = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      safeUpdates[field] = req.body[field];
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields provided for update',
      data: null,
    });
  }

  // Automatically adjust status if stock is being modified
  if (safeUpdates.stock !== undefined) {
    if (safeUpdates.stock === 0) {
      safeUpdates.status = 'out_of_stock';
    } else if (safeUpdates.stock > 0 && product.status === 'out_of_stock') {
      safeUpdates.status = 'active';
    }
  }

  // Validate discountPrice against price in the update payload or existing document
  const finalPrice = safeUpdates.price !== undefined ? safeUpdates.price : product.price;
  const finalDiscountPrice = safeUpdates.discountPrice !== undefined ? safeUpdates.discountPrice : product.discountPrice;
  if (finalDiscountPrice !== undefined && finalDiscountPrice !== null && finalDiscountPrice > finalPrice) {
    return res.status(400).json({
      success: false,
      message: 'Discount price must be less than or equal to original price',
      data: null,
    });
  }

  product = await Product.findByIdAndUpdate(req.params.id, safeUpdates, {
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

  const productId = req.params.id;

  // Cascade-delete all dangling references in parallel to prevent database corruption.
  await Promise.all([
    Product.findByIdAndDelete(productId),
    Cart.updateMany(
      { 'items.productId': productId },
      { $pull: { items: { productId } } }
    ),
    Wishlist.updateMany(
      { 'items.productId': productId },
      { $pull: { items: { productId } } }
    ),
    PriceAlert.deleteMany({ productId }),
    ReorderReminder.deleteMany({ productId }),
  ]);

  sendSuccess(res, null, 'Product deleted and associated data cleaned up successfully');
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

export { getProducts, getProductById, createProduct, updateProduct, deleteProduct, updateStock, };
