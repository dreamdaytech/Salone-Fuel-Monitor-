// ─── Market Intelligence Types & Utilities ────────────────────────────────────
// Handles crude oil prices (Alpha Vantage) and SL economic indicators (World Bank)

export interface CrudeOilPrices {
  brent: number | null;
  brentChange: number | null;      // % change from previous period
  wti: number | null;
  wtiChange: number | null;
  opec: number | null;
  opecChange: number | null;
  fetchedAt: string;               // ISO date string
}

export interface EconomicIndicators {
  cpiInflation: number | null;     // FP.CPI.TOTL.ZG — annual %
  gdpGrowth: number | null;        // NY.GDP.MKTP.KD.ZG — annual %
  fuelImportPct: number | null;    // TM.VAL.FUEL.ZS.UN — % of merchandise imports
  gdpPerCapita: number | null;     // NY.GDP.PCAP.CD — USD
  dataYear: number | null;         // Year the data applies to
  fetchedAt: string;
}

export interface MarketIntelligenceData {
  crudeOil: CrudeOilPrices;
  economic: EconomicIndicators;
  lastUpdated: string;             // ISO date string
}

// ─── Alpha Vantage ────────────────────────────────────────────────────────────
const AV_BASE = 'https://www.alphavantage.co/query';

interface AVDataPoint {
  date: string;
  value: string;
}

async function fetchAlphaVantage(
  fn: 'BRENT' | 'WTI',
  apiKey: string
): Promise<{ latest: number; change: number } | null> {
  try {
    const url = `${AV_BASE}?function=${fn}&interval=monthly&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // Alpha Vantage returns { "data": [{date, value}, ...] } sorted newest first
    const data: AVDataPoint[] = json?.data ?? [];
    if (data.length < 2) return null;

    const latest = parseFloat(data[0].value);
    const previous = parseFloat(data[1].value);
    if (isNaN(latest) || isNaN(previous)) return null;

    const change = Number((((latest - previous) / previous) * 100).toFixed(2));
    return { latest, change };
  } catch (err) {
    console.warn(`Alpha Vantage [${fn}] fetch failed:`, err);
    return null;
  }
}

export async function fetchCrudeOilPrices(apiKey: string): Promise<CrudeOilPrices> {
  const [brentResult, wtiResult] = await Promise.all([
    fetchAlphaVantage('BRENT', apiKey),
    fetchAlphaVantage('WTI', apiKey),
  ]);

  return {
    brent: brentResult?.latest ?? null,
    brentChange: brentResult?.change ?? null,
    wti: wtiResult?.latest ?? null,
    wtiChange: wtiResult?.change ?? null,
    opec: null,   // Manual entry only
    opecChange: null,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── World Bank API ───────────────────────────────────────────────────────────
const WB_BASE = 'https://api.worldbank.org/v2/country/SLE/indicator';
const WB_PARAMS = '?format=json&mrv=5&per_page=5';

async function fetchWorldBankIndicator(indicatorCode: string): Promise<{ value: number; date: string } | null> {
  try {
    const url = `${WB_BASE}/${indicatorCode}${WB_PARAMS}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // World Bank returns [metadata, data_array]
    const dataArray: any[] = json?.[1] ?? [];

    // Find the most recent non-null entry
    const valid = dataArray.find((d: any) => d.value !== null);
    if (!valid) return null;

    return {
      value: Number(parseFloat(valid.value).toFixed(2)),
      date: valid.date,
    };
  } catch (err) {
    console.warn(`World Bank [${indicatorCode}] fetch failed:`, err);
    return null;
  }
}

export async function fetchEconomicIndicators(): Promise<EconomicIndicators> {
  const [cpi, gdp, fuelImport, gdpPerCap] = await Promise.all([
    fetchWorldBankIndicator('FP.CPI.TOTL.ZG'),
    fetchWorldBankIndicator('NY.GDP.MKTP.KD.ZG'),
    fetchWorldBankIndicator('TM.VAL.FUEL.ZS.UN'),
    fetchWorldBankIndicator('NY.GDP.PCAP.CD'),
  ]);

  const years = [cpi, gdp, fuelImport, gdpPerCap]
    .filter(Boolean)
    .map(d => parseInt(d!.date));
  const dataYear = years.length > 0 ? Math.max(...years) : null;

  return {
    cpiInflation: cpi?.value ?? null,
    gdpGrowth: gdp?.value ?? null,
    fuelImportPct: fuelImport?.value ?? null,
    gdpPerCapita: gdpPerCap?.value ?? null,
    dataYear,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Smart "Why Prices Changed" Correlation ───────────────────────────────────
export interface PriceCorrelationMessage {
  level: 'warning' | 'info' | 'positive';
  message: string;
}

export function computePriceCorrelation(
  crudeOil: CrudeOilPrices | null
): PriceCorrelationMessage | null {
  if (!crudeOil) return null;

  const brentChange = crudeOil.brentChange;
  const wtiChange = crudeOil.wtiChange;

  const primaryChange = brentChange ?? wtiChange;
  if (primaryChange === null) return null;

  const absChange = Math.abs(primaryChange);
  const oilName = brentChange !== null ? 'Brent Crude' : 'WTI Crude';

  if (primaryChange > 5) {
    return {
      level: 'warning',
      message: `${oilName} rose ${primaryChange.toFixed(1)}% last month. This typically leads to higher fuel prices at the pump within 2–4 weeks as import costs increase.`,
    };
  } else if (primaryChange > 2) {
    return {
      level: 'info',
      message: `${oilName} increased ${primaryChange.toFixed(1)}% last month. Slight upward pressure on pump prices may follow.`,
    };
  } else if (primaryChange < -5) {
    return {
      level: 'positive',
      message: `${oilName} fell ${absChange.toFixed(1)}% last month. This may lead to lower fuel prices at the pump in the coming weeks.`,
    };
  } else if (primaryChange < -2) {
    return {
      level: 'positive',
      message: `${oilName} dropped ${absChange.toFixed(1)}% last month. Downward pressure on fuel prices may follow.`,
    };
  }

  return {
    level: 'info',
    message: `Global oil prices are relatively stable (${oilName}: ${primaryChange > 0 ? '+' : ''}${primaryChange.toFixed(1)}% last month). No major price shocks are expected in the short term.`,
  };
}
