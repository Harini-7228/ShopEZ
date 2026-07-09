import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (value) {
          if (!value) return true;
          // Document context (save/create)
          if (this instanceof mongoose.Document || (this && !this.getUpdate)) {
            return value <= this.price;
          }
          // Query context (update)
          const update = this.getUpdate();
          const setUpdate = update.$set || update;
          const newPrice = setUpdate.price;
          if (newPrice !== undefined) {
            return value <= newPrice;
          }
          return true;
        },
        message: 'Discount price must be less than or equal to original price',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product seller is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      required: [true, 'Product SKU is required'],
      unique: true,
      trim: true,
    },
    isLocalListing: {
      type: Boolean,
      default: false,
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    ratingsAvg: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'out_of_stock'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Automatic status adjustment based on stock level before saving
productSchema.pre('save', function () {
  if (this.stock === 0) {
    this.status = 'out_of_stock';
  } else if (this.status === 'out_of_stock' && this.stock > 0) {
    this.status = 'active';
  }
});

// ── Performance indexes ─────────────────────────────────────────────────────
// Core listing query: status + category (used on every product list page)
productSchema.index({ status: 1, category: 1 });
// Seller dashboard queries
productSchema.index({ sellerId: 1, status: 1 });
// Discount / flash-deal queries
productSchema.index({ status: 1, discountPrice: 1 });
// Default sort (newest first)
productSchema.index({ status: 1, createdAt: -1 });
// Text search (name + description)
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
