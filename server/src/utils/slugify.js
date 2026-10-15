/**
 * Simple slugify utility — converts a title to a URL-safe slug.
 */
function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // remove non-word chars
    .replace(/[\s_-]+/g, '-')    // spaces/underscores to hyphens
    .replace(/^-+|-+$/g, '')     // trim leading/trailing hyphens
    + '-' + Date.now().toString(36);  // append timestamp for uniqueness
}

module.exports = slugify;
