import { STATIC_CONTENT_ARTICLES as BASE_ARTICLES } from './content-articles.js';
import { STATIC_CONTENT_ARTICLES as PUBLISHED_ARTICLES } from './content-articles-published.js';

// Keep the original exported article objects in sync as well. The prerender
// pipeline imports getStaticArticleByPath from content-articles.js, so mutating
// the shared objects here ensures crawler snapshots and the React runtime use
// the same corrected copy.
for (const published of PUBLISHED_ARTICLES) {
  const base = BASE_ARTICLES.find((article) => article.slug === published.slug);
  if (base) Object.assign(base, published);
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
