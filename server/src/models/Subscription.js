const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      required: true,
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'past_due', 'trial'],
      default: 'active',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    razorpaySubscriptionId: { type: String, index: true },
    razorpayCustomerId: { type: String },
    features: {
      liveData: { type: Boolean, default: false },
      advancedCharts: { type: Boolean, default: false },
      watchlistLimit: { type: Number, default: 5 },
      stockAlerts: { type: Boolean, default: false },
      exportData: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Set features based on plan
subscriptionSchema.methods.applyPlanFeatures = function () {
  const plans = {
    free:    { liveData: false, advancedCharts: false, watchlistLimit: 5,   stockAlerts: false, exportData: false },
    basic:   { liveData: true,  advancedCharts: false, watchlistLimit: 20,  stockAlerts: true,  exportData: false },
    premium: { liveData: true,  advancedCharts: true,  watchlistLimit: 100, stockAlerts: true,  exportData: true  },
  };
  this.features = plans[this.plan] || plans.free;
};

subscriptionSchema.virtual('isActive').get(function () {
  return this.status === 'active' || this.status === 'trial';
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
