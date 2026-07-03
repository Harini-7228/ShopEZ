const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const ReorderReminder = require('../models/ReorderReminder');
const Category = require('../models/Category');
const paymentGateway = require('../config/payment');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * =========================================================================
 * ISOLATED FUNCTION: CHECKOUT & ORDER CREATION DRAFT
 * =========================================================================
 * Processes payment intent, validates stock levels, deducts stock,
 * creates the payment log, generates the order, and clears the cart.
 */
const checkoutAndCreateOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress, paymentMethod = 'card' } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Please provide shipping address details',
      data: null,
    });
  }

  // 1. Get user cart
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Your cart is empty. Cannot checkout.',
      data: null,
    });
  }

  // 2. Batch-fetch all products in a single query (eliminates N+1 DB hits — Fix #6)
  const productIds = cart.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  // Pre-validate all products before touching stock
  for (const item of cart.items) {
    const product = productMap.get(item.productId.toString());
    if (!product || product.status === 'inactive') {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${item.productId} no longer exists or is inactive`,
        data: null,
      });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        data: null,
      });
    }
  }

  // 3. Atomically deduct stock per item — prevents race conditions (Fix #1)
  // Uses findOneAndUpdate with stock guard so two concurrent checkouts cannot both succeed.
  const deductedItems = [];
  for (const item of cart.items) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        stock: { $gte: item.quantity }, // atomic guard: only deduct if stock is still sufficient
        status: { $ne: 'inactive' },
      },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    if (!updated) {
      // Rollback all already-deducted items before returning error
      for (const deducted of deductedItems) {
        await Product.findByIdAndUpdate(deducted.productId, {
          $inc: { stock: deducted.quantity },
        });
      }
      const failedProduct = productMap.get(item.productId.toString());
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${failedProduct ? failedProduct.name : item.productId}". It may have been purchased by another customer.`,
        data: null,
      });
    }

    // Auto-fix product status if stock is now depleted (also fixes status after checkout)
    if (updated.stock === 0) {
      updated.status = 'out_of_stock';
      await updated.save();
    }

    deductedItems.push({ productId: item.productId, quantity: item.quantity });
  }

  // 4. Compute totals using safe discountPrice check (Fix #12: discountPrice=0 must not fall back to full price)
  let totalAmount = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = productMap.get(item.productId.toString());
    const price = (product.discountPrice != null && product.discountPrice > 0)
      ? product.discountPrice
      : product.price;
    totalAmount += price * item.quantity;
    orderItems.push({
      productId: product._id,
      sellerId: product.sellerId,
      quantity: item.quantity,
      price,
    });
  }

  // 5. Request Mock Payment Intent
  const paymentIntent = await paymentGateway.createPaymentIntent(totalAmount * 100); // in cents

  // 6. Confirm Payment (Simulated)
  const verification = await paymentGateway.verifyPayment(paymentIntent.id);
  const paymentStatus = verification.status === 'success' ? 'success' : 'failed';

  if (paymentStatus === 'failed') {
    // Rollback all stock deductions on payment failure
    for (const deducted of deductedItems) {
      await Product.findByIdAndUpdate(deducted.productId, {
        $inc: { stock: deducted.quantity },
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed. Order cannot be placed.',
      data: null,
    });
  }

  // 7. Create Order record
  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    shippingAddress,
    totalAmount,
    status: 'confirmed', // Confirmed due to successful mock payment
    estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  // 8. Create Payment record
  const payment = await Payment.create({
    orderId: order._id,
    userId: req.user._id,
    amount: totalAmount,
    method: paymentMethod,
    gatewayRef: paymentIntent.id,
    status: 'success',
  });

  // Link payment to order
  order.paymentId = payment._id;
  await order.save();

  // 9. Clear the shopping cart
  cart.items = [];
  await cart.save();

  sendSuccess(res, { order, payment }, 'Order checkout successfully completed and payment processed');
});


/**
 * =========================================================================
 * ISOLATED FUNCTION: SMART REORDER REMINDERS SCHEDULER
 * =========================================================================
 * Triggered when an order status transitions to 'delivered'.
 * Scans purchased items and schedules next reminder based on category rules.
 */
const calculateAndScheduleReorderReminders = async (order) => {
  try {
    for (const item of order.items) {
      const product = await Product.findById(item.productId).populate('category');
      if (!product || !product.category) continue;

      const categoryName = product.category.name.toLowerCase();
      let suggestedIntervalDays = 0;

      // Rule mappings based on category defaults
      if (categoryName.includes('grocer') || categoryName.includes('food') || categoryName.includes('pantry')) {
        suggestedIntervalDays = 20; // 20 days standard interval
      } else if (categoryName.includes('health') || categoryName.includes('medicine') || categoryName.includes('personal care')) {
        suggestedIntervalDays = 30; // 30 days standard interval
      } else if (categoryName.includes('supplies') || categoryName.includes('office')) {
        suggestedIntervalDays = 45; // 45 days standard interval
      }

      if (suggestedIntervalDays > 0) {
        const nextReminderDate = new Date();
        nextReminderDate.setDate(nextReminderDate.getDate() + suggestedIntervalDays);

        // Update or insert reorder reminder
        await ReorderReminder.findOneAndUpdate(
          { userId: order.userId, productId: item.productId },
          {
            lastOrderedAt: new Date(),
            suggestedIntervalDays,
            nextReminderDate,
            dismissed: false,
          },
          { upsert: true, new: true }
        );
      }
    }
  } catch (error) {
    console.error('Error scheduling reorder reminders:', error.message);
  }
};


/**
 * @desc Get currently logged-in user's orders
 * @route GET /api/v1/orders
 * @access Private
 */
const getUserOrders = asyncHandler(async (req, res, next) => {
  let query = { userId: req.user._id };

  // If user is delivery staff, show shipped or assigned orders
  if (req.user.role === 'delivery') {
    query = {
      $or: [
        { deliveryManagerId: req.user._id },
        { status: 'shipped' },
        { status: 'out_for_delivery', deliveryManagerId: req.user._id },
        { status: 'delivered', deliveryManagerId: req.user._id },
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

  // Authorization check (Admins and Delivery managers can view any order; customers/sellers restricted)
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

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
      data: null,
    });
  }

  // 1. Check permissions based on user role
  if (req.user.role === 'seller') {
    // Check if seller owns any products in this order
    const ownsItems = order.items.some((item) => item.sellerId.toString() === req.user._id.toString());
    if (!ownsItems) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not sell products contained in this order',
        data: null,
      });
    }

    // Sellers can update order status up to 'shipped' only
    const allowedSellerStatuses = ['confirmed', 'shipped'];
    if (!allowedSellerStatuses.includes(status)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Sellers can only update status up to: confirmed | shipped',
        data: null,
      });
    }
  } else if (req.user.role === 'delivery') {
    // Delivery managers can only update status from 'shipped' to 'out_for_delivery' or 'delivered'
    const allowedDeliveryStatuses = ['out_for_delivery', 'delivered'];
    if (!allowedDeliveryStatuses.includes(status)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Delivery managers can only update status to: out_for_delivery | delivered',
        data: null,
      });
    }
    // Automatically assign delivery manager id
    order.deliveryManagerId = req.user._id;
  }

  // 2. Perform state transition and record history
  order.status = status;
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Status updated by ${req.user.role}`,
  });

  await order.save();

  // 3. If delivered, schedule reorder reminders
  if (status === 'delivered') {
    await calculateAndScheduleReorderReminders(order);
  }

  sendSuccess(res, order, `Order status updated to '${status}' successfully`);
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
  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
      data: null,
    });
  }

  // Authorization check (Only the order placing customer or an admin can cancel)
  if (
    req.user.role !== 'admin' &&
    order.userId.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to cancel this order',
      data: null,
    });
  }

  // Status check (Can only cancel if pending or confirmed)
  const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  if (nonCancellableStatuses.includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: `Order cannot be cancelled because its status is: ${order.status.replace(/_/g, ' ')}`,
      data: null,
    });
  }

  // 1. Restock items using .save() so the pre('save') hook fires and
  //    auto-restores product status from 'out_of_stock' → 'active' (Fix #5)
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  // 2. Mark the payment as refunded if it exists
  if (order.paymentId) {
    await Payment.findByIdAndUpdate(order.paymentId, { status: 'refunded' });
  }

  // 3. Update order status to cancelled
  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: `Order cancelled by ${req.user.role === 'admin' ? 'admin' : 'customer'}.`,
  });

  await order.save();

  // Populate references for client detail view reload
  const updatedOrder = await Order.findById(orderId)
    .populate('items.productId', 'name images price')
    .populate('userId', 'name email')
    .populate('paymentId')
    .populate('deliveryManagerId', 'name email');

  sendSuccess(res, updatedOrder, 'Order cancelled successfully and payment refunded');
});

module.exports = {
  checkoutAndCreateOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  adminGetAllOrders,
  cancelOrder,
  calculateAndScheduleReorderReminders,
};
