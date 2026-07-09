import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { processCheckout, buildProductMap, buildOrderItems } from '../services/checkoutService.js';
import { applyCoupon } from '../utils/couponUtils.js';
import paymentGateway from '../services/paymentService.js';
import { calculateAndScheduleReorderReminders, performOrderStatusUpdate, performOrderCancellation, } from '../services/orderService.js';

/**
 * =========================================================================
 * CHECKOUT & ORDER CREATION (mock / COD flow)
 * Delegates cart validation, stock deduction, and record creation to
 * checkoutService so this controller stays thin.
 * =========================================================================
 */
const checkoutAndCreateOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress, paymentMethod = 'card', couponCode } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Please provide shipping address details',
      data: null,
    });
  }

  // Determine payment status and gateway ref for mock/COD flows.
  let paymentStatus = 'success';
  let gatewayRef = '';

  if (paymentMethod === 'cod') {
    paymentStatus = 'pending';
    gatewayRef = `cod_${Math.random().toString(36).substring(2, 11)}`;
  } else {
    // Mock card flow: validate payment gateway BEFORE handing off to
    // processCheckout so we don't deduct stock then fail on payment.
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Cannot checkout.',
        data: null,
      });
    }
    const productMap = await buildProductMap(cart.items);
    const { subtotal } = buildOrderItems(cart.items, productMap);
    const { discountAmount } = applyCoupon(couponCode, subtotal);
    const finalTotal = subtotal - discountAmount;
    const paymentIntent = await paymentGateway.createPaymentIntent(finalTotal * 100);
    const verification = await paymentGateway.verifyPayment(paymentIntent.id);
    if (verification.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Order cannot be placed.',
        data: null,
      });
    }
    gatewayRef = paymentIntent.id;
  }

  try {
    const { order, payment } = await processCheckout({
      userId: req.user._id,
      shippingAddress,
      paymentMethod,
      couponCode,
      gatewayRef,
      paymentStatus,
    });

    sendSuccess(res, { order, payment }, 'Order checkout successfully completed and payment processed');
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      data: null,
    });
  }
});

/**
 * @desc Get currently logged-in user's orders
 * @route GET /api/v1/orders
 * @access Private
 */
const getUserOrders = asyncHandler(async (req, res, next) => {
  let query = { userId: req.user._id };

  if (req.user.role === 'delivery') {
    query = {
      $or: [
        { status: 'shipped', deliveryManagerId: null },
        { deliveryManagerId: req.user._id },
      ],
    };
  }

  const orders = await Order.find(query)
    .populate('items.productId', 'name images price')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  sendSuccess(res, orders, 'Orders retrieved successfully');
});

/**
 * @desc Get order details by ID
 * @route GET /api/v1/orders/:id
 * @access Private
 */
const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('items.productId', 'name images price')
    .populate('userId', 'name email')
    .populate('paymentId')
    .populate('deliveryManagerId', 'name email');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
      data: null,
    });
  }

  // Authorization check (Admins and Delivery managers can view any order)
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'delivery' &&
    order.userId._id.toString() !== req.user._id.toString()
  ) {
    // Sellers can view if one of their products is in the order
    const isSellerOfItem = order.items.some((item) => item.sellerId.toString() === req.user._id.toString());
    if (!isSellerOfItem) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order details',
        data: null,
      });
    }
  }

  sendSuccess(res, order, 'Order details retrieved successfully');
});

/**
 * @desc Update status of an order
 * @route PATCH /api/v1/orders/:id/status
 * @access Private (Seller, Admin, and Delivery Manager roles)
 */
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  const orderId = req.params.id;

  try {
    const order = await performOrderStatusUpdate({
      orderId,
      status,
      note,
      user: req.user,
    });

    sendSuccess(res, order, `Order status updated to '${status}' successfully`);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      data: null,
    });
  }
});

/**
 * @desc Get all platform orders (Admin only)
 * @route GET /api/v1/orders/admin/all
 * @access Private (Admin only)
 */
const adminGetAllOrders = asyncHandler(async (req, res, next) => {
  const { status, userId, sellerId } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (userId) filter.userId = userId;
  if (sellerId) filter.items = { $elemMatch: { sellerId } };

  const orders = await Order.find(filter)
    .populate('userId', 'name email')
    .populate('items.productId', 'name price')
    .sort({ createdAt: -1 });

  sendSuccess(res, orders, 'All platform orders retrieved successfully');
});

/**
 * @desc Cancel an order (Customer or Admin)
 * @route PATCH /api/v1/orders/:id/cancel
 * @access Private (Customer, Admin)
 */
const cancelOrder = asyncHandler(async (req, res, next) => {
  const orderId = req.params.id;

  try {
    const updatedOrder = await performOrderCancellation({
      orderId,
      user: req.user,
    });

    sendSuccess(res, updatedOrder, 'Order cancelled successfully and payment refunded');
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      data: null,
    });
  }
});

export { checkoutAndCreateOrder, getUserOrders, getOrderById, updateOrderStatus, adminGetAllOrders, cancelOrder, calculateAndScheduleReorderReminders };
