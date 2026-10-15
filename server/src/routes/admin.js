const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Article = require('../models/Article');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Audit = require('../models/Audit');
const { getAllIndices, isMarketOpen } = require('../services/marketDataService');
const { body, validationResult } = require('express-validator');
const slugify = require('../utils/slugify');

router.use(protect, adminOnly);

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const [totalUsers, totalSubs, revenue, activeUsers] = await Promise.all([
      User.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 86400000) } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeSubscriptions: totalSubs,
        totalRevenuePaise: revenue[0]?.total || 0,
        activeUsersLast30d: activeUsers,
        marketStatus: isMarketOpen() ? 'OPEN' : 'CLOSED',
        indexCount: getAllIndices().length,
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const filter = q ? { $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: users, pagination: { page: parseInt(page), total } });
  } catch (err) { next(err); }
});

// ─── PATCH /api/admin/users/:id — deactivate/activate ────────────────────────
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// ─── GET /api/admin/articles ──────────────────────────────────────────────────
router.get('/articles', async (req, res, next) => {
  try {
    const articles = await Article.find().populate('author', 'name').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: articles });
  } catch (err) { next(err); }
});

// ─── POST /api/admin/articles ─────────────────────────────────────────────────
router.post(
  '/articles',
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('summary').trim().notEmpty().isLength({ max: 500 }),
    body('content').trim().notEmpty(),
    body('category').isIn(['news', 'education', 'analysis', 'glossary', 'guide']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { title, summary, content, category, tags, isFeatured, isPublished } = req.body;
      const slug = slugify(title);

      const article = await Article.create({
        title, slug, summary, content, category,
        tags: tags || [],
        isFeatured: isFeatured || false,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        author: req.user._id,
        readingTimeMinutes: Math.ceil(content.split(' ').length / 200),
      });

      res.status(201).json({ success: true, data: article });
    } catch (err) { next(err); }
  }
);

// ─── PUT /api/admin/articles/:id ─────────────────────────────────────────────
router.put('/articles/:id', async (req, res, next) => {
  try {
    const updates = req.body;
    if (updates.isPublished && !updates.publishedAt) updates.publishedAt = new Date();
    const article = await Article.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!article) return res.status(404).json({ success: false, message: 'Article not found.' });
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

// ─── DELETE /api/admin/articles/:id ──────────────────────────────────────────
router.delete('/articles/:id', async (req, res, next) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Article deleted.' });
  } catch (err) { next(err); }
});

// ─── GET /api/admin/audits ────────────────────────────────────────────────────
router.get('/audits', async (req, res, next) => {
  try {
    const logs = await Audit.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
});

module.exports = router;
