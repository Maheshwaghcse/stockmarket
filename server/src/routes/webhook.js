const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

/**
 * POST /api/webhook/razorpay
 * Razorpay sends raw JSON — must use express.raw() here (app.js registers this before JSON parser).
 */
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET not set — webhook verification skipped.');
      return res.status(200).json({ received: true });
    }

    const signature = req.headers['x-razorpay-signature'];
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSig) {
      console.error('Razorpay webhook signature mismatch.');
      return res.status(400).json({ error: 'Invalid signature.' });
    }

    const event = JSON.parse(req.body.toString());
    const { event: eventType, payload } = event;

    if (eventType === 'payment.captured') {
      const rzpPayment = payload.payment.entity;
      await Payment.findOneAndUpdate(
        { razorpayOrderId: rzpPayment.order_id },
        { razorpayPaymentId: rzpPayment.id, status: 'paid' }
      );
    }

    if (eventType === 'subscription.cancelled') {
      const rzpSub = payload.subscription.entity;
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: rzpSub.id },
        { status: 'cancelled', cancelAtPeriodEnd: true }
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

module.exports = router;
