export const SITE_URL = 'https://salonefuelmonitor.com';
export const SITE_NAME = 'Salone Fuel Monitor';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const ROUTE_SEO = {
  '/': {
    title: 'Fuel Prices in Sierra Leone Today | Salone Fuel Monitor',
    description: 'Check current petrol, diesel and kerosene prices in Sierra Leone, find fuel stations, compare West Africa prices, view trends and track global oil.',
    heading: 'Fuel Prices in Sierra Leone Today',
    intro: 'Track official petrol, diesel and kerosene prices in Sierra Leone, compare historical changes, find fuel stations and understand how local pump prices compare with West Africa and global oil markets.',
    schemaType: 'WebPage',
    changefreq: 'daily',
    priority: '1.0',
    index: true,
  },
  '/stations': {
    title: 'Fuel Stations in Sierra Leone | Salone Fuel Monitor',
    description: 'Find fuel stations in Freetown and across Sierra Leone, compare available fuels and station information, and check the latest official pump-price context.',
    heading: 'Fuel Stations in Sierra Leone',
    intro: 'Browse fuel stations across Sierra Leone and use Salone Fuel Monitor to compare station information with the latest official petrol, diesel and kerosene price updates.',
    schemaType: 'CollectionPage',
    changefreq: 'daily',
    priority: '0.9',
    index: true,
  },
  '/price-trends': {
    title: 'Sierra Leone Fuel Price History | Salone Fuel Monitor',
    description: 'Explore Sierra Leone petrol, diesel and kerosene price history by effective date with charts, tables and official fuel-price trend records.',
    heading: 'Sierra Leone Fuel Price History and Trends',
    intro: 'Explore official fuel price changes in Sierra Leone by effective date, including petrol, diesel and kerosene. Compare historical movements using interactive charts and detailed price records.',
    schemaType: 'Dataset',
    changefreq: 'daily',
    priority: '0.95',
    index: true,
  },
  '/transport-prices': {
    title: 'Transport Fares in Sierra Leone | Salone Fuel Monitor',
    description: 'Check transport fares and route prices in Sierra Leone. Compare official and monitored transport costs alongside changing fuel prices.',
    heading: 'Transport Fares in Sierra Leone',
    intro: 'Check transport fares and route prices across Sierra Leone and understand how transport costs move alongside fuel-price changes.',
    schemaType: 'CollectionPage',
    changefreq: 'weekly',
    priority: '0.8',
    index: true,
  },
  '/regional-comparison': {
    title: 'West Africa Fuel Prices Comparison | Salone Fuel Monitor',
    description: 'Compare petrol and diesel prices across West Africa, including Sierra Leone, Liberia, Guinea, Ghana, Nigeria, Senegal, Côte d’Ivoire and The Gambia.',
    heading: 'West Africa Fuel Prices Comparison',
    intro: 'Compare fuel prices across West Africa and see where Sierra Leone stands against neighbouring and regional markets.',
    schemaType: 'Dataset',
    changefreq: 'weekly',
    priority: '0.9',
    index: true,
  },
  '/barrel-vs-fuel': {
    title: 'Global Oil vs Sierra Leone Pump Prices | Salone Fuel Monitor',
    description: 'Compare Brent, WTI and OPEC crude oil movements with Sierra Leone petrol and diesel pump-price changes to understand local fuel-price adjustments.',
    heading: 'Global Oil Prices vs Sierra Leone Pump Prices',
    intro: 'Track global crude oil movements and compare them with Sierra Leone pump-price adjustments to better understand how international oil markets relate to local fuel costs.',
    schemaType: 'Dataset',
    changefreq: 'weekly',
    priority: '0.85',
    index: true,
  },
  '/market-intelligence': {
    title: 'Sierra Leone Fuel Market Intelligence | Salone Fuel Monitor',
    description: 'Explore Sierra Leone fuel market intelligence, price signals, supply context and data insights for petrol, diesel, kerosene and related energy trends.',
    heading: 'Sierra Leone Fuel Market Intelligence',
    intro: 'Explore fuel-market data and price signals for Sierra Leone, including local pump-price context, regional comparisons and global market indicators.',
    schemaType: 'Dataset',
    changefreq: 'weekly',
    priority: '0.8',
    index: true,
  },
  '/exchange-rates': {
    title: 'Sierra Leone Exchange Rates for Fuel Analysis | Salone Fuel Monitor',
    description: 'Track exchange rates relevant to Sierra Leone fuel-price analysis and compare currency movements used in regional and global fuel-market calculations.',
    heading: 'Exchange Rates for Sierra Leone Fuel Analysis',
    intro: 'Track exchange rates used to understand regional and international fuel-price comparisons involving Sierra Leone.',
    schemaType: 'WebPage',
    changefreq: 'daily',
    priority: '0.7',
    index: true,
  },
  '/calculator': {
    title: 'Fuel Cost Calculator Sierra Leone | Salone Fuel Monitor',
    description: 'Calculate fuel costs in Sierra Leone using petrol and diesel prices. Estimate litres, trip costs and fuel spending with Salone Fuel Monitor.',
    heading: 'Fuel Cost Calculator for Sierra Leone',
    intro: 'Estimate fuel spending and trip costs using Sierra Leone fuel-price data and simple litre, distance and cost calculations.',
    schemaType: 'WebPage',
    changefreq: 'monthly',
    priority: '0.7',
    index: true,
  },
  '/transport-trends': {
    title: 'Sierra Leone Transport Fare Trends | Salone Fuel Monitor',
    description: 'Explore historical transport fare changes in Sierra Leone and compare route-price movements with changing fuel costs.',
    heading: 'Sierra Leone Transport Fare Trends',
    intro: 'Explore historical transport fare changes across Sierra Leone and compare route-cost movements over time.',
    schemaType: 'Dataset',
    changefreq: 'weekly',
    priority: '0.7',
    index: true,
  },
  '/blog': {
    title: 'Sierra Leone Fuel News & Analysis | Salone Fuel Monitor',
    description: 'Read Sierra Leone fuel-price news, market analysis, regional comparisons and explainers from Salone Fuel Monitor.',
    heading: 'Sierra Leone Fuel News and Analysis',
    intro: 'Read fuel-price updates, market analysis, regional comparisons and explainers focused on Sierra Leone and West Africa.',
    schemaType: 'CollectionPage',
    changefreq: 'weekly',
    priority: '0.8',
    index: true,
  },
  '/about': {
    title: 'About Salone Fuel Monitor | Fuel Price Transparency Sierra Leone',
    description: 'Learn about Salone Fuel Monitor, an independent public-interest platform improving fuel-price transparency and access to energy-market information in Sierra Leone.',
    heading: 'About Salone Fuel Monitor',
    intro: 'Salone Fuel Monitor is a public-interest fuel-price transparency platform focused on making official and monitored fuel information easier to access in Sierra Leone.',
    schemaType: 'AboutPage',
    changefreq: 'monthly',
    priority: '0.6',
    index: true,
  },
  '/contact': {
    title: 'Contact Salone Fuel Monitor',
    description: 'Contact Salone Fuel Monitor for fuel-price information, corrections, station data, partnerships, media enquiries or platform support in Sierra Leone.',
    heading: 'Contact Salone Fuel Monitor',
    intro: 'Get in touch with Salone Fuel Monitor about fuel-price data, station information, corrections, partnerships or platform support.',
    schemaType: 'ContactPage',
    changefreq: 'monthly',
    priority: '0.5',
    index: true,
  },
  '/donate': {
    title: 'Support Salone Fuel Monitor',
    description: 'Support Salone Fuel Monitor and help sustain independent fuel-price transparency, public data access and market information in Sierra Leone.',
    heading: 'Support Salone Fuel Monitor',
    intro: 'Support independent fuel-price transparency and public access to fuel and transport market information in Sierra Leone.',
    schemaType: 'WebPage',
    changefreq: 'monthly',
    priority: '0.4',
    index: true,
  },
  '/terms': {
    title: 'Terms of Service | Salone Fuel Monitor',
    description: 'Read the Salone Fuel Monitor terms of service.',
    heading: 'Terms of Service',
    intro: 'Terms governing the use of Salone Fuel Monitor.',
    schemaType: 'WebPage',
    index: false,
  },
  '/privacy': {
    title: 'Privacy Policy | Salone Fuel Monitor',
    description: 'Read the Salone Fuel Monitor privacy policy.',
    heading: 'Privacy Policy',
    intro: 'Information about how Salone Fuel Monitor handles privacy and personal information.',
    schemaType: 'WebPage',
    index: false,
  },
  '/cookies': {
    title: 'Cookie Policy | Salone Fuel Monitor',
    description: 'Read the Salone Fuel Monitor cookie policy.',
    heading: 'Cookie Policy',
    intro: 'Information about cookie use on Salone Fuel Monitor.',
    schemaType: 'WebPage',
    index: false,
  },
};

export const STATIC_ARTICLE_SEO = {
  '/blog/the-true-cost-of-diesel-in-sierra-leone-a-regional-perspective': {
    title: 'Diesel Price in Sierra Leone | Salone Fuel Monitor',
    description: 'Explore Sierra Leone diesel prices in a West African context and understand how local diesel costs compare with selected neighbouring markets.',
    heading: 'The True Cost of Diesel in Sierra Leone: A Regional Perspective',
    intro: 'A regional perspective on diesel prices in Sierra Leone and how local costs compare with other West African markets.',
    schemaType: 'Article',
    changefreq: 'monthly',
    priority: '0.75',
    index: true,
  },
  '/blog/barrel-vs-fuel-price-tracker-sierra-leone-2026': {
    title: 'Barrel vs Pump Prices in Sierra Leone | Salone Fuel Monitor',
    description: 'Track global crude oil against Sierra Leone pump-price changes in 2026 and compare international oil trends with local fuel adjustments.',
    heading: 'Barrel vs Fuel Price Tracker Sierra Leone 2026',
    intro: 'Track global crude oil movements alongside Sierra Leone pump-price changes and compare international market trends with local fuel adjustments.',
    schemaType: 'Article',
    changefreq: 'monthly',
    priority: '0.75',
    index: true,
  },
  '/blog/introducing-salone-fuel-monitor-bringing-fuel-price-transparency-to-sierra-leone': {
    title: 'Introducing Salone Fuel Monitor | Sierra Leone',
    description: 'Learn why Salone Fuel Monitor was created and how the platform improves access to fuel prices, station information and market transparency in Sierra Leone.',
    heading: 'Introducing Salone Fuel Monitor',
    intro: 'Learn how Salone Fuel Monitor improves access to fuel-price information, station data and market transparency in Sierra Leone.',
    schemaType: 'Article',
    changefreq: 'monthly',
    priority: '0.7',
    index: true,
  },
  '/blog/regional-fuel-comparison-where-does-sierra-leone-stand-after-the-september-price-increase': {
    title: 'Sierra Leone Fuel Prices vs West Africa | September 2026',
    description: 'Compare Sierra Leone fuel prices with selected West African markets after the September 2026 price increase and review the regional context.',
    heading: 'Regional Fuel Comparison: Where Does Sierra Leone Stand After the September Price Increase?',
    intro: 'Review Sierra Leone fuel prices after the September 2026 adjustment and compare the country with selected West African markets.',
    schemaType: 'Article',
    changefreq: 'monthly',
    priority: '0.8',
    index: true,
  },
  '/blog/sierra-leone-fuel-prices-rise-again-petrol-hits-nle-40-and-diesel-nle-45-in-september-2026': {
    title: 'Sierra Leone Fuel Prices Rise Again | September 2026',
    description: 'Review the September 2026 Sierra Leone fuel-price increase, including petrol and diesel changes, effective-date context and related market analysis.',
    heading: 'Sierra Leone Fuel Prices Rise Again: Petrol Hits NLe 40 and Diesel NLe 45 in September 2026',
    intro: 'Review the September 2026 Sierra Leone fuel-price increase and the official price changes for petrol and diesel.',
    schemaType: 'Article',
    changefreq: 'monthly',
    priority: '0.85',
    index: true,
  },
  '/blog/barrel-vs-pump-do-sierra-leone-s-fuel-price-adjustments-follow-global-oil-movements': {
    title: 'Sierra Leone Fuel Prices vs Global Oil | Salone Fuel Monitor',
    description: 'Compare Sierra Leone fuel-price adjustments with global crude-oil movements and explore how international oil trends relate to local pump prices.',
    heading: 'Barrel vs. Pump: Do Sierra Leone’s Fuel Price Adjustments Follow Global Oil Movements?',
    intro: 'Compare Sierra Leone pump-price adjustments with global crude-oil movements and examine how international trends relate to local fuel prices.',
    schemaType: 'Article',
    changefreq: 'monthly',
    priority: '0.8',
    index: true,
  },
  '/blog/barrel-vs-fuel-price-tracker-are-global-savings-reaching-the-pump': {
    title: 'Barrel vs Fuel Price Tracker | Sierra Leone',
    description: 'Compare global crude-oil movements with Sierra Leone pump prices and explore whether changes in international oil costs are reflected locally.',
    heading: 'Barrel vs Fuel Price Tracker: Are Global Savings Reaching the Pump?',
    intro: 'Track international crude-oil movements alongside Sierra Leone pump prices and compare changes in global and local fuel costs.',
    schemaType: 'Article',
    changefreq: 'monthly',
    priority: '0.75',
    index: true,
  },
  '/blog/analyzing-the-cost-of-diesel-why-sierra-leone-pays-more-than-its-neighbors': {
    title: 'Sierra Leone Diesel Cost vs Neighbours | Salone Fuel Monitor',
    description: 'Explore why Sierra Leone diesel costs differ from selected neighbouring markets and compare regional fuel-price context across West Africa.',
    heading: 'Analyzing the Cost of Diesel: Why Sierra Leone Pays More Than Its Neighbors',
    intro: 'Compare Sierra Leone diesel costs with selected neighbouring markets and review the regional factors behind price differences.',
    schemaType: 'Article',
    changefreq: 'monthly',
    priority: '0.75',
    index: true,
  },
  '/blog/the-regional-reality-why-sierra-leone-s-fuel-price-remains-a-heavy-burden-and-how-to-fix-it': {
    title: 'Sierra Leone Fuel Price Burden | Regional Analysis',
    description: 'Explore Sierra Leone fuel prices in a regional context and examine the economic pressures, market structure and policy questions surrounding pump costs.',
    heading: "The Regional Reality: Why Sierra Leone's Fuel Price Remains a Heavy Burden (And How to Fix It)",
    intro: 'Examine Sierra Leone fuel prices in a regional context and review the economic and market pressures surrounding local pump costs.',
    schemaType: 'Article',
    changefreq: 'monthly',
    priority: '0.75',
    index: true,
  },
};

export const SEO_NAV_LINKS = [
  ['/', 'Fuel Prices Today'],
  ['/price-trends', 'Fuel Price History'],
  ['/stations', 'Fuel Stations'],
  ['/regional-comparison', 'West Africa Comparison'],
  ['/barrel-vs-fuel', 'Oil vs Pump Prices'],
  ['/transport-prices', 'Transport Fares'],
  ['/blog', 'Fuel News & Analysis'],
];

export function normalizePathname(pathname = '/') {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function getSeoForPath(pathname = '/') {
  const clean = normalizePathname(pathname);
  return ROUTE_SEO[clean] || STATIC_ARTICLE_SEO[clean] || null;
}

export function isPrivateOrUtilityPath(pathname = '/') {
  const clean = normalizePathname(pathname);
  return clean === '/login' ||
    clean === '/signup' ||
    clean === '/register' ||
    clean === '/profile' ||
    clean === '/onboarding' ||
    clean === '/location-picker' ||
    clean === '/dashboard' ||
    clean === '/my-garage' ||
    clean === '/donate/success' ||
    clean === '/donate/cancel' ||
    clean.startsWith('/admin');
}
