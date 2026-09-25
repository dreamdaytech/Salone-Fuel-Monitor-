import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://salonefuelmonitor.com';
const SITE_NAME = 'Salone Fuel Monitor';
const root = process.cwd();
const distDir = path.join(root, 'dist');
const seoDir = path.join(distDir, '_seo');

const pageFixes = {
  'exchange-rates.html': {
    route: '/exchange-rates',
    title: 'Sierra Leone Exchange Rates | Salone Fuel Monitor',
    eyebrow: 'Exchange rates for fuel analysis',
    sections: [
      {
        heading: 'Why exchange rates matter for Sierra Leone fuel prices',
        paragraphs: [
          'Exchange rates are an important part of fuel-market analysis because petroleum products and international crude-oil benchmarks are commonly priced in foreign currency. When the Sierra Leonean Leone changes against the US dollar or other major currencies, the local-currency cost of imported fuel can move even when the international commodity price is relatively stable.',
          'Salone Fuel Monitor provides exchange-rate tools so users can place Sierra Leone fuel prices in a wider regional and international context. The converter supports more than 160 currencies and can be used alongside the West Africa Fuel Prices Comparison to understand how local-currency values are translated into a common comparison unit.'
        ]
      },
      {
        heading: 'How to use exchange rates in regional comparisons',
        paragraphs: [
          'A cross-country fuel-price comparison should use rates from a consistent time period. Comparing today’s exchange rate with an older pump price can distort the result, especially when a currency has moved significantly. For a fair comparison, check the price date, the currency-conversion date and the unit used for the final figure.',
          'Exchange rates also do not explain the entire difference between national fuel prices. Taxes, subsidies, import costs, freight, storage, domestic refining, distribution margins and national pricing rules can all affect the amount motorists pay at the pump.'
        ]
      },
      {
        heading: 'Use the converter as analysis, not an official quotation',
        paragraphs: [
          'The exchange-rate page is designed for information and analysis. Financial institutions, mobile-money providers and currency dealers may use different buying, selling or settlement rates, so a displayed conversion should not be treated as a guaranteed transaction rate.',
          'For fuel research, combine the exchange-rate page with Sierra Leone Fuel Price History, the regional comparison and the Barrel vs Fuel tracker. Those pages provide the effective-date and market context needed to interpret currency movements more carefully.'
        ]
      }
    ],
    faqs: [
      ['Why do exchange rates affect fuel analysis in Sierra Leone?', 'Imported petroleum products and global oil benchmarks are linked to foreign currencies, especially the US dollar. Currency movements can therefore change the local-currency cost environment even when international oil prices do not move by the same percentage.'],
      ['Can I use the exchange-rate page to compare West African fuel prices?', 'Yes. The converter can help place local prices on a common currency basis, but the price date and exchange-rate date should be aligned as closely as possible.'],
      ['Is the displayed exchange rate an official bank or dealer quotation?', 'No. It is an analytical reference. Banks, mobile-money services and currency dealers can apply different transaction, buying or selling rates.']
    ],
    links: [
      ['/regional-comparison', 'Compare West Africa fuel prices'],
      ['/price-trends', 'Review Sierra Leone fuel price history'],
      ['/barrel-vs-fuel', 'Compare global oil and local pump prices']
    ]
  },
  'transport-trends.html': {
    route: '/transport-trends',
    eyebrow: 'Historical transport fare analysis',
    sections: [
      {
        heading: 'Track transport fare changes in Sierra Leone over time',
        paragraphs: [
          'Transport fares can change as operating costs, route conditions and market circumstances change. Salone Fuel Monitor keeps historical fare information so users can compare route prices over time instead of relying only on the latest fare. Where records are available for different vehicle types or routes, they are treated as separate fare observations rather than collapsed into a single national figure.',
          'The Transport Fare Trends page is useful for commuters, transport operators, businesses and researchers who need to see when a fare changed and how that movement compares with previous periods.'
        ]
      },
      {
        heading: 'Compare fare movements with fuel-price changes carefully',
        paragraphs: [
          'Petrol and diesel are important transport operating costs, but they are not the only factors that influence fares. Vehicle maintenance, tyres and spare parts, labour, route distance, road conditions, passenger demand and regulatory decisions can also affect the final price paid by passengers.',
          'A fuel-price increase therefore does not automatically mean every transport fare should rise by the same percentage. The most useful analysis compares the effective dates of fuel-price changes with the dates of fare adjustments and then considers the wider cost environment.'
        ]
      },
      {
        heading: 'How to read historical fare data',
        paragraphs: [
          'Check the route, vehicle category and date attached to each record before comparing two fares. Similar route names can still represent different services, vehicle types or operating conditions. Missing records should also be treated as unavailable information rather than an assumed unchanged fare.',
          'For broader context, use Transport Fare Trends together with the Transport Fares directory and Sierra Leone Fuel Price History. This creates a clearer timeline of how transport and fuel costs have moved without claiming that one variable alone caused every change.'
        ]
      }
    ],
    faqs: [
      ['Do transport fares always rise when fuel prices rise?', 'No. Fuel is a major operating cost, but maintenance, labour, vehicle type, route conditions, demand and regulatory decisions can also influence fares.'],
      ['Can I compare transport fare history with fuel-price history?', 'Yes. The two timelines can be compared by date to understand whether fare changes occurred before, during or after fuel-price adjustments.'],
      ['Does a missing fare record mean the fare was unchanged?', 'No. A missing record means the platform does not have a confirmed fare entry for that route or category on that date.']
    ],
    links: [
      ['/transport-prices', 'Check current transport fares'],
      ['/price-trends', 'Compare Sierra Leone fuel price history'],
      ['/calculator', 'Estimate fuel costs']
    ]
  },
  'calculator.html': {
    route: '/calculator',
    eyebrow: 'Fuel budgeting tool for Sierra Leone',
    sections: [
      {
        heading: 'Estimate fuel costs for trips and everyday budgeting',
        paragraphs: [
          'The Salone Fuel Monitor calculator helps motorists and businesses turn a pump price into a practical spending estimate. Users can estimate the cost of a known number of litres or use distance and expected fuel consumption to approximate how much petrol or diesel a trip may require.',
          'This can support household budgeting, delivery planning, fleet cost estimates and travel decisions. The result is most useful when the fuel price entered or selected reflects the latest applicable price for the period being analysed.'
        ]
      },
      {
        heading: 'Why real fuel use can differ from an estimate',
        paragraphs: [
          'A calculator provides a planning estimate, not a guarantee of actual consumption. Traffic, road conditions, idling, driving speed, vehicle load, tyre pressure, engine condition, air-conditioning use and driving style can all affect the amount of fuel a vehicle consumes.',
          'For that reason, users comparing several trips or vehicles should keep their assumptions consistent. A realistic consumption figure based on the same vehicle and similar driving conditions will usually be more useful than a generic efficiency estimate.'
        ]
      },
      {
        heading: 'Use current and historical prices for different scenarios',
        paragraphs: [
          'For present-day budgeting, start with the latest available Sierra Leone petrol or diesel price. For historical analysis, use the Fuel Price History page to identify the price that applied on the relevant effective date, then enter that amount into the calculator.',
          'Businesses can also test scenarios by changing the fuel price or expected litres to see how a future cost increase or decrease might affect transport and logistics spending. These scenarios are planning tools and should not be treated as forecasts of an official future pump price.'
        ]
      }
    ],
    faqs: [
      ['What can the Sierra Leone fuel cost calculator estimate?', 'It can help estimate fuel spending from litres, fuel price and trip assumptions such as distance and expected vehicle consumption.'],
      ['Does the calculator predict my exact fuel bill?', 'No. Actual consumption can vary with traffic, road conditions, vehicle condition, load, driving style and other factors.'],
      ['Can I calculate a historical trip cost?', 'Yes. Find the applicable historical pump price by effective date on the Fuel Price History page and use that amount in the calculator.']
    ],
    links: [
      ['/', 'Check current Sierra Leone fuel prices'],
      ['/price-trends', 'Find historical fuel prices'],
      ['/transport-prices', 'Review transport fares']
    ]
  }
};

const legacyArticleDates = {
  'blog-introducing-salone-fuel-monitor-bringing-fuel-price-transparency-to-sierra-leone.html': '2026-08-08',
  'blog-regional-fuel-comparison-where-does-sierra-leone-stand-after-the-september-price-increase.html': '2026-09-10',
  'blog-sierra-leone-fuel-prices-rise-again-petrol-hits-nle-40-and-diesel-nle-45-in-september-2026.html': '2026-09-10',
  'blog-barrel-vs-pump-do-sierra-leone-s-fuel-price-adjustments-follow-global-oil-movements.html': '2026-09-10',
  'blog-barrel-vs-fuel-price-tracker-are-global-savings-reaching-the-pump.html': '2026-08-08',
  'blog-analyzing-the-cost-of-diesel-why-sierra-leone-pays-more-than-its-neighbors.html': '2026-08-08',
  'blog-the-regional-reality-why-sierra-leone-s-fuel-price-remains-a-heavy-burden-and-how-to-fix-it.html': '2026-08-08'
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setMeta(html, attribute, key, value) {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i');
  const replacement = `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;
  return pattern.test(html)
    ? html.replace(pattern, replacement)
    : html.replace('</head>', `    ${replacement}\n  </head>`);
}

function faqSchema(fix) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: fix.faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  };
}

function pageContent(fix) {
  const sections = fix.sections.map((section) => `
      <section style="margin-top:28px">
        <h2 style="font-size:1.35rem;margin:0 0 10px">${escapeHtml(section.heading)}</h2>
        ${section.paragraphs.map((p) => `<p style="margin:10px 0">${escapeHtml(p)}</p>`).join('')}
      </section>`).join('');

  const faqs = `
      <section style="margin-top:32px">
        <h2 style="font-size:1.35rem;margin:0 0 12px">Frequently asked questions</h2>
        ${fix.faqs.map(([q, a]) => `<div style="margin:18px 0"><h3 style="font-size:1rem;margin:0 0 6px">${escapeHtml(q)}</h3><p style="margin:0">${escapeHtml(a)}</p></div>`).join('')}
      </section>`;

  const links = `
      <section style="margin-top:28px">
        <h2 style="font-size:1.2rem;margin:0 0 10px">Related Salone Fuel Monitor tools</h2>
        <ul>${fix.links.map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`).join('')}</ul>
      </section>`;

  return `<section data-seo-indexing-fix="${fix.route}" style="margin-top:32px;border-top:1px solid #d9e1ea;padding-top:24px">
      <p style="font-weight:700;color:#0072C6;margin:0 0 6px">${escapeHtml(fix.eyebrow)}</p>
      ${sections}${faqs}${links}
    </section>`;
}

function extractMeta(html, name) {
  const pattern = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["'][^>]*>`, 'i');
  const reverse = new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+name=["']${name}["'][^>]*>`, 'i');
  return html.match(pattern)?.[1] || html.match(reverse)?.[1] || '';
}

function extractTitle(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/&amp;/g, '&') || '';
}

function extractH1(html) {
  return html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&') || extractTitle(html);
}

function addArticleSchema(html, fileName, publishedAt) {
  if (html.includes('id="seo-indexing-article-schema"')) return html;
  const slug = fileName.slice('blog-'.length, -'.html'.length);
  const canonical = `${SITE_URL}/blog/${slug}`;
  const title = extractH1(html);
  const description = extractMeta(html, 'description');
  const image = `${SITE_URL}/api/blog-image/${slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    mainEntityOfPage: canonical,
    url: canonical,
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` }
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` }
    }
  };
  const tag = `<script id="seo-indexing-article-schema" type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`;
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function removeUnusedHomepagePreload(html) {
  return html.replace(/\s*<link\s+rel=["']preload["']\s+as=["']image["']\s+href=["']\/images\/fuel_stations_sl_new\.png["']\s*\/?>/gi, '');
}

if (!fs.existsSync(seoDir)) {
  console.error('[SEO] dist/_seo not found. Run prerender-seo.mjs first.');
  process.exit(1);
}

let pageFixCount = 0;
let articleSchemaCount = 0;

for (const [fileName, fix] of Object.entries(pageFixes)) {
  const filePath = path.join(seoDir, fileName);
  if (!fs.existsSync(filePath)) continue;
  let html = fs.readFileSync(filePath, 'utf8');
  html = removeUnusedHomepagePreload(html);

  if (fix.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(fix.title)}</title>`);
    html = setMeta(html, 'name', 'title', fix.title);
    html = setMeta(html, 'property', 'og:title', fix.title);
    html = setMeta(html, 'name', 'twitter:title', fix.title);
  }

  if (!html.includes(`data-seo-indexing-fix="${fix.route}"`)) {
    html = html.replace('</main>', `${pageContent(fix)}\n  </main>`);
    const schemaTag = `<script id="seo-indexing-faq-schema" type="application/ld+json">${JSON.stringify(faqSchema(fix)).replace(/</g, '\\u003c')}</script>`;
    html = html.replace('</head>', `    ${schemaTag}\n  </head>`);
  }

  fs.writeFileSync(filePath, html);
  pageFixCount += 1;
}

for (const [fileName, publishedAt] of Object.entries(legacyArticleDates)) {
  const filePath = path.join(seoDir, fileName);
  if (!fs.existsSync(filePath)) continue;
  let html = fs.readFileSync(filePath, 'utf8');
  html = removeUnusedHomepagePreload(html);
  const updated = addArticleSchema(html, fileName, publishedAt);
  if (updated !== html) articleSchemaCount += 1;
  fs.writeFileSync(filePath, updated);
}

// Remove the route-specific hero preload from every prerendered snapshot and
// from the production homepage. It was useful only on the homepage but was
// inherited by every route, producing unused-preload warnings and unnecessary
// network work on admin/blog/utility pages.
for (const fileName of fs.readdirSync(seoDir)) {
  if (!fileName.endsWith('.html')) continue;
  const filePath = path.join(seoDir, fileName);
  const html = fs.readFileSync(filePath, 'utf8');
  const cleaned = removeUnusedHomepagePreload(html);
  if (cleaned !== html) fs.writeFileSync(filePath, cleaned);
}

const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');
  const cleaned = removeUnusedHomepagePreload(html);
  if (cleaned !== html) fs.writeFileSync(indexPath, cleaned);
}

console.log(`[SEO] Strengthened ${pageFixCount} thin indexing page(s).`);
console.log(`[SEO] Added Article schema to ${articleSchemaCount} legacy article snapshot(s).`);
