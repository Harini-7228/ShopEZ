import mongoose from 'mongoose';

/**
 * Calculates average rating for a given product and updates its metadata fields.
 */
const calculateAverageRating = async (productId) => {
  const Review = mongoose.model('Review');
  const Product = mongoose.model('Product');

  const stats = await Review.aggregate([
    {
      $match: { productId: new mongoose.Types.ObjectId(productId) },
    },
    {
      $group: {
        _id: '$productId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: stats[0].nRating,
      ratingsAvg: stats[0].avgRating,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: 0,
      ratingsAvg: 0,
    });
  }
};

export { calculateAverageRating, };
