const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Audit = require('../models/Audit');
const { protect } = require('../middleware/auth');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateAccessToken  = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

const setCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const logAudit = (action, req, extra = {}) => {
  Audit.create({
    user: req.user?._id || null,
    action,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    ...extra,
  }).catch(() => {});
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

      const user = await User.create({ name, email, password });

      // Create free subscription
      const sub = new Subscription({ user: user._id, plan: 'free', status: 'active' });
      sub.applyPlanFeatures();
      await sub.save();

      const accessToken  = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Persist refresh token hash
      user.refreshTokens = [refreshToken];
      await user.save({ validateBeforeSave: false });

      setCookies(res, accessToken, refreshToken);
      logAudit('user.register', req, { resource: 'User', resourceId: user._id });

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        user,
        accessToken,
        refreshToken,
        subscription: { plan: sub.plan, status: sub.status, features: sub.features },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password +refreshTokens');

      if (!user || !(await user.comparePassword(password))) {
        logAudit('user.login.failed', req);
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
      }

      const accessToken  = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Rotate refresh tokens — keep last 5
      user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      setCookies(res, accessToken, refreshToken);
      logAudit('user.login', req, { resource: 'User', resourceId: user._id });

      const subscription = await Subscription.findOne({ user: user._id });

      res.json({
        success: true,
        user,
        accessToken,
        refreshToken,
        subscription: subscription
          ? { plan: subscription.plan, status: subscription.status, features: subscription.features }
          : null,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token missing.' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select('+refreshTokens');

    if (!user || !user.refreshTokens?.includes(token)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const newAccessToken  = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Rotate
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    setCookies(res, newAccessToken, newRefreshToken);

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired.' });
    }
    next(err);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', protect, async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user && token) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== token);
      await user.save({ validateBeforeSave: false });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/' });

    logAudit('user.logout', req);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });
    res.json({
      success: true,
      user: req.user,
      subscription: subscription
        ? { plan: subscription.plan, status: subscription.status, features: subscription.features }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('preferences.theme').optional().isIn(['light', 'dark']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const allowed = ['name', 'avatar', 'preferences'];
      const updates = {};
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const user = await User.findById(req.user._id).select('+password');
      if (!(await user.comparePassword(req.body.currentPassword))) {
        return res.status(401).json({ success: false, message: 'Current password incorrect.' });
      }
      user.password = req.body.newPassword;
      await user.save();

      logAudit('user.passwordChange', req);
      res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
