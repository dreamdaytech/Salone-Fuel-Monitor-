import { STATIC_CONTENT_ARTICLES } from './content-articles-runtime.js';

export const STATIC_AUTHORITY_SEO = Object.fromEntries(
  STATIC_CONTENT_ARTICLES.map((article) => [
    `/blog/${article.slug}`,
    {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      heading: article.title,
      intro: article.excerpt,
      schemaType: 'Article',
      changefreq: article.changefreq || 'monthly',
      priority: article.priority || '0.8',
      index: true,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt || article.publishedAt,
      authorName: article.authorName || 'Salone Fuel Monitor',
      slug: article.slug,
    },
  ])
);
