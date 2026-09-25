import fs from 'node:fs';
import path from 'node:path';

const seoDir = path.join(process.cwd(), 'dist', '_seo');
if (!fs.existsSync(seoDir)) process.exit(0);

const SITE_URL = 'https://salonefuelmonitor.com';

const STATIC_ARTICLE_IMAGES = {
  'why-fuel-prices-change-in-sierra-leone': '/images/articles/why-fuel-prices-change-in-sierra-leone.jpg',
  'sierra-leone-fuel-price-history-2026': '/images/articles/sierra-leone-fuel-price-history-2026.jpg',
  'sierra-leone-vs-liberia-fuel-prices': '/images/articles/sierra-leone-vs-liberia-fuel-prices.jpg',
  'sierra-leone-vs-ghana-fuel-prices': '/images/articles/sierra-leone-vs-ghana-fuel-prices.jpg',
  'sierra-leone-vs-nigeria-fuel-prices': '/images/articles/sierra-leone-vs-nigeria-fuel-prices.jpg',
};

const authorPattern = /"author":\{"@type":"Organization","name":"([^"]+)","url":"https:\/\/salonefuelmonitor\.com"\}/g;
const authorReplacement = '"author":{"@type":"Organization","name":"$1","url":"https://salonefuelmonitor.com","logo":{"@type":"ImageObject","url":"https://salonefuelmonitor.com/logo.png"}}';

function getBlogSlug(fileName) {
  if (!fileName.startsWith('blog-') || !fileName.endsWith('.html')) return null;
  return fileName.slice('blog-'.length, -'.html'.length);
}

function getArticleImage(slug) {
  const staticImage = STATIC_ARTICLE_IMAGES[slug];
  if (staticImage) return `${SITE_URL}${staticImage}`;

  // Dashboard/Firestore articles store uploaded cover images in blog_posts.
  // The server endpoint turns base64/WebP covers into a crawler-fetchable URL
  // and redirects to remote cover URLs when appropriate.
  return `${SITE_URL}/api/blog-image/${slug}`;
}

function replaceMeta(html, attribute, key, value) {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i');
  const replacement = `<meta ${attribute}="${key}" content="${value}" />`;
  return pattern.test(html)
    ? html.replace(pattern, replacement)
    : html.replace('</head>', `    ${replacement}\n  </head>`);
}

let schemaChanged = 0;
let socialImageChanged = 0;

for (const fileName of fs.readdirSync(seoDir)) {
  if (!fileName.endsWith('.html')) continue;
  const filePath = path.join(seoDir, fileName);
  const html = fs.readFileSync(filePath, 'utf8');
  let hardened = html.replace(authorPattern, authorReplacement);

  if (hardened !== html) schemaChanged += 1;

  const slug = getBlogSlug(fileName);
  if (slug) {
    const imageUrl = getArticleImage(slug);
    const beforeSocial = hardened;

    hardened = replaceMeta(hardened, 'property', 'og:image', imageUrl);
    hardened = replaceMeta(hardened, 'property', 'og:image:secure_url', imageUrl);
    hardened = replaceMeta(hardened, 'name', 'twitter:image', imageUrl);

    // Image dimensions/type in the generic shell may be wrong for article covers
    // (Firestore images are commonly WebP; static authority art is JPEG). Let the
    // social crawler inspect the real resource instead of publishing stale hints.
    hardened = hardened
      .replace(/\s*<meta\s+property=["']og:image:(?:width|height|type)["'][^>]*>/gi, '')
      .replace(/"image":"https:\/\/salonefuelmonitor\.com\/og-image\.png"/g, `"image":"${imageUrl}"`);

    if (hardened !== beforeSocial) socialImageChanged += 1;
  }

  if (hardened !== html) {
    fs.writeFileSync(filePath, hardened);
  }
}

console.log(`[SEO] Hardened Article author schema in ${schemaChanged} prerendered page(s).`);
console.log(`[SEO] Applied article-specific social images to ${socialImageChanged} prerendered blog page(s).`);
