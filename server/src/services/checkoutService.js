/**
 * checkoutService.js
 *
 * Encapsulates the shared cart → stock validation → stock deduction →
 * order-item assembly logic used by controllers.
 */

import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { applyCoupon } from '../utils/couponUtils.js';

/**
 * Fetch the user's cart and validate it is non-empty.
 * Throws a plain Error with a `statusCode` property so callers can
 * translate it directly to an HTTP response.
 *
 * @param {string} userId
 * @returns {Promise<Cart>}
 */
const getValidatedCart = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) {
    const err = new Error('Your cart is empty. Cannot proceed.');
    err.statusCode = 400;
    throw err;
  }
  return cart;
};

/**
 * Batch-fetch all products in the cart and return a Map keyed by string ID.
 * Validates that every product exists and is active.
 *
 * @param {Array<{ productId: string, quantity: number }>} items
 * @returns {Promise<Map<string, Product>>}
 */
const buildProductMap = async (items) => {
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const item of items) {
    const product = productMap.get(item.productId.toString());
    if (!product || product.status === 'inactive') {
      const err = new Error(
        `Product with ID ${item.productId} no longer exists or is inactive`
      );
      err.statusCode = 404;
      throw err;
    }
    if (product.stock < item.quantity) {
      const err = new Error(
        `Insufficient stock for product: ${product.name}. ` +
          `Available: ${product.stock}, Requested: ${item.quantity}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  return productMap;
};

/**
 * Atomically deduct stock for each cart item using a $gte guard.
 * On any failure, rolls back all previously deducted items.
 *
 * @param {Array<{ productId, quantity }>} items
 * @param {Map<string, Product>} productMap - For human-readable error messages
 */
const deductStock = async (items, productMap) => {
  const deducted = [];

  for (const item of items) {
    // Perform atomic stock deduction and status update in a single pipeline.
    // The conditional check updates status to out_of_stock if stock drops to 0.
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        stock: { $gte: item.quantity },
        status: { $ne: 'inactive' },
      },
      [
        { $set: { stock: { $subtract: ['$stock', item.quantity] } } },
        {
          $set: {
            status: {
              $cond: {
                if: { $eq: ['$stock', 0] },
                then: 'out_of_stock',
                else: 'active',
              },
            },
          },
        },
      ],
      { new: true, updatePipeline: true }
    );

    if (!updated) {
      // Use Promise.allSettled to ensure all rollbacks are attempted if deduction fails.
      const rollbackResults = await Promise.allSettled(
        deducted.map((d) =>
          Product.findByIdAndUpdate(
            d.productId,
            [
              { $set: { stock: { $add: ['$stock', d.quantity] } } },
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
            { new: true, updatePipeline: true }
          )
        )
      );

      const failures = rollbackResults.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.error(
          'CRITICAL: Partial rollback failure after stock deduction error. ' +
          'Manual intervention required for products:',
          deducted.map((d) => d.productId),
          failures
        );
      }

      const name = productMap.get(item.productId.toString())?.name || item.productId;
      const err = new Error(
        `Insufficient stock for "${name}". It may have been purchased by another customer.`
      );
      err.statusCode = 409; // 409 Conflict — more semantically accurate than 400
      throw err;
    }

    deducted.push({ productId: item.productId, quantity: item.quantity });
  }
};

/**
 * Build the order items array and compute the subtotal.
 *
 * @param {Array<{ productId, quantity }>} cartItems
 * @param {Map<string, Product>} productMap
 * @returns {{ orderItems: Array, subtotal: number }}
 */
const buildOrderItems = (cartItems, productMap) => {
  let subtotal = 0;
  const orderItems = [];

  for (const item of cartItems) {
    const product = productMap.get(item.productId.toString());
    const price =
      product.discountPrice != null && product.discountPrice > 0
        ? product.discountPrice
        : product.price;
    subtotal += price * item.quantity;
    orderItems.push({
      productId: product._id,
      sellerId: product.sellerId,
      quantity: item.quantity,
      price,
    });
  }

  return { orderItems, subtotal };
};

/**
 * Full checkout pipeline: validate cart → validate/deduct stock →
 * build order items → apply coupon → create Order + Payment → clear cart.
 *
 * @param {object} opts
 * @param {string}  opts.userId
 * @param {object}  opts.shippingAddress
 * @param {string}  opts.paymentMethod
 * @param {string}  [opts.couponCode]
 * @param {string}  [opts.gatewayRef]       - Razorpay paymentId or mock ref
 * @param {string}  [opts.razorpayOrderId]
 * @param {string}  [opts.razorpaySignature]
 * @param {string}  [opts.paymentStatus]    - 'success' | 'pending'
 * @returns {Promise<{ order, payment }>}
 */
const processCheckout = async ({
  userId,
  shippingAddress,
  paymentMethod = 'card',
  couponCode,
  gatewayRef = '',
  razorpayOrderId,
  razorpaySignature,
  paymentStatus = 'success',
}) => {
  const cart = await getValidatedCart(userId);
  const productMap = await buildProductMap(cart.items);
  await deductStock(cart.items, productMap);

  const { orderItems, subtotal } = buildOrderItems(cart.items, productMap);
  const { discountAmount } = applyCoupon(couponCode, subtotal);
  const finalTotal = subtotal - discountAmount;

  const order = await Order.create({
    userId,
    items: orderItems,
    shippingAddress,
    totalAmount: finalTotal,
    originalAmount: subtotal,
    discountAmount,
    couponCode: couponCode || null,
    status: 'confirmed',
    estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  const paymentData = {
    orderId: order._id,
    userId,
    amount: finalTotal,
    method: paymentMethod,
    gatewayRef,
    status: paymentStatus,
  };
  if (razorpayOrderId) paymentData.razorpayOrderId = razorpayOrderId;
  if (gatewayRef && paymentMethod === 'razorpay') paymentData.razorpayPaymentId = gatewayRef;
  if (razorpaySignature) paymentData.razorpaySignature = razorpaySignature;

  const payment = await Payment.create(paymentData);

  order.paymentId = payment._id;
  await order.save();

  cart.items = [];
  await cart.save();

  return { order, payment };
};

export { getValidatedCart, buildProductMap, deductStock, buildOrderItems, processCheckout, };
