import mongoose from 'mongoose';
import { calculateAverageRating } from '../services/reviewService.js';

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Rating (1 to 5) is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting multiple reviews for the same product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function (productId) {
  await calculateAverageRating(productId);
};

// Call calculateAverageRating after save
reviewSchema.post('save', async function () {
  await calculateAverageRating(this.productId);
});

// Call calculateAverageRating after deletion
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await calculateAverageRating(doc.productId);
  }
});

export default mongoose.model('Review', reviewSchema);
