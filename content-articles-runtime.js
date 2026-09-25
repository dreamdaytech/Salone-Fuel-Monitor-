import { STATIC_CONTENT_ARTICLES as BASE_ARTICLES } from './content-articles.js';
import { STATIC_CONTENT_ARTICLES as PUBLISHED_ARTICLES } from './content-articles-published.js';

const ARTICLE_FEATURED_IMAGES = {
  'why-fuel-prices-change-in-sierra-leone': '/images/social/why-fuel-prices-change-in-sierra-leone.png',
  'sierra-leone-fuel-price-history-2026': '/images/social/sierra-leone-fuel-price-history-2026.png',
  'sierra-leone-vs-liberia-fuel-prices': '/images/social/sierra-leone-vs-liberia-fuel-prices.png',
  'sierra-leone-vs-ghana-fuel-prices': '/images/social/sierra-leone-vs-ghana-fuel-prices.png',
  'sierra-leone-vs-nigeria-fuel-prices': '/images/social/sierra-leone-vs-nigeria-fuel-prices.png',
};

const FINAL_META_OVERRIDES = {
  'sierra-leone-vs-ghana-fuel-prices': {
    seoDescription: 'Compare Sierra Leone and Ghana petrol and diesel prices with live regional data and context on currencies, pricing systems, taxes and market structure.',
  },
};

// Keep the original exported article objects in sync as well. The prerender
// pipeline imports getStaticArticleByPath from content-articles.js, so mutating
// the shared objects here ensures crawler snapshots and the React runtime use
// the same corrected copy.
for (const published of PUBLISHED_ARTICLES) {
  const coverImage = ARTICLE_FEATURED_IMAGES[published.slug];
  const finalArticle = {
    ...published,
    ...(coverImage ? { coverImage } : {}),
    ...(FINAL_META_OVERRIDES[published.slug] || {}),
  };
  Object.assign(published, finalArticle);

  const base = BASE_ARTICLES.find((article) => article.slug === published.slug);
  if (base) Object.assign(base, finalArticle);
}

export const STATIC_CONTENT_ARTICLES = PUBLISHED_ARTICLES;

export function getStaticArticle(slug = '') {
  return STATIC_CONTENT_ARTICLES.find((article) => article.slug === slug) || null;
}

export function getStaticArticleByPath(pathname = '') {
  const prefix = '/blog/';
  if (!pathname.startsWith(prefix)) return null;
  return getStaticArticle(pathname.slice(prefix.length));
}
