const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: [true, 'Symbol/Ticker is required'],
      uppercase: true,
      trim: true,
    },
    tradeType: {
      type: String,
      enum: ['Long', 'Short'],
      default: 'Long',
      required: true,
    },
    entryDate: {
      type: Date,
      required: [true, 'Entry date is required'],
      default: Date.now,
    },
    exitDate: {
      type: Date,
      default: null,
    },
    entryPrice: {
      type: Number,
      required: [true, 'Entry price is required'],
      min: [0, 'Entry price must be positive'],
    },
    exitPrice: {
      type: Number,
      default: null,
      min: [0, 'Exit price must be positive'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'CLOSED',
    },
    pnl: {
      type: Number,
      default: 0,
    },
    pnlPercent: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    entryReason: {
      type: String,
      default: '',
      trim: true,
    },
    exitReason: {
      type: String,
      default: '',
      trim: true,
    },
    lessonLearned: {
      type: String,
      default: '',
      trim: true,
    },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Pre-save calculate PnL and status
tradeSchema.pre('save', function (next) {
  if (this.exitPrice !== null && this.exitPrice !== undefined && this.exitPrice > 0) {
    this.status = 'CLOSED';
    if (this.tradeType === 'Long') {
      this.pnl = +((this.exitPrice - this.entryPrice) * this.quantity).toFixed(2);
    } else {
      this.pnl = +((this.entryPrice - this.exitPrice) * this.quantity).toFixed(2);
    }
    const invested = this.entryPrice * this.quantity;
    this.pnlPercent = invested > 0 ? +((this.pnl / invested) * 100).toFixed(2) : 0;
  } else {
    this.status = 'OPEN';
    this.pnl = 0;
    this.pnlPercent = 0;
  }
  next();
});

tradeSchema.index({ user: 1, entryDate: -1 });
tradeSchema.index({ user: 1, symbol: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
