const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['news', 'education', 'analysis', 'glossary', 'guide'],
      required: true,
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    coverImage: { type: String, default: null },
    publishedAt: { type: Date, default: null },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    readingTimeMinutes: { type: Number, default: 5 },
    relatedSymbols: [{ type: String, uppercase: true }],
    views: { type: Number, default: 0 },
    source: { type: String, default: null },       // External source name
    sourceUrl: { type: String, default: null },    // Original URL if curated
  },
  { timestamps: true }
);

articleSchema.index({ category: 1, isPublished: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ title: 'text', summary: 'text', content: 'text' });

module.exports = mongoose.model('Article', articleSchema);
