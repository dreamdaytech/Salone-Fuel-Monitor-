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
import { getAuthorityContent } from '../seo-content.js';

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
  const authority = getAuthorityContent(route);

  // Static article snapshots intentionally use WebPage schema. The live React
  // article page replaces this with richer Article schema using the real
  // Firestore publication date, image and author. This prevents incomplete
  // Article markup from being served before those fields are available.
  const staticSchemaType = meta.schemaType === 'Article'
    ? 'WebPage'
    : (meta.schemaType || 'WebPage');

  const base = {
    '@context': 'https://schema.org',
    '@type': staticSchemaType,
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

  const schemas = [base];

  if (route !== '/') {
    schemas.push({
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
    });
  }

  if (authority?.faqs?.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: authority.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return schemas.length === 1 ? schemas[0] : schemas;
}

function authorityHtml(route) {
  const content = getAuthorityContent(route);
  if (!content) return '';

  const sections = (content.sections || [])
    .map((section) => `
      <article style="margin-top:28px">
        <h2 style="font-size:1.35rem;margin:0 0 10px">${escapeHtml(section.heading)}</h2>
        ${(section.paragraphs || []).map((paragraph) => `<p style="margin:10px 0">${escapeHtml(paragraph)}</p>`).join('')}
      </article>`)
    .join('');

  const faqs = content.faqs?.length
    ? `<section style="margin-top:32px">
        <h2 style="font-size:1.35rem;margin:0 0 12px">Frequently asked questions</h2>
        ${content.faqs.map((faq) => `
          <div style="margin:18px 0">
            <h3 style="font-size:1rem;margin:0 0 6px">${escapeHtml(faq.question)}</h3>
            <p style="margin:0">${escapeHtml(faq.answer)}</p>
          </div>`).join('')}
      </section>`
    : '';

  const related = content.relatedLinks?.length
    ? `<section style="margin-top:28px">
        <h2 style="font-size:1.2rem;margin:0 0 10px">Related fuel information</h2>
        <ul>${content.relatedLinks.map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`).join('')}</ul>
      </section>`
    : '';

  const sources = content.sources?.length
    ? `<section style="margin-top:28px">
        <h2 style="font-size:1.2rem;margin:0 0 10px">Official source reference</h2>
        <p>For primary regulatory announcements and official petroleum information, consult the original source alongside Salone Fuel Monitor.</p>
        <ul>${content.sources.map(([href, label]) => `<li><a href="${href}" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`).join('')}</ul>
      </section>`
    : '';

  return `<section aria-label="Fuel information and search guide" style="margin-top:32px;border-top:1px solid #d9e1ea;padding-top:24px">
    ${content.eyebrow ? `<p style="font-weight:700;color:#0072C6;margin:0 0 6px">${escapeHtml(content.eyebrow)}</p>` : ''}
    <h2 style="font-size:1.55rem;margin:0 0 16px">Fuel price information you can understand and verify</h2>
    ${sections}${faqs}${related}${sources}
  </section>`;
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
    ${authorityHtml(route)}
    <p style="margin-top:28px;font-size:.9rem;color:#5f6b7a">JavaScript enables the interactive charts, live data and filters on this page.</p>
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
  html = removeTag(html, /<meta\s+property=["']og:(?:site_name|locale|image:width|image:height|image:type|image:alt)["'][^>]*>/gi);
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
    <meta property="og:locale" content="en_SL" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
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

// Route-specific HTML snapshots are served by the Hostinger production server
// (and any supported static-host rewrites) so crawlers receive a unique title,
// canonical, description, schema and useful page content before React starts.
for (const [route, meta] of Object.entries(allRoutes)) {
  fs.writeFileSync(path.join(seoDir, routeFileName(route)), renderRoute(route, meta));
}

// Keep the production index itself as a prerendered homepage. This gives the
// root URL useful crawlable HTML while React replaces the snapshot on load.
if (allRoutes['/']) {
  fs.writeFileSync(indexPath, renderRoute('/', allRoutes['/']));
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
console.log(`[SEO] Pre-rendered ${Object.keys(allRoutes).length} route snapshots and generated sitemap.xml.`);
