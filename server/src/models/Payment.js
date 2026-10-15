const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String, select: false },
    amount: { type: Number, required: true }, // in paise (INR × 100)
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'attempted', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    plan: { type: String, enum: ['free', 'basic', 'premium'] },
    billingCycle: { type: String, enum: ['monthly', 'yearly'] },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    refundedAt: { type: Date },
    refundAmount: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
