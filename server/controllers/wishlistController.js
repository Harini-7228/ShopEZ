const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc Get user wishlist
 * @route GET /api/v1/wishlist
 * @access Private
 */
const getWishlist = asyncHandler(async (req, res, next) => {
  let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate({
    path: 'items.productId',
    select: 'name price discountPrice images stock status',
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ userId: req.user._id, items: [] });
  }

  sendSuccess(res, wishlist, 'Wishlist retrieved successfully');
});

/**
 * @desc Toggle wishlist item (Add if not present, Remove if present)
 * @route POST /api/v1/wishlist/toggle
 * @access Private
 */
const addRemoveItem = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  let wishlist = await Wishlist.findOne({ userId: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId: req.user._id, items: [] });
  }

  const itemIndex = wishlist.items.findIndex((item) => item.productId.toString() === productId.toString());

  let message = '';
  if (itemIndex > -1) {
    // Remove item
    wishlist.items.splice(itemIndex, 1);
    message = 'Product removed from wishlist';
  } else {
    // Add item
    wishlist.items.push({ productId });
    message = 'Product added to wishlist';
  }

  await wishlist.save();
  await wishlist.populate({
    path: 'items.productId',
    select: 'name price discountPrice images stock status',
  });

  sendSuccess(res, wishlist, message);
});

/**
 * @desc Move item from wishlist to cart
 * @route POST /api/v1/wishlist/move-to-cart
 * @access Private
 */
const moveToCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  // 1. Verify item exists in wishlist
  const wishlist = await Wishlist.findOne({ userId: req.user._id });
  if (!wishlist) {
    return res.status(404).json({
      success: false,
      message: 'Wishlist not found',
      data: null,
    });
  }

  const itemIndex = wishlist.items.findIndex((item) => item.productId.toString() === productId.toString());
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found in wishlist',
      data: null,
    });
  }

  // 2. Verify product is in stock
  const product = await Product.findById(productId);
  if (!product || product.status === 'inactive' || product.stock <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Product is currently unavailable or out of stock',
      data: null,
    });
  }

  // 3. Add to cart
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  const cartItemIndex = cart.items.findIndex((item) => item.productId.toString() === productId.toString());
  const currentPrice = product.discountPrice || product.price;

  if (cartItemIndex > -1) {
    // Increment quantity if already in cart
    if (cart.items[cartItemIndex].quantity + 1 > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move to cart. Selected quantity exceeds available stock.',
        data: null,
      });
    }
    cart.items[cartItemIndex].quantity += 1;
    cart.items[cartItemIndex].priceAtAdd = currentPrice;
  } else {
    // Add new item to cart
    cart.items.push({
      productId,
      quantity: 1,
      priceAtAdd: currentPrice,
    });
  }

  // 4. Remove from wishlist
  wishlist.items.splice(itemIndex, 1);

  await cart.save();
  await wishlist.save();

  sendSuccess(
    res,
    { cart, wishlist },
    'Product successfully moved from wishlist to cart'
  );
});

module.exports = {
  getWishlist,
  addRemoveItem,
  moveToCart,
};
