const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },      // e.g. 'user.login', 'subscription.created'
    resource: { type: String },                    // e.g. 'User', 'Subscription'
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    ipAddress: { type: String },
    userAgent: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
    success: { type: Boolean, default: true },
    error: { type: String },
  },
  { timestamps: true }
);

auditSchema.index({ user: 1, createdAt: -1 });
auditSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('Audit', auditSchema);
