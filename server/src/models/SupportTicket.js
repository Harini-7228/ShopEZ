import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Order Inquiry', 'Refund Request', 'Technical Issue', 'Product Feedback', 'Other'],
      default: 'Other',
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open',
    },
    messages: [supportMessageSchema],
  },
  {
    timestamps: true,
  }
);

// ── Performance indexes ─────────────────────────────────────────────────────
supportTicketSchema.index({ user: 1, createdAt: -1 });   // getMyTickets
supportTicketSchema.index({ status: 1, updatedAt: -1 });  // admin filter by status

export default mongoose.model('SupportTicket', supportTicketSchema);
