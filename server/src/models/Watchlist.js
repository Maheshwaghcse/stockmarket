const mongoose = require('mongoose');

const watchlistItemSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['stock', 'index', 'etf'], default: 'stock' },
  exchange: { type: String, enum: ['NSE', 'BSE'], default: 'NSE' },
  addedAt: { type: Date, default: Date.now },
  alertPrice: { type: Number, default: null },
  notes: { type: String, maxlength: 500 },
});

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
      default: 'My Watchlist',
    },
    items: [watchlistItemSchema],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Enforce max watchlists per user based on subscription (checked at route level)
watchlistSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
