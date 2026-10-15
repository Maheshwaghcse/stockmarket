const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

/**
 * Verify JWT access token from Authorization header or httpOnly cookie.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Fallback to httpOnly cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('+refreshTokens');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Restrict to admin role.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

/**
 * Require an active paid subscription.
 * Checks subscription in DB — never trusts client-side claim.
 */
const requireSubscription = (requiredPlan = 'basic') => {
  const planHierarchy = { free: 0, basic: 1, premium: 2 };

  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({
        user: req.user._id,
        status: { $in: ['active', 'trial'] },
        currentPeriodEnd: { $gt: new Date() },
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required.',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }

      const userLevel = planHierarchy[subscription.plan] ?? 0;
      const requiredLevel = planHierarchy[requiredPlan] ?? 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: `${requiredPlan} plan or higher required.`,
          code: 'PLAN_UPGRADE_REQUIRED',
          requiredPlan,
          currentPlan: subscription.plan,
        });
      }

      req.subscription = subscription;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Optional auth — attaches user if token present but does not block unauthenticated requests.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token && req.cookies?.accessToken) token = req.cookies.accessToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) req.user = user;
    }
  } catch {
    // Token invalid or expired — continue as guest
  }
  next();
};

module.exports = { protect, adminOnly, requireSubscription, optionalAuth };
