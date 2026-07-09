import mongoose from 'mongoose';

const reorderReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    lastOrderedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    suggestedIntervalDays: {
      type: Number,
      required: true,
      min: [1, 'Interval must be at least 1 day'],
    },
    nextReminderDate: {
      type: Date,
      required: true,
    },
    dismissed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for faster cron checks
reorderReminderSchema.index({ nextReminderDate: 1, dismissed: 1 });
reorderReminderSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model('ReorderReminder', reorderReminderSchema);
