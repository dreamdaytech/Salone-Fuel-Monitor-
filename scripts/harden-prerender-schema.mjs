import fs from 'node:fs';
import path from 'node:path';

const seoDir = path.join(process.cwd(), 'dist', '_seo');
if (!fs.existsSync(seoDir)) process.exit(0);

const SITE_URL = 'https://salonefuelmonitor.com';
const SITE_NAME = 'Salone Fuel Monitor';

const authorPattern = /"author":\{"@type":"Organization","name":"([^"]+)","url":"https:\/\/salonefuelmonitor\.com"\}/g;
const authorReplacement = '"author":{"@type":"Organization","name":"$1","url":"https://salonefuelmonitor.com","logo":{"@type":"ImageObject","url":"https://salonefuelmonitor.com/logo.png"}}';

function getBlogSlug(fileName) {
  if (!fileName.startsWith('blog-') || !fileName.endsWith('.html')) return null;
  return fileName.slice('blog-'.length, -'.html'.length);
}

function getArticleImage(slug) {
  // Blog Management / Firestore is the single source of truth for featured
  // images once an article has an admin record. The HTTP endpoint returns a
  // crawler-safe image response for uploaded data-URI/WebP covers and safely
  // falls back to the site Open Graph image when no admin cover exists.
  return `${SITE_URL}/api/blog-image/${slug}`;
}

function replaceMeta(html, attribute, key, value) {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i');
  const replacement = `<meta ${attribute}="${key}" content="${value}" />`;
  return pattern.test(html)
    ? html.replace(pattern, replacement)
    : html.replace('</head>', `    ${replacement}\n  </head>`);
}

function hardenDatasetValue(value) {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = hardenDatasetValue(item);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: next, changed };
  }

  if (!value || typeof value !== 'object') {
    return { value, changed: false };
  }

  let changed = false;
  const next = { ...value };

  if (next['@type'] === 'Dataset') {
    // Google Dataset Search supports isPartOf only as a URL or another Dataset.
    // The generic prerender schema attaches the Dataset to a WebSite, which is
    // valid general schema.org modelling but is rejected by Google's Dataset
    // enhancement. Remove that relationship unless a real parent Dataset is
    // explicitly supplied in the future.
    if (
      next.isPartOf &&
      typeof next.isPartOf === 'object' &&
      !Array.isArray(next.isPartOf) &&
      next.isPartOf['@type'] === 'WebSite'
    ) {
      delete next.isPartOf;
      changed = true;
    }

    // Google recommends creator for Dataset markup. Salone Fuel Monitor is the
    // publisher and maintainer of these platform datasets.
    if (!next.creator) {
      next.creator = {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      };
      changed = true;
    }
  }

  for (const [key, child] of Object.entries(next)) {
    if (key === 'creator') continue;
    const result = hardenDatasetValue(child);
    if (result.changed) {
      next[key] = result.value;
      changed = true;
    }
  }

  return { value: next, changed };
}

function hardenDatasetSchema(html) {
  const pattern = /<script\s+id=["']prerender-seo-jsonld["']\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i;
  const match = html.match(pattern);
  if (!match) return { html, changed: false };

  try {
    const parsed = JSON.parse(match[1]);
    const result = hardenDatasetValue(parsed);
    if (!result.changed) return { html, changed: false };

    const serialized = JSON.stringify(result.value).replace(/</g, '\\u003c');
    return {
      html: html.replace(match[0], `<script id="prerender-seo-jsonld" type="application/ld+json">${serialized}</script>`),
      changed: true,
    };
  } catch (error) {
    console.warn('[SEO] Could not parse prerender JSON-LD for Dataset hardening:', error);
    return { html, changed: false };
  }
}

let schemaChanged = 0;
let datasetSchemaChanged = 0;
let socialImageChanged = 0;

for (const fileName of fs.readdirSync(seoDir)) {
  if (!fileName.endsWith('.html')) continue;
  const filePath = path.join(seoDir, fileName);
  const html = fs.readFileSync(filePath, 'utf8');
  let hardened = html.replace(authorPattern, authorReplacement);

  if (hardened !== html) schemaChanged += 1;

  const datasetResult = hardenDatasetSchema(hardened);
  hardened = datasetResult.html;
  if (datasetResult.changed) datasetSchemaChanged += 1;

  const slug = getBlogSlug(fileName);
  if (slug) {
    const imageUrl = getArticleImage(slug);
    const beforeSocial = hardened;

    hardened = replaceMeta(hardened, 'property', 'og:image', imageUrl);
    hardened = replaceMeta(hardened, 'property', 'og:image:secure_url', imageUrl);
    hardened = replaceMeta(hardened, 'name', 'twitter:image', imageUrl);

    // The endpoint can return WebP or redirect to a remote image, so stale hard-
    // coded width/height/type hints are intentionally removed. Crawlers inspect
    // the actual response and receive the same featured image the admin selected.
    hardened = hardened
      .replace(/\s*<meta\s+property=["']og:image:(?:width|height|type)["'][^>]*>/gi, '')
      .replace(/"image":"https:\/\/salonefuelmonitor\.com\/og-image\.png"/g, `"image":"${imageUrl}"`)
      .replace(/"image":"https:\/\/salonefuelmonitor\.com\/images\/articles\/[^"]+"/g, `"image":"${imageUrl}"`);

    if (hardened !== beforeSocial) socialImageChanged += 1;
  }

  if (hardened !== html) {
    fs.writeFileSync(filePath, hardened);
  }
}

console.log(`[SEO] Hardened Article author schema in ${schemaChanged} prerendered page(s).`);
console.log(`[SEO] Fixed Google Dataset schema in ${datasetSchemaChanged} prerendered page(s).`);
console.log(`[SEO] Applied Blog Management social images to ${socialImageChanged} prerendered blog page(s).`);
