import React, { useState, useEffect } from 'react';
import { db, collection, doc, setDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from '../firebase';
import {
  Globe, Save, RefreshCw, CheckCircle, AlertTriangle, ExternalLink,
  Edit2, X, Clock, Database, Zap, Info
} from 'lucide-react';
import { toast } from 'sonner';
import {
  REGIONAL_COUNTRIES, RegionalCountry, FuelType, formatUSD, formatLocal
} from '../lib/regionalData';

type AdminCountryEntry = RegionalCountry & {
  petrolInput: string;
  dieselInput: string;
  keroseneInput: string;
  exchangeRateInput: string;
  isDirty: boolean;
};

// ─── CORS Proxy Chain ────────────────────────────────────────────────────────
// Proxies tried in order until one succeeds
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://corsproxy.org/?${encodeURIComponent(url)}`,
];

// ─── Multi-source config per country ─────────────────────────────────────────
interface ScrapeSource {
  label: string;
  url: string;
  /**
   * CSS selectors tried in order to find the price text in the fetched HTML.
   * The first element matching a parseable number wins.
   */
  priceSelectors: string[];
  /** Which fuel this source covers */
  fuelTypes: ('petrol' | 'diesel' | 'kerosene')[];
  /** Multiply the scraped value by this to get local currency price per litre */
  multiplier?: number;
}

interface CountryScrapeConfig {
  id: string;
  name: string;
  flag: string;
  sources: ScrapeSource[];
  isSierraLeone?: boolean;
}

const COUNTRY_SCRAPE_CONFIGS: CountryScrapeConfig[] = [
  {
    id: 'SL',
    name: 'Sierra Leone',
    flag: '🇸🇱',
    isSierraLeone: true,
    sources: [
      {
        label: 'GlobalPetrolPrices.com (Main)',
        url: 'https://www.globalpetrolprices.com/Sierra-Leone/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', 'td.highlighted', '.price'],
        fuelTypes: ['petrol', 'diesel', 'kerosene'],
      },
      {
        label: 'GlobalPetrolPrices.com (Petrol)',
        url: 'https://www.globalpetrolprices.com/Sierra-Leone/gasoline_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', 'td.highlighted', '.price'],
        fuelTypes: ['petrol'],
      },
      {
        label: 'GlobalPetrolPrices.com (Diesel)',
        url: 'https://www.globalpetrolprices.com/Sierra-Leone/diesel_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', 'td.highlighted', '.price'],
        fuelTypes: ['diesel'],
      },
    ],
  },
  {
    id: 'LR',
    name: 'Liberia',
    flag: '🇱🇷',
    sources: [
      {
        label: 'GlobalPetrolPrices.com (Main)',
        url: 'https://www.globalpetrolprices.com/Liberia/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', 'td.highlighted', '.price'],
        fuelTypes: ['petrol', 'diesel', 'kerosene'],
      },
      {
        label: 'GlobalPetrolPrices.com (Petrol)',
        url: 'https://www.globalpetrolprices.com/Liberia/gasoline_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', 'td.highlighted', '.price'],
        fuelTypes: ['petrol'],
      },
      {
        label: 'GlobalPetrolPrices.com (Diesel)',
        url: 'https://www.globalpetrolprices.com/Liberia/diesel_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['diesel'],
      },
    ],
  },
  {
    id: 'GN',
    name: 'Guinea',
    flag: '🇬🇳',
    sources: [
      {
        label: 'GlobalPetrolPrices.com (Main)',
        url: 'https://www.globalpetrolprices.com/Guinea/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol', 'diesel', 'kerosene'],
      },
      {
        label: 'GlobalPetrolPrices.com (Petrol)',
        url: 'https://www.globalpetrolprices.com/Guinea/gasoline_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol'],
      },
      {
        label: 'GlobalPetrolPrices.com (Diesel)',
        url: 'https://www.globalpetrolprices.com/Guinea/diesel_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['diesel'],
      },
    ],
  },
  {
    id: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    sources: [
      {
        label: 'GlobalPetrolPrices.com (Main)',
        url: 'https://www.globalpetrolprices.com/Ghana/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol', 'diesel', 'kerosene'],
      },
      {
        label: 'GlobalPetrolPrices.com (Petrol)',
        url: 'https://www.globalpetrolprices.com/Ghana/gasoline_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol'],
      },
      {
        label: 'GlobalPetrolPrices.com (Diesel)',
        url: 'https://www.globalpetrolprices.com/Ghana/diesel_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['diesel'],
      },
      {
        label: 'NPA Ghana',
        url: 'https://www.npa.gov.gh/fuel-prices/',
        priceSelectors: ['table td', '.price-table td', 'td', '.fuel-price', 'p'],
        fuelTypes: ['petrol', 'diesel'],
      },
    ],
  },
  {
    id: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    sources: [
      {
        label: 'GlobalPetrolPrices.com (Main)',
        url: 'https://www.globalpetrolprices.com/Nigeria/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol', 'diesel', 'kerosene'],
      },
      {
        label: 'GlobalPetrolPrices.com (Petrol)',
        url: 'https://www.globalpetrolprices.com/Nigeria/gasoline_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol'],
      },
      {
        label: 'GlobalPetrolPrices.com (Diesel)',
        url: 'https://www.globalpetrolprices.com/Nigeria/diesel_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['diesel'],
      },
      {
        label: 'PPPRA Nigeria',
        url: 'https://pppra.gov.ng/pump-price/',
        priceSelectors: ['.price', 'table td', 'strong', 'h3', 'p'],
        fuelTypes: ['petrol', 'diesel', 'kerosene'],
      },
    ],
  },
  {
    id: 'SN',
    name: 'Senegal',
    flag: '🇸🇳',
    sources: [
      {
        label: 'GlobalPetrolPrices.com (Main)',
        url: 'https://www.globalpetrolprices.com/Senegal/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol', 'diesel', 'kerosene'],
      },
      {
        label: 'GlobalPetrolPrices.com (Petrol)',
        url: 'https://www.globalpetrolprices.com/Senegal/gasoline_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol'],
      },
      {
        label: 'GlobalPetrolPrices.com (Diesel)',
        url: 'https://www.globalpetrolprices.com/Senegal/diesel_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['diesel'],
      },
    ],
  },
  {
    id: 'CI',
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    sources: [
      {
        label: 'GlobalPetrolPrices.com (Main)',
        url: 'https://www.globalpetrolprices.com/Ivory-Coast/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol', 'diesel', 'kerosene'],
      },
      {
        label: 'GlobalPetrolPrices.com (Petrol)',
        url: 'https://www.globalpetrolprices.com/Ivory-Coast/gasoline_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol'],
      },
      {
        label: 'GlobalPetrolPrices.com (Diesel)',
        url: 'https://www.globalpetrolprices.com/Ivory-Coast/diesel_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['diesel'],
      },
    ],
  },
  {
    id: 'GM',
    name: 'The Gambia',
    flag: '🇬🇲',
    sources: [
      {
        label: 'GlobalPetrolPrices.com (Main)',
        url: 'https://www.globalpetrolprices.com/Gambia/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol', 'diesel', 'kerosene'],
      },
      {
        label: 'GlobalPetrolPrices.com (Petrol)',
        url: 'https://www.globalpetrolprices.com/Gambia/gasoline_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['petrol'],
      },
      {
        label: 'GlobalPetrolPrices.com (Diesel)',
        url: 'https://www.globalpetrolprices.com/Gambia/diesel_prices/',
        priceSelectors: ['.price_big', 'h2.price', '.hero-price', '.price'],
        fuelTypes: ['diesel'],
      },
    ],
  },
];

// ─── Price scraper helpers ────────────────────────────────────────────────────

/**
 * Try each CORS proxy in turn. Returns the HTML text of the first success.
 */
async function fetchViaProxy(targetUrl: string): Promise<string | null> {
  for (const buildProxyUrl of CORS_PROXIES) {
    try {
      const res = await fetch(buildProxyUrl(targetUrl), {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 500) return text; // ignore empty/error pages
      }
    } catch { /* try next */ }
  }
  return null;
}

/**
 * Parse a price number from raw HTML using a list of CSS selectors.
 * Returns the first valid positive number found, or null.
 */
function extractPrice(html: string, selectors: string[]): { price: number; rawText: string } | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Try explicit CSS selectors
  for (const sel of selectors) {
    const elements = doc.querySelectorAll(sel);
    for (const el of elements) {
      const text = el.textContent?.trim() || '';
      const match = text.match(/([\d][\d\s,.]+)/);
      if (match) {
        const raw = match[1].replace(/[\s,]/g, '').replace(',', '.');
        const num = parseFloat(raw);
        if (num > 0 && num < 100_000_000) {
          return { price: num, rawText: text.slice(0, 60) };
        }
      }
    }
  }

  // 2. Try JSON-LD structured data
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const price = data?.offers?.price ?? data?.price;
      if (price && !isNaN(parseFloat(price))) {
        const num = parseFloat(price);
        if (num > 0) return { price: num, rawText: String(price) };
      }
    } catch { /* skip */ }
  }

  // 3. Search full text for price-like patterns (e.g. "GHS 14.50" or "₦1,350")
  const fullText = doc.body?.textContent || '';
  const broadMatch = fullText.match(/(?:price|petrol|diesel|gasoline)[^\d]{0,30}([\d][\d,.]+)/i);
  if (broadMatch) {
    const num = parseFloat(broadMatch[1].replace(',', '.'));
    if (num > 0 && num < 100_000_000) {
      return { price: num, rawText: broadMatch[0].slice(0, 60) };
    }
  }

  return null;
}

type ScrapeResult = {
  petrol?: number;
  diesel?: number;
  kerosene?: number;
  source?: string;
  status: 'success' | 'partial' | 'failed' | 'pending' | 'skipped';
};

export default function AdminRegionalPrices() {

  const [entries, setEntries] = useState<AdminCountryEntry[]>(() =>
    REGIONAL_COUNTRIES.map(c => ({
      ...c,
      petrolInput: String(c.prices.petrol),
      dieselInput: String(c.prices.diesel),
      keroseneInput: String(c.prices.kerosene),
      exchangeRateInput: String(c.exchangeRateToUSD),
      isDirty: false,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeLog, setScrapeLog] = useState<string[]>([]);
  const [lastScrapeTime, setLastScrapeTime] = useState<Date | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'manual' | 'scrape'>('manual');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedData, setSavedData] = useState<Record<string, any>>({});
  const [scrapeResults, setScrapeResults] = useState<Record<string, ScrapeResult>>({});
  const [slGovPrices, setSlGovPrices] = useState<Record<string, number> | null>(null);

  // World average prices state
  const [worldAvg, setWorldAvg] = useState({
    petrol:   '',
    diesel:   '',
    kerosene: '',
    asOfDate: new Date().toISOString().slice(0, 10),
  });
  const [isSavingWorldAvg, setIsSavingWorldAvg] = useState(false);
  const [worldAvgSaved, setWorldAvgSaved] = useState(false);

  // Load world average from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'world_average_prices', 'current'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setWorldAvg({
            petrol:   String(d.petrol   ?? ''),
            diesel:   String(d.diesel   ?? ''),
            kerosene: String(d.kerosene ?? ''),
            asOfDate: d.asOfDate ?? new Date().toISOString().slice(0, 10),
          });
        }
      },
      (err) => console.warn('Could not load world avg prices:', err)
    );
    return () => unsub();
  }, []);

  const handleSaveWorldAvg = async () => {
    setIsSavingWorldAvg(true);
    try {
      await setDoc(doc(db, 'world_average_prices', 'current'), {
        petrol:   parseFloat(worldAvg.petrol)   || null,
        diesel:   parseFloat(worldAvg.diesel)   || null,
        kerosene: parseFloat(worldAvg.kerosene) || null,
        asOfDate: worldAvg.asOfDate,
        updatedAt: serverTimestamp(),
      });
      setWorldAvgSaved(true);
      setTimeout(() => setWorldAvgSaved(false), 3000);
      toast.success('World average prices saved');
    } catch (err) {
      toast.error('Failed to save world average prices');
      console.error(err);
    } finally {
      setIsSavingWorldAvg(false);
    }
  };

  // Sync SL official prices from price_trends (same source as rest of app)
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'price_trends'), orderBy('effectiveDate', 'desc'), limit(1)),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const petrol   = data.petrolPrice || null;
          const diesel   = data.dieselPrice || null;
          const kerosene = data.kerosenePrice || null;
          if (petrol || diesel || kerosene) {
            setSlGovPrices({ petrol, diesel, kerosene });
            setEntries(prev => prev.map(e => {
              if (!e.isSierraLeone) return e;
              return {
                ...e,
                prices:       { petrol: petrol ?? e.prices.petrol, diesel: diesel ?? e.prices.diesel, kerosene: kerosene ?? e.prices.kerosene },
                petrolInput:   String(petrol   ?? e.prices.petrol),
                dieselInput:   String(diesel   ?? e.prices.diesel),
                keroseneInput: String(kerosene ?? e.prices.kerosene),
                isDirty: false,
              };
            }));
          }
        }
      },
      (err) => console.warn('Could not load SL gov prices:', err)
    );
    return () => unsub();
  }, []);

  // Load saved regional prices from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'regional_fuel_prices'),
      (snap) => {
        const data: Record<string, any> = {};
        snap.docs.forEach(d => {
          data[d.id] = d.data();
        });
        setSavedData(data);

        // Merge saved data into entries — but NEVER overwrite Sierra Leone's
        // fuel prices, which always come live from price_trends.
        // We DO allow SL's saved exchange rate override to be loaded.
        setEntries(prev => prev.map(e => {
          const saved = data[e.id];
          if (!saved) return e;
          if (e.isSierraLeone) {
            // Only apply exchange rate override for SL — fuel prices stay from price_trends
            return {
              ...e,
              exchangeRateInput: String(saved.exchangeRateToUSD ?? e.exchangeRateToUSD),
              isDirty: false,
            };
          }
          return {
            ...e,
            prices: {
              petrol: saved.petrol ?? e.prices.petrol,
              diesel: saved.diesel ?? e.prices.diesel,
              kerosene: saved.kerosene ?? e.prices.kerosene,
            },
            petrolInput: String(saved.petrol ?? e.prices.petrol),
            dieselInput: String(saved.diesel ?? e.prices.diesel),
            keroseneInput: String(saved.kerosene ?? e.prices.kerosene),
            exchangeRateInput: String(saved.exchangeRateToUSD ?? e.exchangeRateToUSD),
            isDirty: false,
          };
        }));
      },
      (err) => console.warn('Could not load regional prices:', err)
    );
    return () => unsub();
  }, []);

  const handleFieldChange = (id: string, field: keyof AdminCountryEntry, value: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, [field]: value, isDirty: true } : e
    ));
  };

  const handleSaveCountry = async (entry: AdminCountryEntry) => {
    setIsSaving(true);
    try {
      if (entry.isSierraLeone) {
        // For SL, only save the exchange rate override — fuel prices come from price_trends
        await setDoc(doc(db, 'regional_fuel_prices', entry.id), {
          countryId: entry.id,
          countryName: entry.name,
          exchangeRateToUSD: parseFloat(entry.exchangeRateInput) || entry.exchangeRateToUSD,
          currencyCode: entry.currencyCode,
          currencySymbol: entry.currencySymbol,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        await setDoc(doc(db, 'regional_fuel_prices', entry.id), {
          countryId: entry.id,
          countryName: entry.name,
          petrol: parseFloat(entry.petrolInput) || 0,
          diesel: parseFloat(entry.dieselInput) || 0,
          kerosene: parseFloat(entry.keroseneInput) || 0,
          exchangeRateToUSD: parseFloat(entry.exchangeRateInput) || entry.exchangeRateToUSD,
          currencyCode: entry.currencyCode,
          currencySymbol: entry.currencySymbol,
          updatedAt: serverTimestamp(),
        });
      }
      toast.success(`${entry.name} prices saved successfully`);
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isDirty: false } : e));
      setEditingId(null);
    } catch (err) {
      toast.error(`Failed to save ${entry.name} prices`);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };


  const handleSaveAll = async () => {
    const dirtyEntries = entries.filter(e => e.isDirty);
    if (dirtyEntries.length === 0) {
      toast.info('No changes to save');
      return;
    }
    setIsSaving(true);
    try {
      await Promise.all(dirtyEntries.map(entry =>
        entry.isSierraLeone
          // SL: only persist exchange rate override, not fuel prices
          ? setDoc(doc(db, 'regional_fuel_prices', entry.id), {
              countryId: entry.id,
              countryName: entry.name,
              exchangeRateToUSD: parseFloat(entry.exchangeRateInput) || entry.exchangeRateToUSD,
              currencyCode: entry.currencyCode,
              currencySymbol: entry.currencySymbol,
              updatedAt: serverTimestamp(),
            }, { merge: true })
          : setDoc(doc(db, 'regional_fuel_prices', entry.id), {
              countryId: entry.id,
              countryName: entry.name,
              petrol: parseFloat(entry.petrolInput) || 0,
              diesel: parseFloat(entry.dieselInput) || 0,
              kerosene: parseFloat(entry.keroseneInput) || 0,
              exchangeRateToUSD: parseFloat(entry.exchangeRateInput) || entry.exchangeRateToUSD,
              currencyCode: entry.currencyCode,
              currencySymbol: entry.currencySymbol,
              updatedAt: serverTimestamp(),
            })
      ));
      toast.success(`${dirtyEntries.length} countries updated successfully`);
      setEntries(prev => prev.map(e => ({ ...e, isDirty: false })));
    } catch (err) {
      toast.error('Failed to save some entries');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };


  // ── Real Multi-Source Scrape Engine ─────────────────────────────────────
  const handleScrape = async () => {
    setIsScraping(true);
    setScrapeLog([]);
    setScrapeResults({});
    const log: string[] = [];
    const results: Record<string, ScrapeResult> = {};

    const addLog = (line: string) => {
      log.push(line);
      setScrapeLog([...log]);
    };

    addLog(`[${ new Date().toLocaleTimeString()}] === Salone Fuel Monitor — Regional Price Scraper ===`);
    addLog(`[${ new Date().toLocaleTimeString()}] Searching ${COUNTRY_SCRAPE_CONFIGS.length} countries across ${CORS_PROXIES.length} CORS proxies...`);
    addLog('');

    for (const country of COUNTRY_SCRAPE_CONFIGS) {
      // Sierra Leone: always from Firebase
      if (country.isSierraLeone) {
        addLog(`[${ new Date().toLocaleTimeString()}] ${country.flag} ${country.name}: Using live Firebase data — skipping web scrape.`);
        results[country.id] = { status: 'skipped' };
        setScrapeResults({ ...results });
        continue;
      }

      addLog(`[${ new Date().toLocaleTimeString()}] ${country.flag} ${country.name}: Starting scrape (${country.sources.length} sources)...`);
      results[country.id] = { status: 'pending' };
      setScrapeResults({ ...results });

      let petrolFound: number | undefined;
      let dieselFound: number | undefined;
      let bestSource = '';

      for (const source of country.sources) {
        addLog(`  -> Trying: ${source.label} (${source.url})`);

        const html = await fetchViaProxy(source.url);

        if (!html) {
          addLog(`  -> Proxy chain exhausted for ${source.label} — blocked or unreachable.`);
          continue;
        }

        const extracted = extractPrice(html, source.priceSelectors);

        if (extracted) {
          addLog(`  -> Found: "${extracted.rawText.trim()}" => ${extracted.price} (${source.label})`);
          if (source.fuelTypes.includes('petrol') && !petrolFound) {
            petrolFound = extracted.price;
            bestSource = source.url;
          }
          if (source.fuelTypes.includes('diesel') && !dieselFound) {
            dieselFound = extracted.price;
          }
        } else {
          addLog(`  -> No parseable price found on ${source.label}.`);
        }
      }

      const hasAny = petrolFound !== undefined || dieselFound !== undefined;

      if (hasAny) {
        // Estimate kerosene as ~85% of petrol price (common regional ratio)
        const keroseneEst = petrolFound ? Math.round(petrolFound * 0.85) : undefined;

        results[country.id] = {
          petrol: petrolFound,
          diesel: dieselFound,
          kerosene: keroseneEst,
          source: bestSource,
          status: (petrolFound && dieselFound) ? 'success' : 'partial',
        };
        setScrapeResults({ ...results });

        // Auto-save to Firestore
        const entry = entries.find(e => e.id === country.id);
        if (entry) {
          try {
            await setDoc(doc(db, 'regional_fuel_prices', country.id), {
              countryId: country.id,
              countryName: country.name,
              petrol: petrolFound ?? parseFloat(entry.petrolInput),
              diesel: dieselFound ?? parseFloat(entry.dieselInput),
              kerosene: keroseneEst ?? parseFloat(entry.keroseneInput),
              exchangeRateToUSD: parseFloat(entry.exchangeRateInput) || entry.exchangeRateToUSD,
              currencyCode: entry.currencyCode,
              currencySymbol: entry.currencySymbol,
              scrapedFrom: bestSource,
              updatedAt: serverTimestamp(),
            });
            addLog(`  -> Saved to database.`);
          } catch (err) {
            addLog(`  -> DB save failed: ${String(err)}`);
          }
        }
      } else {
        results[country.id] = { status: 'failed' };
        setScrapeResults({ ...results });
        addLog(`  -> Could not retrieve prices for ${country.name}. Admin manual entry required.`);
      }

      addLog('');
    }

    const succeeded = Object.values(results).filter(r => r.status === 'success' || r.status === 'partial').length;
    const failed    = Object.values(results).filter(r => r.status === 'failed').length;

    addLog(`[${ new Date().toLocaleTimeString()}] === Scrape complete: ${succeeded} updated, ${failed} failed ===`);
    setLastScrapeTime(new Date());
    setIsScraping(false);
    if (succeeded > 0) toast.success(`${succeeded} countries updated from web scrape`);
    if (failed > 0) toast.warning(`${failed} countries need manual entry`);
  };

  const dirtyCount = entries.filter(e => e.isDirty).length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900">Regional Fuel Prices</h2>
            <p className="text-sm text-gray-500">Manage fuel price data for West African comparison engine</p>
          </div>
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit mb-6">
        <button
          onClick={() => setActiveSubTab('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeSubTab === 'manual' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Database className="w-4 h-4" /> Manual Entry
        </button>
        <button
          onClick={() => setActiveSubTab('scrape')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeSubTab === 'scrape' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" /> Auto Scrape
        </button>
      </div>

      {/* ── Option A: Manual Entry ── */}
      {activeSubTab === 'manual' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {dirtyCount > 0 && (
                <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold">
                  {dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || dirtyCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Changes
            </button>
          </div>

          {/* World Average Prices Card */}
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden mb-4">
            <div className="flex items-center justify-between p-4 border-b border-blue-100 bg-blue-50">
              <div>
                <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  World Average Fuel Prices
                </h3>
                <p className="text-xs text-blue-600 mt-0.5">Reference benchmark shown on the public comparison page (USD per litre)</p>
              </div>
              <button
                onClick={handleSaveWorldAvg}
                disabled={isSavingWorldAvg}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSavingWorldAvg
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : worldAvgSaved
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <Save className="w-3.5 h-3.5" />
                }
                {worldAvgSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">As Of Date</label>
                <input
                  type="date"
                  value={worldAvg.asOfDate}
                  onChange={e => setWorldAvg(prev => ({ ...prev, asOfDate: e.target.value }))}
                  className="w-full text-sm font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
              </div>
              {/* Petrol */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">Petrol (USD/L)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={worldAvg.petrol}
                    onChange={e => setWorldAvg(prev => ({ ...prev, petrol: e.target.value }))}
                    placeholder="1.330"
                    className="w-full pl-6 pr-3 py-2 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                  />
                </div>
              </div>
              {/* Diesel */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1.5">Diesel (USD/L)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={worldAvg.diesel}
                    onChange={e => setWorldAvg(prev => ({ ...prev, diesel: e.target.value }))}
                    placeholder="1.270"
                    className="w-full pl-6 pr-3 py-2 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                </div>
              </div>
              {/* Kerosene */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1.5">Kerosene (USD/L)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={worldAvg.kerosene}
                    onChange={e => setWorldAvg(prev => ({ ...prev, kerosene: e.target.value }))}
                    placeholder="1.100"
                    className="w-full pl-6 pr-3 py-2 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
            {worldAvg.petrol && worldAvg.diesel && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-400">
                  World avg as of <strong>{new Date(worldAvg.asOfDate + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</strong>:
                  &nbsp;Petrol <strong className="text-emerald-700">${worldAvg.petrol}/L</strong>
                  &nbsp;· Diesel <strong className="text-blue-700">${worldAvg.diesel}/L</strong>
                  {worldAvg.kerosene && <>&nbsp;· Kerosene <strong className="text-amber-700">${worldAvg.kerosene}/L</strong></>}
                </p>
              </div>
            )}
          </div>

          {/* SL note */}
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 text-xs text-emerald-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>Sierra Leone</strong> prices are managed via the <em>Price Trends Management</em> tab and read automatically from the live database.
              You can still override the exchange rate here.
            </p>
          </div>

          <div className="space-y-3">
            {entries.map(entry => {
              const isEditing = editingId === entry.id;
              const saved = savedData[entry.id];
              return (
                <div
                  key={entry.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    entry.isDirty ? 'border-amber-300' : 'border-gray-200'
                  } ${entry.isSierraLeone ? 'ring-2 ring-emerald-200' : ''}`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{entry.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-surface-900 text-sm">{entry.name}</p>
                          {entry.isSierraLeone && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">LIVE DATA</span>
                          )}
                          {entry.isDirty && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">UNSAVED</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{entry.currencyCode} ({entry.currencySymbol})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {saved && !isEditing && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Saved
                        </span>
                      )}
                      <button
                        onClick={() => setEditingId(isEditing ? null : entry.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                      >
                        {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                      {isEditing && (
                        <button
                          onClick={() => handleSaveCountry(entry)}
                          disabled={isSaving || !entry.isDirty}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prices display / edit row */}
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['Petrol', 'Diesel', 'Kerosene'] as const).map(fuel => {
                        const key = `${fuel.toLowerCase()}Input` as 'petrolInput' | 'dieselInput' | 'keroseneInput';
                        const priceKey = fuel.toLowerCase() as FuelType;
                        const usd = parseFloat(entry[key]) / (parseFloat(entry.exchangeRateInput) || entry.exchangeRateToUSD);
                        return (
                          <div key={fuel} className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{fuel}</p>
                            {isEditing && !entry.isSierraLeone ? (
                              <input
                                type="number"
                                value={entry[key]}
                                onChange={(e) => handleFieldChange(entry.id, key, e.target.value)}
                                className="w-full text-sm font-bold bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                placeholder="0"
                              />
                            ) : (
                              <p className="text-sm font-bold text-surface-900">
                                {formatLocal(parseFloat(entry[key]) || entry.prices[priceKey], entry.currencySymbol)}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">{formatUSD(usd)}</p>
                          </div>
                        );
                      })}
                      {/* Exchange Rate */}
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">Rate (per $1)</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={entry.exchangeRateInput}
                            onChange={(e) => handleFieldChange(entry.id, 'exchangeRateInput', e.target.value)}
                            className="w-full text-sm font-bold bg-white border border-blue-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                            placeholder="0"
                          />
                        ) : (
                          <p className="text-sm font-bold text-blue-700">
                            {parseFloat(entry.exchangeRateInput).toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-blue-400 mt-0.5">{entry.currencyCode}/USD</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Option B: Auto Scrape ── */}
      {activeSubTab === 'scrape' && (
        <div>
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-blue-800 mb-1">Multi-Source Web Scraper</p>
              <p className="text-blue-700">
                Searches <strong>GlobalPetrolPrices.com</strong> and government fuel authority pages
                for each country using a CORS proxy chain. Sierra Leone always reads from the live
                Firebase database. Prices are auto-saved on success.
                Kerosene is estimated at 85% of petrol when not directly available.
              </p>
            </div>
          </div>

          {/* Reference List of Supported Targets */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
            <h3 className="font-bold text-surface-900 text-sm mb-3">Supported Scrape Targets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              
              {/* Main Links */}
              <div>
                <p className="font-semibold text-gray-700 mb-2">Countries on GlobalPetrolPrices.com</p>
                <ul className="space-y-1">
                  <li><a href="https://www.globalpetrolprices.com/Sierra-Leone/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Sierra-Leone</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Nigeria/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Nigeria</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Ghana/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ghana</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Senegal/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Senegal</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Liberia/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Liberia</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Guinea/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Guinea</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Ivory-Coast/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ivory-Coast</a></li>
                </ul>
              </div>

              {/* Gasoline Links */}
              <div>
                <p className="font-semibold text-gray-700 mb-2">Gasoline prices</p>
                <ol className="space-y-1 list-decimal list-inside text-gray-600">
                  <li><a href="https://www.globalpetrolprices.com/Sierra-Leone/gasoline_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Sierra-Leone/gasoline_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Ghana/gasoline_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Ghana/gasoline_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Ivory-Coast/gasoline_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Ivory-Coast/gasoline_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Senegal/gasoline_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Senegal/gasoline_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Liberia/gasoline_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Liberia/gasoline_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Guinea/gasoline_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Guinea/gasoline_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Nigeria/gasoline_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Nigeria/gasoline_prices/</a></li>
                </ol>
              </div>

              {/* Diesel Links */}
              <div>
                <p className="font-semibold text-gray-700 mb-2">Diesel prices</p>
                <ol className="space-y-1 list-decimal list-inside text-gray-600">
                  <li><a href="https://www.globalpetrolprices.com/Nigeria/diesel_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Nigeria/diesel_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Ghana/diesel_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Ghana/diesel_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Sierra-Leone/diesel_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Sierra-Leone/diesel_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Ivory-Coast/diesel_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Ivory-Coast/diesel_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Senegal/diesel_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Senegal/diesel_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Liberia/diesel_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Liberia/diesel_prices/</a></li>
                  <li><a href="https://www.globalpetrolprices.com/Guinea/diesel_prices/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline">Guinea/diesel_prices/</a></li>
                </ol>
              </div>

            </div>
          </div>

          {/* Per-country results grid */}
          {Object.keys(scrapeResults).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-surface-900 text-sm">Scrape Results</h3>
                  <p className="text-xs text-gray-400">Latest prices retrieved per country</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {Object.values(scrapeResults).filter(r => r.status === 'success').length} success
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {Object.values(scrapeResults).filter(r => r.status === 'partial').length} partial
                  </span>
                  <span className="flex items-center gap-1 text-red-500 font-bold">
                    <X className="w-3.5 h-3.5" />
                    {Object.values(scrapeResults).filter(r => r.status === 'failed').length} failed
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {COUNTRY_SCRAPE_CONFIGS.map(cfg => {
                  const result = scrapeResults[cfg.id];
                  const entry = entries.find(e => e.id === cfg.id);
                  if (!result) return null;

                  const statusStyle =
                    result.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                    result.status === 'partial'  ? 'bg-amber-100 text-amber-700' :
                    result.status === 'skipped'  ? 'bg-blue-100 text-blue-600' :
                    result.status === 'pending'  ? 'bg-gray-100 text-gray-500' :
                                                   'bg-red-100 text-red-600';
                  const statusLabel =
                    result.status === 'success' ? '✓ Updated' :
                    result.status === 'partial'  ? '~ Partial' :
                    result.status === 'skipped'  ? '⬡ Live DB' :
                    result.status === 'pending'  ? '… Scanning' :
                                                   '✗ Failed';

                  return (
                    <div key={cfg.id} className="flex items-center justify-between px-4 py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{cfg.flag}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-900">{cfg.name}</p>
                          <div className="flex flex-col gap-0.5 mt-1">
                            {cfg.sources.map((s, idx) => (
                              <a
                                key={idx}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 truncate"
                              >
                                <span className="font-medium text-gray-500">[{s.label}]</span>
                                {s.url.replace('https://www.', '')}
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Prices found */}
                        {(result.petrol || result.diesel) && entry && (
                          <div className="flex gap-2 text-xs font-mono">
                            {result.petrol && (
                              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg font-bold">
                                P: {entry.currencyCode} {result.petrol.toLocaleString()}
                              </span>
                            )}
                            {result.diesel && (
                              <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg font-bold">
                                D: {entry.currencyCode} {result.diesel.toLocaleString()}
                              </span>
                            )}
                            {result.kerosene && (
                              <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg font-bold hidden sm:inline">
                                K: {entry.currencyCode} {result.kerosene.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trigger button */}
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={handleScrape}
              disabled={isScraping}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20"
            >
              {isScraping
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning the web...</>
                : <><Zap className="w-4 h-4" /> Fetch Latest Prices</>
              }
            </button>
            {lastScrapeTime && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Last run: {lastScrapeTime.toLocaleString()}
              </p>
            )}
          </div>

          {/* Live terminal log */}
          {scrapeLog.length > 0 && (
            <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
              {/* Terminal header bar */}
              <div className="bg-gray-900 px-4 py-2 flex items-center gap-2 border-b border-gray-800">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-3 text-xs text-gray-400 font-mono">sfm-scraper — bash</span>
              </div>
              <div className="bg-surface-900 p-4 font-mono text-xs space-y-0.5 max-h-80 overflow-y-auto">
                {scrapeLog.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line === '' ? 'h-2' :
                      line.includes('===') ? 'text-emerald-400 font-bold' :
                      line.includes('-> Found') ? 'text-emerald-300' :
                      line.includes('-> Saved') ? 'text-emerald-500' :
                      line.includes('exhausted') || line.includes('Failed') || line.includes('failed') ? 'text-red-400' :
                      line.includes('-> Trying') ? 'text-blue-300' :
                      line.includes('Searching') || line.includes('Starting') ? 'text-amber-300' :
                      line.includes('Firebase') || line.includes('skipping') ? 'text-blue-400' :
                      line.includes('No parseable') || line.includes('manual entry') ? 'text-gray-500' :
                      'text-gray-300'
                    }
                  >
                    {line || '\u00a0'}
                  </div>
                ))}
                {isScraping && (
                  <div className="text-emerald-400 animate-pulse">▌</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
