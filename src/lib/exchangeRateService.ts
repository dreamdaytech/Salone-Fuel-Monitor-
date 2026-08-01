/**
 * Exchange Rate Service
 * Uses Open Exchange Rates (OER) API — key is NEVER stored in public Firestore.
 * The API key is stored in admin-only `settings/api_keys` in Firestore.
 * Public pages read pre-cached rates from `exchange_rates/current`.
 * Only the Admin Dashboard fetches live rates (reading key from secure doc first).
 */

export interface ExchangeRateResponse {
  result: 'success' | 'error';
  base_code: string;
  time_last_update_utc: string;
  time_next_update_utc: string;
  rates: Record<string, number>;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  flag: string;
  symbol?: string;
}

/** Shape stored in Firestore `exchange_rates/current` (no secrets) */
export interface ExchangeRateCache {
  rates: Record<string, number>;       // USD-based rates from OER
  overrides: Record<string, number>;   // Admin manual overrides e.g. { SLE: 23.80 }
  time_last_update_utc: string;
  fetchedAt: string;
}

const SESSION_CACHE_PREFIX = 'sfm_exchange_';
const SESSION_CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface SessionCacheEntry {
  data: ExchangeRateResponse;
  fetchedAt: number;
}

function getSessionCached(base: string): ExchangeRateResponse | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + base);
    if (!raw) return null;
    const entry: SessionCacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt < SESSION_CACHE_DURATION_MS) {
      return entry.data;
    }
    sessionStorage.removeItem(SESSION_CACHE_PREFIX + base);
  } catch {
    // ignore
  }
  return null;
}

function setSessionCache(base: string, data: ExchangeRateResponse): void {
  try {
    const entry: SessionCacheEntry = { data, fetchedAt: Date.now() };
    sessionStorage.setItem(SESSION_CACHE_PREFIX + base, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

/**
 * Build an ExchangeRateResponse from a Firestore cache document.
 * Used by the PUBLIC Exchange Rates page — no API key needed.
 */
export function buildResponseFromCache(
  cache: ExchangeRateCache,
  base: string = 'USD'
): ExchangeRateResponse {
  const mergedRates = { ...cache.rates, ...cache.overrides };

  if (base === 'USD') {
    return {
      result: 'success',
      base_code: 'USD',
      time_last_update_utc: cache.time_last_update_utc,
      time_next_update_utc: cache.time_last_update_utc,
      rates: mergedRates,
    };
  }

  const baseRate = mergedRates[base];
  if (!baseRate) {
    throw new Error(`Requested base currency ${base} is not in the cached rates.`);
  }
  const crossRates: Record<string, number> = {};
  for (const [currency, rate] of Object.entries(mergedRates)) {
    crossRates[currency] = rate / baseRate;
  }
  return {
    result: 'success',
    base_code: base,
    time_last_update_utc: cache.time_last_update_utc,
    time_next_update_utc: cache.time_last_update_utc,
    rates: crossRates,
  };
}

/**
 * Fetch live exchange rates directly from OER using an admin-provided API key.
 * ONLY called from the Admin Dashboard after reading the key from `settings/api_keys`.
 * Returns a cache-ready object with NO API key included — safe to store in Firestore.
 */
export async function fetchExchangeRatesFromOER(
  apiKey: string,
  overrides: Record<string, number> = {}
): Promise<ExchangeRateCache> {
  if (!apiKey) {
    throw new Error('Open Exchange Rates API key is required.');
  }

  const response = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${apiKey}`
  );
  if (!response.ok) {
    throw new Error(`OER API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const dateStr = new Date(data.timestamp * 1000).toUTCString();

  return {
    rates: data.rates as Record<string, number>,
    overrides,
    time_last_update_utc: dateStr,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch exchange rates using an admin-provided API key and return a full response.
 * Uses session cache to avoid redundant API calls during admin session.
 */
export async function fetchExchangeRates(
  base: string = 'USD',
  apiKey: string = '',
  overrides: Record<string, number> = {}
): Promise<ExchangeRateResponse> {
  if (!apiKey) {
    throw new Error('Open Exchange Rates API key is missing.');
  }

  const cached = getSessionCached(base);
  if (cached) {
    return { ...cached, rates: { ...cached.rates, ...overrides } };
  }

  const cacheDoc = await fetchExchangeRatesFromOER(apiKey, overrides);
  const response = buildResponseFromCache(cacheDoc, base);
  setSessionCache(base, response);
  return response;
}

/** Full list of 160+ currencies with names and flag emojis */
export const CURRENCY_LIST: CurrencyInfo[] = [
  { code: 'SLE', name: 'Sierra Leonean Leone', flag: '🇸🇱', symbol: 'Le' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭', symbol: '₵' },
  { code: 'LRD', name: 'Liberian Dollar', flag: '🇱🇷', symbol: '$' },
  { code: 'GMD', name: 'Gambian Dalasi', flag: '🇬🇲', symbol: 'D' },
  { code: 'GNF', name: 'Guinean Franc', flag: '🇬🇳', symbol: 'Fr' },
  { code: 'MRU', name: 'Mauritanian Ouguiya', flag: '🇲🇷', symbol: 'UM' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', symbol: 'R' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', symbol: 'KSh' },
  { code: 'ETB', name: 'Ethiopian Birr', flag: '🇪🇹', symbol: 'Br' },
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿', symbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬', symbol: 'USh' },
  { code: 'GHC', name: 'Ghanaian Cedi (old)', flag: '🇬🇭', symbol: '₵' },
  { code: 'MAD', name: 'Moroccan Dirham', flag: '🇲🇦', symbol: 'د.م.' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬', symbol: '£' },
  { code: 'DZD', name: 'Algerian Dinar', flag: '🇩🇿', symbol: 'د.ج' },
  { code: 'TND', name: 'Tunisian Dinar', flag: '🇹🇳', symbol: 'د.ت' },
  { code: 'XOF', name: 'West African CFA Franc', flag: '🌍', symbol: 'Fr' },
  { code: 'XAF', name: 'Central African CFA Franc', flag: '🌍', symbol: 'Fr' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷', symbol: 'R$' },
  { code: 'ARS', name: 'Argentine Peso', flag: '🇦🇷', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', flag: '🇨🇱', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', flag: '🇨🇴', symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', flag: '🇵🇪', symbol: 'S/' },
  { code: 'VES', name: 'Venezuelan Bolívar', flag: '🇻🇪', symbol: 'Bs.S' },
  { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', flag: '🇩🇰', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', flag: '🇵🇱', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', flag: '🇨🇿', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', flag: '🇭🇺', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', flag: '🇷🇴', symbol: 'lei' },
  { code: 'HRK', name: 'Croatian Kuna', flag: '🇭🇷', symbol: 'kn' },
  { code: 'BGN', name: 'Bulgarian Lev', flag: '🇧🇬', symbol: 'лв' },
  { code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺', symbol: '₽' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', flag: '🇺🇦', symbol: '₴' },
  { code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷', symbol: '₺' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', symbol: '﷼' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', symbol: 'د.إ' },
  { code: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', flag: '🇰🇼', symbol: 'د.ك' },
  { code: 'BHD', name: 'Bahraini Dinar', flag: '🇧🇭', symbol: '.د.ب' },
  { code: 'OMR', name: 'Omani Rial', flag: '🇴🇲', symbol: '﷼' },
  { code: 'JOD', name: 'Jordanian Dinar', flag: '🇯🇴', symbol: 'JD' },
  { code: 'LBP', name: 'Lebanese Pound', flag: '🇱🇧', symbol: '£' },
  { code: 'ILS', name: 'Israeli New Shekel', flag: '🇮🇱', symbol: '₪' },
  { code: 'PKR', name: 'Pakistani Rupee', flag: '🇵🇰', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', flag: '🇧🇩', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', flag: '🇱🇰', symbol: '₨' },
  { code: 'NPR', name: 'Nepalese Rupee', flag: '🇳🇵', symbol: '₨' },
  { code: 'MMK', name: 'Myanmar Kyat', flag: '🇲🇲', symbol: 'K' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭', symbol: '฿' },
  { code: 'VND', name: 'Vietnamese Dong', flag: '🇻🇳', symbol: '₫' },
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾', symbol: 'RM' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$' },
  { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭', symbol: '₱' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷', symbol: '₩' },
  { code: 'TWD', name: 'Taiwan Dollar', flag: '🇹🇼', symbol: 'NT$' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', symbol: 'NZ$' },
  { code: 'ISK', name: 'Icelandic Króna', flag: '🇮🇸', symbol: 'kr' },
  { code: 'MZN', name: 'Mozambican Metical', flag: '🇲🇿', symbol: 'MT' },
  { code: 'AOA', name: 'Angolan Kwanza', flag: '🇦🇴', symbol: 'Kz' },
  { code: 'ZMW', name: 'Zambian Kwacha', flag: '🇿🇲', symbol: 'ZK' },
  { code: 'BWP', name: 'Botswana Pula', flag: '🇧🇼', symbol: 'P' },
  { code: 'NAD', name: 'Namibian Dollar', flag: '🇳🇦', symbol: 'N$' },
  { code: 'MWK', name: 'Malawian Kwacha', flag: '🇲🇼', symbol: 'MK' },
  { code: 'RWF', name: 'Rwandan Franc', flag: '🇷🇼', symbol: 'Fr' },
  { code: 'BIF', name: 'Burundian Franc', flag: '🇧🇮', symbol: 'Fr' },
  { code: 'DJF', name: 'Djiboutian Franc', flag: '🇩🇯', symbol: 'Fr' },
  { code: 'SCR', name: 'Seychellois Rupee', flag: '🇸🇨', symbol: '₨' },
  { code: 'MUR', name: 'Mauritian Rupee', flag: '🇲🇺', symbol: '₨' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', flag: '🇲🇻', symbol: 'Rf' },
  { code: 'PGK', name: 'Papua New Guinean Kina', flag: '🇵🇬', symbol: 'K' },
  { code: 'FJD', name: 'Fijian Dollar', flag: '🇫🇯', symbol: 'FJ$' },
  { code: 'SBD', name: 'Solomon Islands Dollar', flag: '🇸🇧', symbol: 'SI$' },
  { code: 'WST', name: 'Samoan Tala', flag: '🇼🇸', symbol: 'WS$' },
  { code: 'TOP', name: 'Tongan Paʻanga', flag: '🇹🇴', symbol: 'T$' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', flag: '🇬🇹', symbol: 'Q' },
  { code: 'BZD', name: 'Belize Dollar', flag: '🇧🇿', symbol: 'BZ$' },
  { code: 'HNL', name: 'Honduran Lempira', flag: '🇭🇳', symbol: 'L' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', flag: '🇳🇮', symbol: 'C$' },
  { code: 'CRC', name: 'Costa Rican Colón', flag: '🇨🇷', symbol: '₡' },
  { code: 'PAB', name: 'Panamanian Balboa', flag: '🇵🇦', symbol: 'B/.' },
  { code: 'DOP', name: 'Dominican Peso', flag: '🇩🇴', symbol: '$' },
  { code: 'HTG', name: 'Haitian Gourde', flag: '🇭🇹', symbol: 'G' },
  { code: 'JMD', name: 'Jamaican Dollar', flag: '🇯🇲', symbol: 'J$' },
  { code: 'TTD', name: 'Trinidad & Tobago Dollar', flag: '🇹🇹', symbol: 'TT$' },
  { code: 'BBD', name: 'Barbadian Dollar', flag: '🇧🇧', symbol: 'Bds$' },
  { code: 'XCD', name: 'East Caribbean Dollar', flag: '🏝️', symbol: 'EC$' },
  { code: 'GYD', name: 'Guyanese Dollar', flag: '🇬🇾', symbol: 'GY$' },
  { code: 'SRD', name: 'Surinamese Dollar', flag: '🇸🇷', symbol: '$' },
  { code: 'BOB', name: 'Bolivian Boliviano', flag: '🇧🇴', symbol: 'Bs.' },
  { code: 'PYG', name: 'Paraguayan Guaraní', flag: '🇵🇾', symbol: '₲' },
  { code: 'UYU', name: 'Uruguayan Peso', flag: '🇺🇾', symbol: '$U' },
  { code: 'ECU', name: 'Ecuadorian Sucre', flag: '🇪🇨', symbol: 'S/.' },
  { code: 'KZT', name: 'Kazakhstani Tenge', flag: '🇰🇿', symbol: '₸' },
  { code: 'UZS', name: 'Uzbekistani Som', flag: '🇺🇿', symbol: 'лв' },
  { code: 'GEL', name: 'Georgian Lari', flag: '🇬🇪', symbol: '₾' },
  { code: 'AMD', name: 'Armenian Dram', flag: '🇦🇲', symbol: '֏' },
  { code: 'AZN', name: 'Azerbaijani Manat', flag: '🇦🇿', symbol: '₼' },
  { code: 'BYN', name: 'Belarusian Ruble', flag: '🇧🇾', symbol: 'Br' },
  { code: 'MDL', name: 'Moldovan Leu', flag: '🇲🇩', symbol: 'L' },
  { code: 'MKD', name: 'North Macedonian Denar', flag: '🇲🇰', symbol: 'ден' },
  { code: 'ALL', name: 'Albanian Lek', flag: '🇦🇱', symbol: 'L' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', flag: '🇧🇦', symbol: 'KM' },
  { code: 'RSD', name: 'Serbian Dinar', flag: '🇷🇸', symbol: 'din.' },
  { code: 'AFN', name: 'Afghan Afghani', flag: '🇦🇫', symbol: '؋' },
  { code: 'IRR', name: 'Iranian Rial', flag: '🇮🇷', symbol: '﷼' },
  { code: 'IQD', name: 'Iraqi Dinar', flag: '🇮🇶', symbol: 'ع.د' },
  { code: 'SYP', name: 'Syrian Pound', flag: '🇸🇾', symbol: '£' },
  { code: 'YER', name: 'Yemeni Rial', flag: '🇾🇪', symbol: '﷼' },
  { code: 'CDF', name: 'Congolese Franc', flag: '🇨🇩', symbol: 'Fr' },
  { code: 'SDG', name: 'Sudanese Pound', flag: '🇸🇩', symbol: '£' },
  { code: 'ERN', name: 'Eritrean Nakfa', flag: '🇪🇷', symbol: 'Nfk' },
  { code: 'SOS', name: 'Somali Shilling', flag: '🇸🇴', symbol: 'Sh' },
  { code: 'CVE', name: 'Cape Verdean Escudo', flag: '🇨🇻', symbol: '$' },
  { code: 'STN', name: 'São Tomé & Príncipe Dobra', flag: '🇸🇹', symbol: 'Db' },
  { code: 'KMF', name: 'Comorian Franc', flag: '🇰🇲', symbol: 'Fr' },
  { code: 'MGA', name: 'Malagasy Ariary', flag: '🇲🇬', symbol: 'Ar' },
  { code: 'LSL', name: 'Lesotho Loti', flag: '🇱🇸', symbol: 'L' },
  { code: 'SZL', name: 'Swazi Lilangeni', flag: '🇸🇿', symbol: 'L' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', flag: '🇿🇼', symbol: 'Z$' },
  { code: 'MNT', name: 'Mongolian Tögrög', flag: '🇲🇳', symbol: '₮' },
  { code: 'KHR', name: 'Cambodian Riel', flag: '🇰🇭', symbol: '៛' },
  { code: 'LAK', name: 'Lao Kip', flag: '🇱🇦', symbol: '₭' },
  { code: 'BND', name: 'Brunei Dollar', flag: '🇧🇳', symbol: 'B$' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', flag: '🇧🇹', symbol: 'Nu' },
  { code: 'KGS', name: 'Kyrgyzstani Som', flag: '🇰🇬', symbol: 'лв' },
  { code: 'TJS', name: 'Tajikistani Somoni', flag: '🇹🇯', symbol: 'SM' },
  { code: 'TMT', name: 'Turkmenistani Manat', flag: '🇹🇲', symbol: 'T' },
];

/** Get currency info by code, fallback to a generic entry */
export function getCurrencyInfo(code: string): CurrencyInfo {
  return (
    CURRENCY_LIST.find((c) => c.code === code) ?? {
      code,
      name: code,
      flag: '🌐',
    }
  );
}

/** Pinned "highlight" currencies shown in the quick-reference cards */
export const HIGHLIGHT_PAIRS: Array<{ from: string; to: string; label: string }> = [
  { from: 'USD', to: 'SLE', label: 'US Dollar → SLE' },
  { from: 'EUR', to: 'SLE', label: 'Euro → SLE' },
  { from: 'GBP', to: 'SLE', label: 'British Pound → SLE' },
  { from: 'SLE', to: 'USD', label: 'SLE → US Dollar' },
];
