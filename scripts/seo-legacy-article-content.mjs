import fs from 'node:fs';
import path from 'node:path';

const seoDir = path.join(process.cwd(), 'dist', '_seo');

const articles = {
  'blog-regional-fuel-comparison-where-does-sierra-leone-stand-after-the-september-price-increase.html': {
    route: '/blog/regional-fuel-comparison-where-does-sierra-leone-stand-after-the-september-price-increase',
    eyebrow: 'Regional fuel-price analysis',
    sections: [
      {
        heading: 'How to read Sierra Leone’s position in a West African fuel comparison',
        paragraphs: [
          'A regional fuel-price ranking is most useful when every country is compared on the same unit, currency basis and reference date. Sierra Leone’s pump prices can be placed alongside markets such as Liberia, Guinea, Ghana, Nigeria, Senegal, Côte d’Ivoire and The Gambia, but the resulting ranking should always be read with the timing of each national price update in mind.',
          'A country can move up or down a regional table because its own pump price changed, because another country adjusted its price, or because exchange rates changed the common-currency value. Salone Fuel Monitor therefore treats regional comparison as a dated analytical snapshot rather than a permanent statement about which market is cheapest or most expensive.'
        ]
      },
      {
        heading: 'Why neighbouring countries can have very different pump prices',
        paragraphs: [
          'Retail petroleum prices are influenced by more than crude oil alone. Exchange rates, taxes, subsidies, import and freight costs, storage, distribution, refining arrangements, regulated margins and the timing of national pricing decisions can all affect the final amount paid at the pump.',
          'This is why a regional comparison should not be interpreted as a direct measure of affordability or living standards. Household income, transport patterns and the wider cost of living differ across countries. The comparison is best used to understand relative pump-price levels and then explore the market factors behind those differences.'
        ]
      },
      {
        heading: 'Use the live comparison for the newest regional position',
        paragraphs: [
          'This article describes a particular September 2026 comparison period. For the newest available figures, use the live West Africa Fuel Prices Comparison page. The Fuel Price History page can then show which Sierra Leone price adjustment produced the local change, while the Exchange Rates page provides additional currency context.',
          'Reading the article together with those live tools prevents an older published comparison from being mistaken for today’s regional ranking and makes it easier to separate historical analysis from current price information.'
        ]
      }
    ],
    faqs: [
      ['Does Sierra Leone’s regional fuel-price rank stay the same?', 'No. Rankings can change when Sierra Leone or another country updates pump prices or when exchange rates change the common-currency comparison.'],
      ['Why compare prices in a common currency per litre?', 'A common currency and unit make cross-country comparisons easier to read, while the original local-currency price and comparison date remain important context.'],
      ['Where can I see the latest West Africa fuel prices?', 'Use Salone Fuel Monitor’s live Regional Comparison page for the newest available comparison rather than relying on an older article snapshot.']
    ],
    links: [
      ['/regional-comparison', 'Open the live West Africa fuel-price comparison'],
      ['/price-trends', 'Review Sierra Leone fuel-price history'],
      ['/exchange-rates', 'Check exchange-rate context']
    ]
  },
  'blog-sierra-leone-fuel-prices-rise-again-petrol-hits-nle-40-and-diesel-nle-45-in-september-2026.html': {
    route: '/blog/sierra-leone-fuel-prices-rise-again-petrol-hits-nle-40-and-diesel-nle-45-in-september-2026',
    eyebrow: 'September 2026 fuel-price update',
    sections: [
      {
        heading: 'What a new official pump-price adjustment means',
        paragraphs: [
          'When an official fuel-price adjustment takes effect, the effective date matters as much as the headline figure. Salone Fuel Monitor keeps price events by effective date so users can distinguish a new adjustment from an older record and see whether more than one change occurred within the same month.',
          'The September 2026 update is part of that historical sequence. Rather than treating September as one single price point, the platform preserves each dated event so petrol, diesel and kerosene movements can be reviewed accurately over time.'
        ]
      },
      {
        heading: 'Why petrol and diesel price changes matter beyond the pump',
        paragraphs: [
          'Fuel costs can affect household transport budgets, commercial transport, logistics, delivery services, backup power and other operating expenses. The size of those effects depends on how much fuel a household or business uses and on whether other costs, such as transport fares or distribution expenses, also change.',
          'A pump-price increase should therefore be analysed as one part of a wider cost environment. Salone Fuel Monitor links official price history with transport fares, regional comparisons and global oil context so users can examine the change from several perspectives instead of relying on a single headline.'
        ]
      },
      {
        heading: 'How to verify the current price after reading a historical article',
        paragraphs: [
          'Fuel-price articles remain useful as a record of what changed at a particular time, but they should not be used as a substitute for the latest live price. After reading a historical update, check the Salone Fuel Monitor homepage or the dedicated petrol, diesel and kerosene pages for the newest available official price and effective date.',
          'For longer-term analysis, the Fuel Price History page shows how the September adjustment fits within the 2026 timeline and avoids confusing an old published figure with a later official price event.'
        ]
      }
    ],
    faqs: [
      ['Why does Salone Fuel Monitor use effective dates?', 'Effective dates preserve the actual sequence of official price changes, including situations where more than one adjustment occurs within the same month.'],
      ['Is the price in this September article necessarily the current price?', 'No. The article records a historical adjustment. The homepage and dedicated fuel-price pages should be checked for the newest available official price.'],
      ['Where can I compare this change with earlier Sierra Leone prices?', 'Use the Fuel Price History page to review petrol, diesel and kerosene changes by effective date.']
    ],
    links: [
      ['/', 'Check current Sierra Leone fuel prices'],
      ['/price-trends', 'Explore fuel-price history'],
      ['/petrol-price-sierra-leone', 'Open the petrol-price guide'],
      ['/diesel-price-sierra-leone', 'Open the diesel-price guide']
    ]
  },
  'blog-barrel-vs-pump-do-sierra-leone-s-fuel-price-adjustments-follow-global-oil-movements.html': {
    route: '/blog/barrel-vs-pump-do-sierra-leone-s-fuel-price-adjustments-follow-global-oil-movements',
    eyebrow: 'Global oil versus local pump prices',
    sections: [
      {
        heading: 'Why crude-oil prices and pump prices do not move one-for-one',
        paragraphs: [
          'Brent, WTI and the OPEC Basket are useful indicators of the international crude-oil market, but Sierra Leone motorists buy refined petroleum products at the retail pump. Between those two points are exchange rates, refining or product costs, freight, storage, taxes, subsidies, distribution margins and the timing of the national pricing process.',
          'For that reason, a fall or rise in crude oil should not automatically be expected to produce an identical percentage change in the local pump price. The relationship is better analysed by direction, timing and the wider cost environment than by assuming a simple one-factor formula.'
        ]
      },
      {
        heading: 'Timing can create an apparent gap between the barrel and the pump',
        paragraphs: [
          'Global oil benchmarks can move every trading day, while Sierra Leone pump prices take effect on specific official dates. If crude prices move between national pricing reviews, the local pump price may remain unchanged for a period. A later adjustment can therefore reflect market conditions accumulated over a longer window rather than the crude price on one particular day.',
          'This timing difference is why Salone Fuel Monitor compares international oil trends with the effective dates of local pump-price changes. Matching two timelines is more informative than comparing a current barrel price with an unrelated historical retail price.'
        ]
      },
      {
        heading: 'Use the live tracker for current market context',
        paragraphs: [
          'This article provides explanatory context, while the live Barrel vs Fuel page is designed for ongoing comparison. Pair that tracker with Sierra Leone Fuel Price History and the Exchange Rates page to see how crude movements, currency context and official local adjustments line up over time.',
          'The comparison is analytical and does not predict or guarantee the next official pump price. Future adjustments remain subject to the applicable national pricing process and the market conditions considered at that time.'
        ]
      }
    ],
    faqs: [
      ['Does lower Brent crude automatically mean lower Sierra Leone pump prices?', 'No. Crude oil is one part of the pricing environment. Exchange rates, refined-product costs, freight, taxes, subsidies, margins and review timing can also affect the pump price.'],
      ['Why can local prices lag global oil movements?', 'International benchmarks move continuously, while local pump-price changes take effect on specific official dates, creating natural timing differences.'],
      ['Does the Barrel vs Fuel analysis predict the next official price?', 'No. It provides market context and historical comparison, not a guaranteed forecast of a future official pump price.']
    ],
    links: [
      ['/barrel-vs-fuel', 'Open the live Barrel vs Fuel tracker'],
      ['/price-trends', 'Review Sierra Leone pump-price history'],
      ['/exchange-rates', 'Review exchange-rate context']
    ]
  },
  'blog-barrel-vs-fuel-price-tracker-are-global-savings-reaching-the-pump.html': {
    route: '/blog/barrel-vs-fuel-price-tracker-are-global-savings-reaching-the-pump',
    eyebrow: 'International oil savings and local fuel prices',
    sections: [
      {
        heading: 'What it means to ask whether global savings reach the pump',
        paragraphs: [
          'When international crude-oil prices fall, it is reasonable to ask whether motorists eventually see lower local fuel costs. The answer depends on more than the direction of crude prices because the retail pump price reflects additional costs and the timing of national pricing decisions.',
          'A useful comparison therefore looks at a sustained international trend, the exchange-rate environment, refined-product and import costs, and the effective dates of Sierra Leone pump-price adjustments. A short-lived change in a global benchmark may not be enough to explain a later retail movement on its own.'
        ]
      },
      {
        heading: 'Exchange rates can offset part of an international price movement',
        paragraphs: [
          'International petroleum markets are commonly priced in foreign currency. If the local currency weakens while crude or refined-product prices fall, part of the international saving can be reduced when converted into local currency. The reverse can also happen when currency conditions improve.',
          'That does not mean exchange rates explain every difference. Freight, storage, taxes, subsidies, distribution margins and the pricing mechanism can all contribute to the final retail price. Salone Fuel Monitor presents exchange rates and global oil data as context rather than as a complete formula for the pump price.'
        ]
      },
      {
        heading: 'Compare equivalent dates instead of isolated headlines',
        paragraphs: [
          'The strongest barrel-versus-pump analysis uses comparable time periods. A global price from today should not be directly compared with a local pump price that applied months earlier without explaining the timing difference. Historical effective dates help keep those comparisons aligned.',
          'Use the live Barrel vs Fuel tracker together with Fuel Price History to examine whether international declines or increases were followed by later Sierra Leone adjustments and how large the timing gap was.'
        ]
      }
    ],
    faqs: [
      ['Do global oil-price savings immediately reach Sierra Leone motorists?', 'Not necessarily. Local prices can reflect review timing, exchange rates, refined-product costs, freight, taxes, subsidies and other components in addition to crude oil.'],
      ['Can exchange rates reduce the benefit of falling international oil prices?', 'Yes. Currency movements can change the local-currency cost of imported petroleum products and may offset part of an international price movement.'],
      ['What is the best way to compare global oil and pump prices?', 'Compare similar time periods and use the effective dates of local price adjustments rather than matching unrelated dates.']
    ],
    links: [
      ['/barrel-vs-fuel', 'Track global oil against local pump prices'],
      ['/price-trends', 'Explore historical Sierra Leone fuel prices'],
      ['/exchange-rates', 'View exchange-rate information']
    ]
  },
  'blog-analyzing-the-cost-of-diesel-why-sierra-leone-pays-more-than-its-neighbors.html': {
    route: '/blog/analyzing-the-cost-of-diesel-why-sierra-leone-pays-more-than-its-neighbors',
    eyebrow: 'Regional diesel-price analysis',
    sections: [
      {
        heading: 'Why diesel prices can differ sharply across neighbouring markets',
        paragraphs: [
          'Two neighbouring countries can face the same broad international oil market and still have different retail diesel prices. Exchange rates, import arrangements, refining capacity, freight, storage, taxes, subsidies, regulated margins and the timing of national price adjustments can all shape the final pump price.',
          'This makes a regional diesel comparison useful as a starting point rather than a complete explanation. A higher or lower ranking shows a relative price difference at a particular time, but additional market and policy context is needed to understand why that difference exists.'
        ]
      },
      {
        heading: 'Why diesel matters to the wider Sierra Leone economy',
        paragraphs: [
          'Diesel is connected to commercial transport, freight, logistics, construction, backup electricity generation and many business operations. Changes in the diesel price can therefore affect operating costs beyond private vehicle use, although the size and timing of those effects vary by sector and business model.',
          'Transport fares and consumer prices should not be assumed to change by the same percentage as diesel. Maintenance, labour, spare parts, route conditions, demand and other costs also influence the prices businesses and passengers ultimately face.'
        ]
      },
      {
        heading: 'Use current regional data with historical Sierra Leone prices',
        paragraphs: [
          'Because regional rankings change, an older article should be read alongside the live West Africa Fuel Prices Comparison. Sierra Leone Fuel Price History then shows how the domestic diesel price moved before and after the period discussed in the article.',
          'Using both views helps distinguish a historical regional comparison from the current market position and makes it easier to track whether Sierra Leone is converging with or diverging from selected neighbouring markets over time.'
        ]
      }
    ],
    faqs: [
      ['Why can Sierra Leone diesel cost more than a neighbouring country?', 'National prices can differ because of exchange rates, taxes, subsidies, import and freight costs, storage, refining arrangements, margins and price-review timing.'],
      ['Does a higher diesel price automatically mean transport fares should rise by the same percentage?', 'No. Transport fares are influenced by several operating costs and regulatory or market factors, not diesel alone.'],
      ['Where can I see the latest regional diesel comparison?', 'Use the live Regional Comparison page and pair it with Sierra Leone Fuel Price History for local context.']
    ],
    links: [
      ['/regional-comparison', 'Compare live West African fuel prices'],
      ['/diesel-price-sierra-leone', 'Open the Sierra Leone diesel-price guide'],
      ['/price-trends', 'Review historical diesel prices']
    ]
  },
  'blog-the-regional-reality-why-sierra-leone-s-fuel-price-remains-a-heavy-burden-and-how-to-fix-it.html': {
    route: '/blog/the-regional-reality-why-sierra-leone-s-fuel-price-remains-a-heavy-burden-and-how-to-fix-it',
    eyebrow: 'Fuel-price burden and regional context',
    sections: [
      {
        heading: 'A pump price and an affordability burden are not the same measure',
        paragraphs: [
          'A regional pump-price comparison can show whether Sierra Leone’s petrol or diesel price is relatively high or low against selected markets, but it does not by itself measure affordability. Household income, transport dependence, commuting distance, vehicle efficiency and the share of earnings spent on transport all influence how heavily a fuel price is felt.',
          'This distinction matters when discussing the economic burden of fuel. Two countries can have similar pump prices but very different household impacts because incomes, transport systems and consumption patterns differ. Regional price rankings should therefore be combined with broader economic context.'
        ]
      },
      {
        heading: 'What can influence Sierra Leone’s retail fuel-price environment',
        paragraphs: [
          'International oil and refined-product costs are important, but the local retail environment can also reflect exchange rates, freight, storage, taxes, subsidies, distribution margins and the national pricing process. These components can move in different directions and at different times.',
          'Policies intended to reduce the burden can also involve trade-offs. Measures affecting taxes, subsidies, competition, storage, import efficiency or public transport may influence consumers, government revenue and market sustainability differently. Data transparency helps those choices be discussed using a clearer record of prices and effective dates.'
        ]
      },
      {
        heading: 'Why transparent historical and regional data matters',
        paragraphs: [
          'Reliable price history makes it easier to distinguish a temporary movement from a longer trend. Regional comparison adds another reference point, while the Barrel vs Fuel tracker shows the international market direction surrounding local adjustments.',
          'Salone Fuel Monitor brings those views together so consumers, businesses, journalists and researchers can examine the evidence behind fuel-price discussions. The platform does not prescribe a single policy solution; it provides data and context that can support more informed public analysis.'
        ]
      }
    ],
    faqs: [
      ['Does a high regional pump-price rank prove fuel is least affordable in Sierra Leone?', 'No. Affordability also depends on income, transport patterns, consumption and other household or business costs.'],
      ['What factors can influence local retail fuel prices?', 'International product costs, exchange rates, freight, storage, taxes, subsidies, margins and the timing of the national pricing process can all matter.'],
      ['How does Salone Fuel Monitor support fuel-policy discussion?', 'It provides historical prices, effective dates, regional comparisons and global market context so users can examine evidence before drawing conclusions.']
    ],
    links: [
      ['/regional-comparison', 'Explore the live regional comparison'],
      ['/price-trends', 'Review Sierra Leone fuel-price history'],
      ['/market-intelligence', 'Explore fuel-market intelligence']
    ]
  }
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function faqSchema(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  };
}

function contentHtml(article) {
  const sections = article.sections.map((section) => `
      <section style="margin-top:28px">
        <h2 style="font-size:1.35rem;margin:0 0 10px">${escapeHtml(section.heading)}</h2>
        ${section.paragraphs.map((paragraph) => `<p style="margin:10px 0">${escapeHtml(paragraph)}</p>`).join('')}
      </section>`).join('');
  const faqs = `<section style="margin-top:32px"><h2 style="font-size:1.35rem;margin:0 0 12px">Frequently asked questions</h2>${article.faqs.map(([question, answer]) => `<div style="margin:18px 0"><h3 style="font-size:1rem;margin:0 0 6px">${escapeHtml(question)}</h3><p style="margin:0">${escapeHtml(answer)}</p></div>`).join('')}</section>`;
  const links = `<section style="margin-top:28px"><h2 style="font-size:1.2rem;margin:0 0 10px">Related fuel data and analysis</h2><ul>${article.links.map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`).join('')}</ul></section>`;
  return `<section data-seo-legacy-article="${article.route}" style="margin-top:32px;border-top:1px solid #d9e1ea;padding-top:24px"><p style="font-weight:700;color:#0072C6;margin:0 0 6px">${escapeHtml(article.eyebrow)}</p>${sections}${faqs}${links}</section>`;
}

if (!fs.existsSync(seoDir)) {
  console.error('[SEO] dist/_seo not found.');
  process.exit(1);
}

let strengthened = 0;
for (const [fileName, article] of Object.entries(articles)) {
  const filePath = path.join(seoDir, fileName);
  if (!fs.existsSync(filePath)) continue;
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(`data-seo-legacy-article="${article.route}"`)) continue;

  html = html.replace('</main>', `${contentHtml(article)}\n  </main>`);
  const schema = `<script id="seo-legacy-faq-schema" type="application/ld+json">${JSON.stringify(faqSchema(article)).replace(/</g, '\\u003c')}</script>`;
  html = html.replace('</head>', `    ${schema}\n  </head>`);
  fs.writeFileSync(filePath, html);
  strengthened += 1;
}

console.log(`[SEO] Strengthened ${strengthened} legacy blog article snapshot(s).`);
