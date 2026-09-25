import fs from 'node:fs';
import path from 'node:path';
import { SITE_URL, STATIC_ARTICLE_SEO, DEFAULT_OG_IMAGE } from '../seo-routes.js';
import { STATIC_CONTENT_ARTICLES } from '../content-articles-runtime.js';

const seoDir = path.join(process.cwd(), 'dist', '_seo');
if (!fs.existsSync(seoDir)) process.exit(0);

function routeFileName(route) {
  if (route === '/') return 'home.html';
  return `${route.slice(1).replace(/[^a-z0-9-]+/gi, '-')}.html`;
}

function absoluteImage(value) {
  if (!value) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

const articleImages = new Map();

for (const article of STATIC_CONTENT_ARTICLES) {
  const route = `/blog/${article.slug}`;
  articleImages.set(route, absoluteImage(article.coverImage));
}

for (const route of Object.keys(STATIC_ARTICLE_SEO)) {
  if (!route.startsWith('/blog/') || articleImages.has(route)) continue;
  const slug = route.slice('/blog/'.length);
  articleImages.set(route, `${SITE_URL}/api/blog-image/${slug}`);
}

let changed = 0;

for (const [route, imageUrl] of articleImages.entries()) {
  const filePath = path.join(seoDir, routeFileName(route));
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;
  const isJpeg = /\.jpe?g(?:$|\?)/i.test(imageUrl);
  const isPng = /\.png(?:$|\?)/i.test(imageUrl);
  const imageType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : '';

  html = html
    .replace(
      /<meta property="og:image" content="[^"]*" \/>/i,
      `<meta property="og:image" content="${imageUrl}" />\n    <meta property="og:image:secure_url" content="${imageUrl}" />`
    )
    .replace(/<meta property="og:image:width" content="[^"]*" \/>/i, '<meta property="og:image:width" content="1200" />')
    .replace(/<meta property="og:image:height" content="[^"]*" \/>/i, '<meta property="og:image:height" content="630" />')
    .replace(
      /\s*<meta property="og:image:type" content="[^"]*" \/>/i,
      imageType ? `\n    <meta property="og:image:type" content="${imageType}" />` : ''
    )
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/i, `<meta name="twitter:image" content="${imageUrl}" />`)
    .replaceAll(DEFAULT_OG_IMAGE, imageUrl);

  if (html !== original) {
    fs.writeFileSync(filePath, html);
    changed += 1;
  }
}

console.log(`[SEO] Applied article-specific social images to ${changed} prerendered page(s).`);
