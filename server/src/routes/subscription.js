const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { protect } = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Audit = require('../models/Audit');

const PLANS = {
  basic_monthly:  { plan: 'basic',   billingCycle: 'monthly', amount: 49900,  label: 'Basic Monthly — ₹499/mo' },
  basic_yearly:   { plan: 'basic',   billingCycle: 'yearly',  amount: 499900, label: 'Basic Yearly — ₹4,999/yr' },
  premium_monthly:{ plan: 'premium', billingCycle: 'monthly', amount: 99900,  label: 'Premium Monthly — ₹999/mo' },
  premium_yearly: { plan: 'premium', billingCycle: 'yearly',  amount: 999900, label: 'Premium Yearly — ₹9,999/yr' },
};

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('XXXX')) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ─── GET /api/subscription/plans ─────────────────────────────────────────────
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: {
      free:    { name: 'Free',    features: { liveData: false, watchlistLimit: 5,   advancedCharts: false }, price: 0 },
      basic:   { name: 'Basic',   features: { liveData: true,  watchlistLimit: 20,  advancedCharts: false }, monthly: 499, yearly: 4999 },
      premium: { name: 'Premium', features: { liveData: true,  watchlistLimit: 100, advancedCharts: true  }, monthly: 999, yearly: 9999 },
    },
  });
});

// ─── GET /api/subscription/my ─────────────────────────────────────────────────
router.get('/my', protect, async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ user: req.user._id });
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, subscription: sub, payments });
  } catch (err) { next(err); }
});

// ─── POST /api/subscription/create-order ──────────────────────────────────────
router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { planKey } = req.body;
    const plan = PLANS[planKey];
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan selected.' });

    const rzp = getRazorpay();
    if (!rzp) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured. Contact support.' });
    }

    const order = await rzp.orders.create({
      amount: plan.amount,
      currency: 'INR',
      receipt: `sub_${req.user._id}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), plan: plan.plan, billingCycle: plan.billingCycle },
    });

    await Payment.create({
      user: req.user._id,
      razorpayOrderId: order.id,
      amount: plan.amount,
      currency: 'INR',
      status: 'created',
      plan: plan.plan,
      billingCycle: plan.billingCycle,
      description: plan.label,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: plan.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) { next(err); }
});

// ─── POST /api/subscription/verify-payment ────────────────────────────────────
router.post('/verify-payment', protect, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
    if (!payment) return res.status(404).json({ success: false, message: 'Order not found.' });

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();

    // Activate subscription
    const start = new Date();
    const end = new Date();
    if (payment.billingCycle === 'yearly') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    let sub = await Subscription.findOne({ user: req.user._id });
    if (!sub) sub = new Subscription({ user: req.user._id });

    sub.plan = payment.plan;
    sub.status = 'active';
    sub.billingCycle = payment.billingCycle;
    sub.currentPeriodStart = start;
    sub.currentPeriodEnd = end;
    sub.applyPlanFeatures();
    await sub.save();

    payment.subscription = sub._id;
    await payment.save();

    Audit.create({ user: req.user._id, action: 'subscription.activated', meta: { plan: sub.plan } }).catch(() => {});

    res.json({ success: true, message: 'Payment verified. Subscription activated.', subscription: sub });
  } catch (err) { next(err); }
});

module.exports = router;
