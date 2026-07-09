import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative'],
    },
    method: {
      type: String,
      required: true,
      default: 'card',
    },
    gatewayRef: {
      type: String,
      required: false,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// ── Performance indexes ─────────────────────────────────────────────────────
// Most frequent query: payments by user (payment history page)
paymentSchema.index({ userId: 1, createdAt: -1 });
// Order lookup for payment status checks
paymentSchema.index({ orderId: 1 });
// Status filter for admin revenue aggregation
paymentSchema.index({ status: 1 });

export default mongoose.model('Payment', paymentSchema);
