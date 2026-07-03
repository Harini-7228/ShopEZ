const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['price_drop', 'back_in_stock'],
      required: true,
    },
    targetPrice: {
      type: Number,
      required: function () {
        return this.type === 'price_drop';
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate alert subscription of the same type for a single user/product pair
priceAlertSchema.index({ userId: 1, productId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('PriceAlert', priceAlertSchema);
