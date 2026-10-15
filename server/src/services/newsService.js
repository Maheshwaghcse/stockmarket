const axios = require('axios');
const Article = require('../models/Article');
const User = require('../models/User');

const NEWS_API_KEY = process.env.NEWS_API_KEY || '93ba24a1a3094d50ae21e8cb82c79bb4';
const BASE_URL = 'https://newsapi.org/v2';

// In-memory cache for live news
let cachedArticles = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache to respect NewsAPI rate limits

/**
 * Fetch raw live finance headlines from NewsAPI
 */
async function fetchNewsFromApi() {
  const now = Date.now();
  if (cachedArticles.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedArticles;
  }

  try {
    // 1. Fetch top business headlines
    const res = await axios.get(`${BASE_URL}/top-headlines`, {
      params: {
        category: 'business',
        pageSize: 30,
        apiKey: NEWS_API_KEY,
      },
      timeout: 10000,
    });

    const articles = res.data?.articles || [];

    // Filter out articles with empty title or removed content
    const validArticles = articles.filter(
      (a) => a.title && !a.title.includes('[Removed]') && a.url
    );

    cachedArticles = validArticles;
    lastFetchTime = now;
    return validArticles;
  } catch (err) {
    console.error('NewsAPI fetch error:', err.response?.data?.message || err.message);
    // If rate-limited or error, return cached if available
    return cachedArticles;
  }
}

/**
 * Helper to slugify a string safely
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 75);
}

/**
 * Sync NewsAPI articles into MongoDB Article collection
 */
async function syncNewsToDatabase() {
  const rawArticles = await fetchNewsFromApi();
  if (!rawArticles || rawArticles.length === 0) {
    return { count: 0, message: 'No articles fetched from NewsAPI' };
  }

  // Find admin user or first user to assign as author
  let author = await User.findOne({ role: 'admin' });
  if (!author) {
    author = await User.findOne();
  }
  if (!author) {
    return { count: 0, message: 'No user found in database to assign as author' };
  }

  let upsertedCount = 0;

  for (let i = 0; i < rawArticles.length; i++) {
    const item = rawArticles[i];
    const baseSlug = slugify(item.title);
    if (!baseSlug) continue;

    // Check if article with same sourceUrl or slug already exists
    let existing = await Article.findOne({
      $or: [{ sourceUrl: item.url }, { slug: baseSlug }]
    });

    const tags = ['market', 'finance', 'business'];
    if (item.source?.name) tags.push(item.source.name.toLowerCase().replace(/\s+/g, ''));

    const summaryText = item.description || item.title;
    const contentText = item.content || item.description || `${item.title}. For complete reporting, visit the original source.`;

    if (!existing) {
      // Ensure unique slug
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await Article.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${baseSlug}-${counter++}`;
      }

      await Article.create({
        title: item.title,
        slug: uniqueSlug,
        summary: summaryText.slice(0, 490),
        content: contentText,
        author: author._id,
        category: 'news',
        tags: tags.slice(0, 5),
        coverImage: item.urlToImage || null,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
        isPublished: true,
        isFeatured: i < 3, // Top 3 are featured
        readingTimeMinutes: Math.max(2, Math.round((contentText.length || 300) / 250)),
        source: item.source?.name || 'Financial News Wire',
        sourceUrl: item.url,
      });
      upsertedCount++;
    } else {
      // Update existing if coverImage or summary was missing
      if (!existing.coverImage && item.urlToImage) {
        existing.coverImage = item.urlToImage;
      }
      if (!existing.sourceUrl && item.url) {
        existing.sourceUrl = item.url;
      }
      await existing.save();
    }
  }

  console.log(`[NewsService] Synced ${upsertedCount} new finance articles from NewsAPI`);
  return { count: upsertedCount, totalFetched: rawArticles.length };
}

module.exports = {
  fetchNewsFromApi,
  syncNewsToDatabase,
};
