import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_OG_IMAGE,
  ROUTE_SEO,
  SEO_NAV_LINKS,
  SITE_NAME,
  SITE_URL,
  STATIC_ARTICLE_SEO,
} from '../seo-routes.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const indexPath = path.join(distDir, 'index.html');
const seoDir = path.join(distDir, '_seo');

if (!fs.existsSync(indexPath)) {
  console.error('[SEO] dist/index.html not found. Run vite build first.');
  process.exit(1);
}

fs.mkdirSync(seoDir, { recursive: true });

const sourceHtml = fs.readFileSync(indexPath, 'utf8');
const allRoutes = { ...ROUTE_SEO, ...STATIC_ARTICLE_SEO };

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeXml(value = '') {
  return escapeHtml(value);
}

function routeFileName(route) {
  if (route === '/') return 'home.html';
  return `${route.slice(1).replace(/[^a-z0-9-]+/gi, '-')}.html`;
}

function removeTag(html, pattern) {
  return html.replace(pattern, '');
}

function pageSchema(route, meta) {
  const canonical = `${SITE_URL}${route === '/' ? '/' : route}`;
  const base = {
    '@context': 'https://schema.org',
    '@type': meta.schemaType || 'WebPage',
    name: meta.heading || meta.title,
    description: meta.description,
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };

  if (meta.schemaType === 'Dataset') {
    base.spatialCoverage = {
      '@type': 'Place',
      name: route === '/regional-comparison' ? 'West Africa' : 'Sierra Leone',
    };
    base.license = `${SITE_URL}/terms`;
  }

  if (route === '/') return base;

  return [
    base,
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE_URL}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: meta.heading || meta.title,
          item: canonical,
        },
      ],
    },
  ];
}

function staticRootContent(route, meta) {
  const nav = SEO_NAV_LINKS
    .map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`)
    .join(' · ');

  return `<main data-seo-prerender="true" style="max-width:960px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif;line-height:1.6;color:#172033">
    <header>
      <p style="font-weight:700;color:#0072C6;margin:0 0 8px">Salone Fuel Monitor</p>
      <h1 style="font-size:2rem;line-height:1.2;margin:0 0 16px">${escapeHtml(meta.heading || meta.title)}</h1>
      <p style="font-size:1.05rem;margin:0 0 20px">${escapeHtml(meta.intro || meta.description)}</p>
    </header>
    <nav aria-label="Primary fuel information" style="margin-top:20px">${nav}</nav>
    <p style="margin-top:24px;font-size:.9rem;color:#5f6b7a">JavaScript enables the interactive charts, live data and filters on this page.</p>
  </main>`;
}

function renderRoute(route, meta) {
  const canonical = `${SITE_URL}${route === '/' ? '/' : route}`;
  const robots = meta.index === false
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large';
  const type = meta.schemaType === 'Article' ? 'article' : 'website';
  const schema = JSON.stringify(pageSchema(route, meta)).replace(/</g, '\\u003c');

  let html = sourceHtml;
  html = removeTag(html, /<title>[\s\S]*?<\/title>/i);
  html = removeTag(html, /<meta\s+name=["']title["'][^>]*>/gi);
  html = removeTag(html, /<meta\s+name=["']description["'][^>]*>/gi);
  html = removeTag(html, /<meta\s+name=["']robots["'][^>]*>/gi);
  html = removeTag(html, /<meta\s+name=["']googlebot["'][^>]*>/gi);
  html = removeTag(html, /<link\s+rel=["']canonical["'][^>]*>/gi);
  html = removeTag(html, /<meta\s+property=["']og:(?:url|title|description|type|image)["'][^>]*>/gi);
  html = removeTag(html, /<meta\s+(?:name|property)=["']twitter:(?:url|title|description|card|image)["'][^>]*>/gi);
  html = removeTag(html, /<script\s+id=["']prerender-seo-jsonld["'][\s\S]*?<\/script>/gi);

  const tags = `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="title" content="${escapeHtml(meta.title)}" />
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="robots" content="${robots}" />
    <meta name="googlebot" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(meta.heading || SITE_NAME)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonical}" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
    <script id="prerender-seo-jsonld" type="application/ld+json">${schema}</script>`;

  html = html.replace('</head>', `${tags}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${staticRootContent(route, meta)}</div>`);
  return html;
}

for (const [route, meta] of Object.entries(allRoutes)) {
  const html = renderRoute(route, meta);
  if (route === '/') {
    fs.writeFileSync(indexPath, html);
  } else {
    fs.writeFileSync(path.join(seoDir, routeFileName(route)), html);
  }
}

const sitemapRoutes = Object.entries(allRoutes)
  .filter(([, meta]) => meta.index !== false)
  .map(([route, meta]) => {
    const loc = `${SITE_URL}${route === '/' ? '/' : route}`;
    const changefreq = meta.changefreq ? `\n    <changefreq>${meta.changefreq}</changefreq>` : '';
    const priority = meta.priority ? `\n    <priority>${meta.priority}</priority>` : '';
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${changefreq}${priority}\n  </url>`;
  })
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes}
</urlset>\n`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
console.log(`[SEO] Pre-rendered ${Object.keys(allRoutes).length} indexable/utility routes and generated sitemap.xml.`);
