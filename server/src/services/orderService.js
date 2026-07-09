import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import ReorderReminder from '../models/ReorderReminder.js';

/**
 * Batch-fetch products and schedule reorder reminders in bulk.
 */
const calculateAndScheduleReorderReminders = async (order) => {
  if (!order.items || order.items.length === 0) return;

  const productIds = order.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .populate('category', 'name')
    .lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const CATEGORY_INTERVALS = [
    { keywords: ['grocer', 'food', 'pantry'],                    days: 20 },
    { keywords: ['health', 'medicine', 'personal care'],          days: 30 },
    { keywords: ['supplies', 'office'],                           days: 45 },
  ];

  const upsertOps = [];

  for (const item of order.items) {
    const product = productMap.get(item.productId.toString());
    if (!product?.category?.name) continue;

    const categoryName = product.category.name.toLowerCase();
    let suggestedIntervalDays = 0;

    for (const rule of CATEGORY_INTERVALS) {
      if (rule.keywords.some((kw) => categoryName.includes(kw))) {
        suggestedIntervalDays = rule.days;
        break;
      }
    }

    if (suggestedIntervalDays === 0) continue;

    const nextReminderDate = new Date();
    nextReminderDate.setDate(nextReminderDate.getDate() + suggestedIntervalDays);

    upsertOps.push(
      ReorderReminder.findOneAndUpdate(
        { userId: order.userId, productId: item.productId },
        { lastOrderedAt: new Date(), suggestedIntervalDays, nextReminderDate, dismissed: false },
        { upsert: true, new: true }
      )
    );
  }

  if (upsertOps.length > 0) await Promise.all(upsertOps);
};

// Valid forward-only transitions per status.
const STATUS_TRANSITIONS = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['shipped',   'cancelled'],
  shipped:          ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
};

/**
 * Business logic to update order status.
 */
const performOrderStatusUpdate = async ({ orderId, status, note, user }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  // 1. Check permissions based on user role
  if (user.role === 'seller') {
    const ownsItems = order.items.some((item) => item.sellerId.toString() === user._id.toString());
    if (!ownsItems) {
      const err = new Error('Forbidden: You do not sell products contained in this order');
      err.statusCode = 403;
      throw err;
    }
    const allowedSellerStatuses = ['confirmed', 'shipped'];
    if (!allowedSellerStatuses.includes(status)) {
      const err = new Error('Forbidden: Sellers can only update status to: confirmed | shipped');
      err.statusCode = 403;
      throw err;
    }
  } else if (user.role === 'delivery') {
    const allowedDeliveryStatuses = ['out_for_delivery', 'delivered'];
    if (!allowedDeliveryStatuses.includes(status)) {
      const err = new Error('Forbidden: Delivery managers can only update status to: out_for_delivery | delivered');
      err.statusCode = 403;
      throw err;
    }
    order.deliveryManagerId = user._id;
  }

  // 2. Enforce state machine
  if (user.role !== 'admin') {
    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      const err = new Error(
        `Invalid transition: '${order.status}' → '${status}'. ` +
        `Allowed next states: [${allowed.join(', ') || 'none — terminal status'}]`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // 3. Perform state transition and record history
  order.status = status;
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Status updated by ${user.role}`,
  });

  await order.save();

  // 4. Handle delivery side-effects
  if (status === 'delivered') {
    if (order.paymentId) {
      const paymentObj = await Payment.findById(order.paymentId);
      if (paymentObj && paymentObj.method === 'cod' && paymentObj.status === 'pending') {
        paymentObj.status = 'success';
        await paymentObj.save();
      }
    }
    await calculateAndScheduleReorderReminders(order);
  }

  return order;
};

/**
 * Business logic to cancel an order.
 */
const performOrderCancellation = async ({ orderId, user }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  // Authorization check
  if (user.role !== 'admin' && order.userId.toString() !== user._id.toString()) {
    const err = new Error('You are not authorized to cancel this order');
    err.statusCode = 403;
    throw err;
  }

  // Status check
  const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  if (nonCancellableStatuses.includes(order.status)) {
    const err = new Error(`Order cannot be cancelled because its status is: ${order.status.replace(/_/g, ' ')}`);
    err.statusCode = 400;
    throw err;
  }

  // 1. Restock items atomically
  if (order.items.length > 0) {
    const bulkOps = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: [
          { $set: { stock: { $add: ['$stock', item.quantity] } } },
          {
            $set: {
              status: {
                $cond: {
                  if: { $eq: ['$status', 'inactive'] },
                  then: '$status',
                  else: {
                    $cond: {
                      if: { $gt: ['$stock', 0] },
                      then: 'active',
                      else: 'out_of_stock',
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }));
    await Product.bulkWrite(bulkOps);
  }

  // 2. Refund / fail payment
  if (order.paymentId) {
    const paymentObj = await Payment.findById(order.paymentId);
    if (paymentObj) {
      if (paymentObj.method === 'cod' && paymentObj.status === 'pending') {
        paymentObj.status = 'failed';
      } else {
        paymentObj.status = 'refunded';
      }
      await paymentObj.save();
    }
  }

  // 3. Update order status to cancelled
  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: `Order cancelled by ${user.role === 'admin' ? 'admin' : 'customer'}.`,
  });

  await order.save();

  // Return populated order
  const updatedOrder = await Order.findById(orderId)
    .populate('items.productId', 'name images price')
    .populate('userId', 'name email')
    .populate('paymentId')
    .populate('deliveryManagerId', 'name email');

  return updatedOrder;
};

export { calculateAndScheduleReorderReminders, performOrderStatusUpdate, performOrderCancellation, };
