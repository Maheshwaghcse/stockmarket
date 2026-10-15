const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { optionalAuth } = require('../middleware/auth');

// ─── GET /api/news — list published articles ───────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, tag, page = 1, limit = 20, q } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (tag) filter.tags = tag.toLowerCase();
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [articles, total] = await Promise.all([
      Article.find(filter)
        .select('-content')
        .populate('author', 'name avatar')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Article.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/news/featured ─────────────────────────────────────────────────
router.get('/featured', async (req, res, next) => {
  try {
    const articles = await Article.find({ isPublished: true, isFeatured: true })
      .select('-content')
      .populate('author', 'name')
      .sort({ publishedAt: -1 })
      .limit(6);
    res.json({ success: true, data: articles });
  } catch (err) { next(err); }
});

// ─── GET /api/news/:slug ────────────────────────────────────────────────────
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const article = await Article.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name avatar');

    if (!article) return res.status(404).json({ success: false, message: 'Article not found.' });

    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

module.exports = router;
