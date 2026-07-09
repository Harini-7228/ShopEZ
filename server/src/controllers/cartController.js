import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc Get or create user cart
 * @route GET /api/v1/cart
 * @access Private
 */
const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ userId: req.user._id }).populate({
    path: 'items.productId',
    select: 'name price discountPrice images stock status isLocalListing',
  });

  // If no cart, create one
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  sendSuccess(res, cart, 'Cart retrieved successfully');
});

/**
 * @desc Add item to cart
 * @route POST /api/v1/cart/items
 * @access Private
 */
const addItem = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const quantity = parseInt(req.body.quantity, 10);

  // Validate quantity is a positive integer — reject 0, negatives, and non-numbers
  if (isNaN(quantity) || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be a positive integer (minimum 1)',
      data: null,
    });
  }

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  // Check product status and stock
  if (product.status === 'inactive' || product.stock <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Product is currently unavailable or out of stock',
      data: null,
    });
  }

  // Get or create user cart
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  // Check if product is already in the cart
  const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId.toString());

  const currentQuantity = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;
  const newQuantity = currentQuantity + quantity;

  // Validate stock level
  if (newQuantity > product.stock) {
    return res.status(400).json({
      success: false,
      message: `Cannot add requested quantity. Only ${product.stock} units are in stock, and you already have ${currentQuantity} in your cart.`,
      data: null,
    });
  }

  const priceAtAdd = (product.discountPrice != null && product.discountPrice > 0)
    ? product.discountPrice
    : product.price;

  if (itemIndex > -1) {
    // Update quantity
    cart.items[itemIndex].quantity = newQuantity;
    cart.items[itemIndex].priceAtAdd = priceAtAdd; // update to current price
  } else {
    // Add new item
    cart.items.push({
      productId,
      quantity: newQuantity,
      priceAtAdd,
    });
  }

  await cart.save();
  await cart.populate({
    path: 'items.productId',
    select: 'name price discountPrice images stock status',
  });

  sendSuccess(res, cart, 'Product added to cart successfully');
});

/**
 * @desc Update item quantity in cart
 * @route PUT /api/v1/cart/items/:productId
 * @access Private
 */
const updateQuantity = asyncHandler(async (req, res, next) => {
  const quantity = parseInt(req.body.quantity, 10);
  const { productId } = req.params;

  if (isNaN(quantity) || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be a positive integer (minimum 1)',
      data: null,
    });
  }

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found for this user',
      data: null,
    });
  }

  const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId.toString());
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found in cart',
      data: null,
    });
  }

  // Validate stock availability
  const product = await Product.findById(productId);
  if (!product || product.status === 'inactive') {
    return res.status(404).json({
      success: false,
      message: 'Product not found or inactive',
      data: null,
    });
  }

  if (quantity > product.stock) {
    return res.status(400).json({
      success: false,
      message: `Cannot set quantity to ${quantity}. Only ${product.stock} units are in stock.`,
      data: null,
    });
  }

  cart.items[itemIndex].quantity = quantity;
  cart.items[itemIndex].priceAtAdd = (product.discountPrice != null && product.discountPrice > 0)
    ? product.discountPrice
    : product.price;

  await cart.save();
  await cart.populate({
    path: 'items.productId',
    select: 'name price discountPrice images stock status',
  });

  sendSuccess(res, cart, 'Cart item quantity updated successfully');
});

/**
 * @desc Remove item from cart
 * @route DELETE /api/v1/cart/items/:productId
 * @access Private
 */
const removeItem = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found',
      data: null,
    });
  }

  cart.items = cart.items.filter((item) => item.productId.toString() !== productId.toString());

  await cart.save();
  await cart.populate({
    path: 'items.productId',
    select: 'name price discountPrice images stock status',
  });

  sendSuccess(res, cart, 'Item removed from cart successfully');
});

/**
 * @desc Clear cart
 * @route DELETE /api/v1/cart
 * @access Private
 */
const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  sendSuccess(res, cart, 'Cart cleared successfully');
});

export { getCart, addItem, updateQuantity, removeItem, clearCart, };
