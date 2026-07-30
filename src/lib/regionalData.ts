/**
 * Regional Fuel Comparison Data
 * 
 * Provides mock data, exchange rates, and calculation utilities
 * for comparing fuel prices across West African countries.
 * 
 * Sierra Leone's live data is fetched from Firebase at runtime.
 * All other countries use admin-managed or mock data.
 */

export interface RegionalFuelPrices {
  petrol: number;   // in local currency
  diesel: number;   // in local currency
  kerosene: number; // in local currency
}

export interface RegionalCountry {
  id: string;
  name: string;
  flag: string;      // emoji flag
  capital: string;
  currency: string;  // full name
  currencyCode: string;
  currencySymbol: string;
  exchangeRateToUSD: number; // how many local units = 1 USD
  prices: RegionalFuelPrices;
  lastUpdated: string; // ISO date string
  sourceUrl: string;   // reference URL for price data
  lat: number;         // map center latitude
  lng: number;         // map center longitude
  isSierraLeone?: boolean;
}

// July 2026 exchange rates (local currency per 1 USD)
// These are approximate and should be updated via admin panel
export const REGIONAL_COUNTRIES: RegionalCountry[] = [
  {
    id: 'SL',
    name: 'Sierra Leone',
    flag: '🇸🇱',
    capital: 'Freetown',
    currency: 'Sierra Leonean Leone',
    currencyCode: 'SLE',
    // NLe = New Leone (redenominated 2022: 1 NLe = 1000 old leones)
    currencySymbol: 'NLe',
    exchangeRateToUSD: 22.5, // approx Jul 2026: 1 USD ≈ 22.5 NLe
    prices: {
      // Fallback prices in NLe (new leones) — overridden at runtime from Firebase government_prices/current
      petrol:   33,   // NLe per litre
      diesel:   35,   // NLe per litre
      kerosene: 37,   // NLe per litre
    },
    lastUpdated: new Date().toISOString(),
    sourceUrl: 'https://www.npa.gov.sl',
    lat: 8.4657,
    lng: -11.7799,
    isSierraLeone: true,
  },
  {
    id: 'LR',
    name: 'Liberia',
    flag: '🇱🇷',
    capital: 'Monrovia',
    currency: 'Liberian Dollar',
    currencyCode: 'LRD',
    currencySymbol: 'L$',
    exchangeRateToUSD: 193.5,
    prices: {
      petrol: 820,
      diesel: 790,
      kerosene: 680,
    },
    lastUpdated: '2026-07-25',
    sourceUrl: 'https://www.lprc.com.lr',
    lat: 6.4281,
    lng: -9.4295,
  },
  {
    id: 'GN',
    name: 'Guinea',
    flag: '🇬🇳',
    capital: 'Conakry',
    currency: 'Guinean Franc',
    currencyCode: 'GNF',
    currencySymbol: 'GF',
    exchangeRateToUSD: 8650,
    prices: {
      petrol: 37000,
      diesel: 34000,
      kerosene: 30000,
    },
    lastUpdated: '2026-07-22',
    sourceUrl: 'https://www.hydrocarbures-guinee.gov.gn',
    lat: 11.8636,
    lng: -15.1767,
  },
  {
    id: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    capital: 'Accra',
    currency: 'Ghanaian Cedi',
    currencyCode: 'GHS',
    currencySymbol: '₵',
    exchangeRateToUSD: 15.2,
    prices: {
      petrol: 18.5,
      diesel: 17.9,
      kerosene: 14.2,
    },
    lastUpdated: '2026-07-28',
    sourceUrl: 'https://www.npa.gov.gh',
    lat: 7.9465,
    lng: -1.0232,
  },
  {
    id: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    capital: 'Abuja',
    currency: 'Nigerian Naira',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    exchangeRateToUSD: 1580,
    prices: {
      petrol: 1350,
      diesel: 1430,
      kerosene: 1200,
    },
    lastUpdated: '2026-07-26',
    sourceUrl: 'https://pppra.gov.ng',
    lat: 9.082,
    lng: 8.6753,
  },
  {
    id: 'SN',
    name: 'Senegal',
    flag: '🇸🇳',
    capital: 'Dakar',
    currency: 'West African CFA Franc',
    currencyCode: 'XOF',
    currencySymbol: 'CFA',
    exchangeRateToUSD: 613,
    prices: {
      petrol: 965,
      diesel: 890,
      kerosene: 740,
    },
    lastUpdated: '2026-07-20',
    sourceUrl: 'https://www.sipe.sn',
    lat: 14.4974,
    lng: -14.4524,
  },
  {
    id: 'CI',
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    capital: 'Abidjan',
    currency: 'West African CFA Franc',
    currencyCode: 'XOF',
    currencySymbol: 'CFA',
    exchangeRateToUSD: 613,
    prices: {
      petrol: 900,
      diesel: 835,
      kerosene: 710,
    },
    lastUpdated: '2026-07-21',
    sourceUrl: 'https://www.petroci.ci',
    lat: 7.5399,
    lng: -5.5471,
  },
  {
    id: 'GM',
    name: 'The Gambia',
    flag: '🇬🇲',
    capital: 'Banjul',
    currency: 'Gambian Dalasi',
    currencyCode: 'GMD',
    currencySymbol: 'D',
    exchangeRateToUSD: 71.5,
    prices: {
      petrol: 95,
      diesel: 88,
      kerosene: 78,
    },
    lastUpdated: '2026-07-23',
    sourceUrl: 'https://www.gna.gm',
    lat: 13.4432,
    lng: -15.3101,
  },
];

// --- Calculation Utilities ---

/**
 * Convert a local price to USD equivalent.
 */
export function toUSD(localPrice: number, exchangeRate: number): number {
  return localPrice / exchangeRate;
}

/**
 * Calculate the percentage difference relative to Sierra Leone.
 * Positive = more expensive than SL, Negative = cheaper than SL.
 */
export function diffVsSierraLeone(
  countryUSD: number,
  slUSD: number
): number {
  if (!slUSD) return 0;
  return ((countryUSD - slUSD) / slUSD) * 100;
}

export type FuelType = 'petrol' | 'diesel' | 'kerosene';

export interface ComputedCountry extends RegionalCountry {
  petrolUSD: number;
  dieselUSD: number;
  keroseneUSD: number;
  petrolDiffPct: number;
  dieselDiffPct: number;
  keroseneDiffPct: number;
  rank: number; // ranked by selected fuel USD price (1 = cheapest)
}

/**
 * Enrich all countries with USD prices, diff vs SL, and ranking.
 * @param countries - array of regional countries (Sierra Leone's prices should be live)
 * @param fuelType - the fuel type to rank by
 */
export function computeRegionalData(
  countries: RegionalCountry[],
  fuelType: FuelType = 'petrol'
): ComputedCountry[] {
  const sl = countries.find(c => c.isSierraLeone);

  const enriched: ComputedCountry[] = countries.map(c => {
    const petrolUSD = toUSD(c.prices.petrol, c.exchangeRateToUSD);
    const dieselUSD = toUSD(c.prices.diesel, c.exchangeRateToUSD);
    const keroseneUSD = toUSD(c.prices.kerosene, c.exchangeRateToUSD);

    const slPetrolUSD = sl ? toUSD(sl.prices.petrol, sl.exchangeRateToUSD) : 0;
    const slDieselUSD = sl ? toUSD(sl.prices.diesel, sl.exchangeRateToUSD) : 0;
    const slKeroseneUSD = sl ? toUSD(sl.prices.kerosene, sl.exchangeRateToUSD) : 0;

    return {
      ...c,
      petrolUSD,
      dieselUSD,
      keroseneUSD,
      petrolDiffPct: diffVsSierraLeone(petrolUSD, slPetrolUSD),
      dieselDiffPct: diffVsSierraLeone(dieselUSD, slDieselUSD),
      keroseneDiffPct: diffVsSierraLeone(keroseneUSD, slKeroseneUSD),
      rank: 0, // set below
    };
  });

  // Rank by selected fuel (lowest USD = rank 1, 0 is pushed to bottom)
  const fuelKey = `${fuelType}USD` as 'petrolUSD' | 'dieselUSD' | 'keroseneUSD';
  const sorted = [...enriched].sort((a, b) => {
    const valA = a[fuelKey];
    const valB = b[fuelKey];
    if (valA === 0 && valB !== 0) return 1;
    if (valB === 0 && valA !== 0) return -1;
    return valA - valB;
  });
  sorted.forEach((c, i) => {
    const original = enriched.find(e => e.id === c.id);
    if (original) original.rank = i + 1;
  });

  return enriched;
}

/** Mock historical data (last 6 months) for Line Chart */
export function getMockHistoricalData(countries: RegionalCountry[], fuelType: FuelType) {
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  return months.map((month, i) => {
    const entry: Record<string, any> = { month };
    countries.forEach(c => {
      const baseUSD = toUSD(c.prices[fuelType], c.exchangeRateToUSD);
      // Simulate slight variation per month
      const variance = 1 + (Math.sin(i * c.id.charCodeAt(0)) * 0.08);
      entry[c.name] = parseFloat((baseUSD * variance).toFixed(3));
    });
    return entry;
  });
}

/** Assign a color to a country for charts */
const COUNTRY_COLORS: Record<string, string> = {
  SL: '#10B981', // primary green (Sierra Leone)
  LR: '#3B82F6',
  GN: '#F59E0B',
  GH: '#EF4444',
  NG: '#8B5CF6',
  SN: '#EC4899',
  CI: '#F97316',
  GM: '#06B6D4',
};

export function getCountryColor(id: string): string {
  return COUNTRY_COLORS[id] || '#64748B';
}

/** Format USD with 3 decimal places */
export function formatUSD(val: number): string {
  return `$${val.toFixed(3)}`;
}

/** Format local price with currency symbol */
export function formatLocal(val: number, symbol: string): string {
  if (val >= 1000) {
    return `${symbol} ${val.toLocaleString()}`;
  }
  return `${symbol} ${val.toFixed(2)}`;
}

/** Get rank medal emoji */
export function getRankMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}
