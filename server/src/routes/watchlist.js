const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Watchlist = require('../models/Watchlist');
const Subscription = require('../models/Subscription');
const { body, param, validationResult } = require('express-validator');

// All watchlist routes require auth
router.use(protect);

// ─── GET /api/watchlist ───────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const lists = await Watchlist.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: 1 });
    res.json({ success: true, count: lists.length, data: lists });
  } catch (err) { next(err); }
});

// ─── POST /api/watchlist ──────────────────────────────────────────────────────
router.post(
  '/',
  [body('name').trim().notEmpty().isLength({ max: 60 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      // Enforce subscription watchlist limit
      const sub = await Subscription.findOne({ user: req.user._id });
      const maxLists = sub?.features?.watchlistLimit ?? 5;
      const count = await Watchlist.countDocuments({ user: req.user._id });
      if (count >= maxLists) {
        return res.status(403).json({
          success: false,
          message: `Watchlist limit (${maxLists}) reached. Upgrade your plan.`,
        });
      }

      const list = await Watchlist.create({ user: req.user._id, name: req.body.name });
      res.status(201).json({ success: true, data: list });
    } catch (err) { next(err); }
  }
);

// ─── DELETE /api/watchlist/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const list = await Watchlist.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!list) return res.status(404).json({ success: false, message: 'Watchlist not found.' });
    res.json({ success: true, message: 'Watchlist deleted.' });
  } catch (err) { next(err); }
});

// ─── POST /api/watchlist/:id/items — add item ─────────────────────────────────
router.post(
  '/:id/items',
  [
    body('symbol').trim().notEmpty().toUpperCase(),
    body('name').trim().notEmpty(),
    body('type').isIn(['stock', 'index', 'etf']),
    body('exchange').isIn(['NSE', 'BSE']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const list = await Watchlist.findOne({ _id: req.params.id, user: req.user._id });
      if (!list) return res.status(404).json({ success: false, message: 'Watchlist not found.' });

      // Prevent duplicate symbol in same list
      const exists = list.items.some((i) => i.symbol === req.body.symbol.toUpperCase());
      if (exists) return res.status(409).json({ success: false, message: 'Symbol already in watchlist.' });

      list.items.push({
        symbol: req.body.symbol.toUpperCase(),
        name: req.body.name,
        type: req.body.type || 'stock',
        exchange: req.body.exchange || 'NSE',
        alertPrice: req.body.alertPrice || null,
        notes: req.body.notes || '',
      });

      await list.save();
      res.status(201).json({ success: true, data: list });
    } catch (err) { next(err); }
  }
);

// ─── DELETE /api/watchlist/:id/items/:symbol ──────────────────────────────────
router.delete('/:id/items/:symbol', async (req, res, next) => {
  try {
    const list = await Watchlist.findOne({ _id: req.params.id, user: req.user._id });
    if (!list) return res.status(404).json({ success: false, message: 'Watchlist not found.' });

    list.items = list.items.filter((i) => i.symbol !== req.params.symbol.toUpperCase());
    await list.save();
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
});

module.exports = router;
