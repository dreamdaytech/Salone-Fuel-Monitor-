import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const socialDir = path.join(distDir, 'images', 'social');
const logoPath = path.join(distDir, 'logo.png');

fs.mkdirSync(socialDir, { recursive: true });

const ARTICLES = [
  {
    slug: 'why-fuel-prices-change-in-sierra-leone',
    kicker: 'EXPLAINER',
    title: ['Why Fuel Prices Change', 'in Sierra Leone'],
    subtitle: 'Global oil · exchange rates · taxes · local pricing',
    accent: '#20d58a',
  },
  {
    slug: 'sierra-leone-fuel-price-history-2026',
    kicker: 'PRICE HISTORY',
    title: ['Sierra Leone Fuel Price', 'History 2026'],
    subtitle: 'Track petrol, diesel and kerosene price changes over time',
    accent: '#16b9f2',
  },
  {
    slug: 'sierra-leone-vs-liberia-fuel-prices',
    kicker: 'REGIONAL COMPARISON',
    title: ['Sierra Leone vs Liberia', 'Fuel Prices'],
    subtitle: 'Compare neighbouring fuel markets with regional context',
    accent: '#f0b429',
  },
  {
    slug: 'sierra-leone-vs-ghana-fuel-prices',
    kicker: 'REGIONAL COMPARISON',
    title: ['Sierra Leone vs Ghana', 'Fuel Prices'],
    subtitle: 'Compare petrol and diesel prices across two West African markets',
    accent: '#ffca28',
  },
  {
    slug: 'sierra-leone-vs-nigeria-fuel-prices',
    kicker: 'REGIONAL COMPARISON',
    title: ['Sierra Leone vs Nigeria', 'Fuel Prices'],
    subtitle: 'Cross-border fuel price comparison',
    accent: '#2ae06f',
  },
];

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

let logoData = '';
if (fs.existsSync(logoPath)) {
  logoData = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
}

function socialSvg(article) {
  const titleOne = esc(article.title[0]);
  const titleTwo = esc(article.title[1]);
  const subtitle = esc(article.subtitle);
  const kicker = esc(article.kicker);
  const logo = logoData
    ? `<image href="${logoData}" x="70" y="58" width="108" height="108" preserveAspectRatio="xMidYMid meet"/>`
    : `<circle cx="124" cy="112" r="50" fill="#ffffff" opacity="0.96"/><path d="M124 75 L151 124 L124 155 L97 124 Z" fill="#16a34a"/>`;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#041a2d"/>
        <stop offset="0.55" stop-color="#07364a"/>
        <stop offset="1" stop-color="#04261f"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.75" cy="0.35" r="0.7">
        <stop offset="0" stop-color="${article.accent}" stop-opacity="0.28"/>
        <stop offset="1" stop-color="${article.accent}" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.34"/>
      </filter>
    </defs>

    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>

    <g opacity="0.13" stroke="#7dd3fc" stroke-width="2" fill="none">
      <path d="M650 78 C810 40 975 60 1128 135"/>
      <path d="M676 520 C820 470 1025 475 1150 420"/>
      <circle cx="1030" cy="140" r="120"/>
      <circle cx="1030" cy="140" r="80"/>
    </g>

    ${logo}
    <text x="200" y="94" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="800">Salone Fuel Monitor</text>
    <text x="202" y="128" fill="#a6c7d8" font-family="Arial, Helvetica, sans-serif" font-size="22">Sierra Leone&apos;s Real-Time Fuel Price Platform</text>

    <g transform="translate(72 205)">
      <rect width="250" height="46" rx="23" fill="${article.accent}" opacity="0.14" stroke="${article.accent}" stroke-width="2"/>
      <text x="125" y="31" text-anchor="middle" fill="${article.accent}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800" letter-spacing="1.4">${kicker}</text>
    </g>

    <g filter="url(#shadow)">
      <text x="72" y="340" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="900">${titleOne}</text>
      <text x="72" y="412" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="900">${titleTwo}</text>
    </g>

    <text x="74" y="468" fill="#cbdde7" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="500">${subtitle}</text>

    <g transform="translate(795 248)" filter="url(#shadow)">
      <rect x="0" y="0" width="310" height="246" rx="34" fill="#062938" stroke="${article.accent}" stroke-width="3" opacity="0.94"/>
      <path d="M66 182 L66 132 L105 132 L105 182 Z" fill="#16b9f2" opacity="0.92"/>
      <path d="M124 182 L124 98 L163 98 L163 182 Z" fill="${article.accent}" opacity="0.94"/>
      <path d="M182 182 L182 60 L221 60 L221 182 Z" fill="#f7b733" opacity="0.94"/>
      <path d="M55 190 H245" stroke="#9ec5d4" stroke-width="3" opacity="0.55"/>
      <path d="M60 86 C115 62 164 106 232 40" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="232" cy="40" r="9" fill="${article.accent}"/>
      <text x="155" y="224" text-anchor="middle" fill="#b8d2df" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">DATA · TRENDS · CONTEXT</text>
    </g>

    <rect x="72" y="550" width="1056" height="2" fill="#ffffff" opacity="0.12"/>
    <text x="72" y="590" fill="#8eb4c4" font-family="Arial, Helvetica, sans-serif" font-size="20">salonefuelmonitor.com</text>
    <text x="1128" y="590" text-anchor="end" fill="${article.accent}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">Transparency in every drop</text>
  </svg>`;
}

let generated = 0;
for (const article of ARTICLES) {
  const outputPath = path.join(socialDir, `${article.slug}.png`);
  await sharp(Buffer.from(socialSvg(article)))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
  generated += 1;
  console.log(`[SEO] Generated valid 1200x630 social image: ${article.slug}.png`);
}

console.log(`[SEO] Generated ${generated} branded authority-article social image(s).`);
