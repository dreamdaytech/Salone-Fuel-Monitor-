import React, { useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc } from '../firebase';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Save, Key, Globe,
  BarChart2, Fuel, AlertTriangle, Info,
  Activity, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchCrudeOilPrices,
  fetchEconomicIndicators,
  computePriceCorrelation,
  MarketIntelligenceData,
  CrudeOilPrices,
  EconomicIndicators,
} from '../lib/marketIntelligence';

// ─── Helper ───────────────────────────────────────────────────────────────────
function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="text-xs text-gray-400">—</span>;
  const isPos = change > 0;
  const isNeg = change < 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
      isPos ? 'bg-red-50 text-red-600' : isNeg ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {change > 0 ? '+' : ''}{change.toFixed(2)}%
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminMarketIntelligence() {
  const [data, setData] = useState<MarketIntelligenceData | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isFetchingOil, setIsFetchingOil] = useState(false);
  const [isFetchingEcon, setIsFetchingEcon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local editable state
  const [crudeEdit, setCrudeEdit] = useState<Partial<CrudeOilPrices>>({});
  const [econEdit, setEconEdit] = useState<Partial<EconomicIndicators>>({});

  // ── Load saved data from Firebase (two separate docs) ──
  useEffect(() => {
    // 1. Load market intelligence data (admin-only doc)
    const unsubMI = onSnapshot(
      doc(db, 'market_intelligence', 'current'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as MarketIntelligenceData;
          setData(d);
          setCrudeEdit({
            brent: d.crudeOil?.brent ?? undefined,
            brentChange: d.crudeOil?.brentChange ?? undefined,
            wti: d.crudeOil?.wti ?? undefined,
            wtiChange: d.crudeOil?.wtiChange ?? undefined,
            opec: d.crudeOil?.opec ?? undefined,
            opecChange: d.crudeOil?.opecChange ?? undefined,
          });
          setEconEdit({
            cpiInflation: d.economic?.cpiInflation ?? undefined,
            gdpGrowth: d.economic?.gdpGrowth ?? undefined,
            fuelImportPct: d.economic?.fuelImportPct ?? undefined,
            gdpPerCapita: d.economic?.gdpPerCapita ?? undefined,
            dataYear: d.economic?.dataYear ?? undefined,
          });
        }
      },
      (err) => console.warn('Market intelligence load error:', err)
    );

    // 2. Load API keys from admin-only settings doc
    const unsubKeys = onSnapshot(
      doc(db, 'settings', 'api_keys'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setApiKey(d.alphaVantageKey ?? '');
        }
      },
      (err) => console.warn('API keys load error:', err)
    );

    return () => { unsubMI(); unsubKeys(); };
  }, []);

  // ── Fetch live crude oil prices ──
  const handleFetchOil = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Alpha Vantage API key first.');
      return;
    }
    setIsFetchingOil(true);
    try {
      const result = await fetchCrudeOilPrices(apiKey.trim());
      if (result.brent === null && result.wti === null) {
        toast.error('Could not fetch oil prices. Check your API key or try again.');
        return;
      }
      setCrudeEdit(prev => ({
        ...prev,
        brent: result.brent ?? prev.brent,
        brentChange: result.brentChange ?? prev.brentChange,
        wti: result.wti ?? prev.wti,
        wtiChange: result.wtiChange ?? prev.wtiChange,
      }));
      toast.success('Brent & WTI prices fetched successfully!');
    } catch (err) {
      toast.error('Failed to fetch oil prices.');
    } finally {
      setIsFetchingOil(false);
    }
  };

  // ── Fetch economic indicators ──
  const handleFetchEcon = async () => {
    setIsFetchingEcon(true);
    try {
      const result = await fetchEconomicIndicators();
      setEconEdit({
        cpiInflation: result.cpiInflation ?? undefined,
        gdpGrowth: result.gdpGrowth ?? undefined,
        fuelImportPct: result.fuelImportPct ?? undefined,
        gdpPerCapita: result.gdpPerCapita ?? undefined,
        dataYear: result.dataYear ?? undefined,
      });
      toast.success(`Economic indicators fetched (${result.dataYear} data)`);
    } catch (err) {
      toast.error('Failed to fetch economic indicators from World Bank.');
    } finally {
      setIsFetchingEcon(false);
    }
  };

  // ── Fetch live OER exchange rates and store safely ──
  const handleFetchOerRates = async () => {
    if (!oerApiKey.trim()) {
      toast.error('Please enter your OER API key and save it first.');
      return;
    }
    const overrides: Record<string, number> = {};
    if (sleOverride.trim()) {
      const parsed = parseFloat(sleOverride);
      if (!isNaN(parsed)) overrides.SLE = parsed;
    }
    try {
      toast.loading('Fetching live rates from OER...', { id: 'oer-fetch' });
      const cache = await fetchExchangeRatesFromOER(oerApiKey.trim(), overrides);
      // Save ONLY the rate data (no API key) to the public document
      await setDoc(doc(db, 'exchange_rates', 'current'), cache);
      toast.success('Exchange rates refreshed and cached successfully!', { id: 'oer-fetch' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch exchange rates.', { id: 'oer-fetch' });
    }
  };

  // ── Save API key and market data ──
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save Alpha Vantage key to admin-only settings doc
      await setDoc(doc(db, 'settings', 'api_keys'), {
        alphaVantageKey: apiKey.trim(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // 2. Save market intelligence data (no keys)
      await setDoc(doc(db, 'market_intelligence', 'current'), {
        lastUpdated: new Date().toISOString(),
        crudeOil: {
          brent: crudeEdit.brent ?? null,
          brentChange: crudeEdit.brentChange ?? null,
          wti: crudeEdit.wti ?? null,
          wtiChange: crudeEdit.wtiChange ?? null,
          opec: crudeEdit.opec ?? null,
          opecChange: crudeEdit.opecChange ?? null,
          fetchedAt: new Date().toISOString(),
        },
        economic: {
          cpiInflation: econEdit.cpiInflation ?? null,
          gdpGrowth: econEdit.gdpGrowth ?? null,
          fuelImportPct: econEdit.fuelImportPct ?? null,
          gdpPerCapita: econEdit.gdpPerCapita ?? null,
          dataYear: econEdit.dataYear ?? null,
          fetchedAt: new Date().toISOString(),
        },
      });

      toast.success('Settings saved securely!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const correlation = computePriceCorrelation(
    crudeEdit.brent !== undefined ? (crudeEdit as CrudeOilPrices) : data?.crudeOil ?? null
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            Market Intelligence
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage global oil prices and Sierra Leone economic indicators displayed on the public page.
          </p>
        </div>
        {data?.lastUpdated && (
          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            Last saved: {new Date(data.lastUpdated).toLocaleString()}
          </span>
        )}
      </div>

      {/* ── Alpha Vantage API Key ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-surface-900 text-sm">Alpha Vantage API Key</h3>
          <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
            <ShieldCheck className="w-3 h-3" /> Admin-Only
          </span>
          <a
            href="https://www.alphavantage.co/support/#api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary hover:underline"
          >
            Get free key →
          </a>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your Alpha Vantage API key..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
            />
          </div>
          <button
            onClick={() => setShowApiKey(v => !v)}
            className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Stored in admin-only Firestore. Never visible to the public.
          </p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs bg-primary text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save API Key
          </button>
        </div>
      </div>

      {/* ── Crude Oil Prices ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-surface-900 text-sm">Crude Oil Prices (USD/barrel)</h3>
          </div>
          <button
            onClick={handleFetchOil}
            disabled={isFetchingOil}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-blue-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingOil ? 'animate-spin' : ''}`} />
            {isFetchingOil ? 'Fetching...' : 'Fetch Live (Alpha Vantage)'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Brent Crude */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">🛢️ Brent Crude</p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Price ($/bbl)</label>
                <input
                  type="number"
                  step="0.01"
                  value={crudeEdit.brent ?? ''}
                  onChange={e => setCrudeEdit(p => ({ ...p, brent: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. 84.20"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Monthly Change (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={crudeEdit.brentChange ?? ''}
                  onChange={e => setCrudeEdit(p => ({ ...p, brentChange: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. 1.2"
                />
              </div>
              <ChangeBadge change={crudeEdit.brentChange ?? null} />
            </div>
          </div>

          {/* WTI Crude */}
          <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-3">🛢️ WTI Crude</p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Price ($/bbl)</label>
                <input
                  type="number"
                  step="0.01"
                  value={crudeEdit.wti ?? ''}
                  onChange={e => setCrudeEdit(p => ({ ...p, wti: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="e.g. 81.50"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Monthly Change (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={crudeEdit.wtiChange ?? ''}
                  onChange={e => setCrudeEdit(p => ({ ...p, wtiChange: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="e.g. 0.9"
                />
              </div>
              <ChangeBadge change={crudeEdit.wtiChange ?? null} />
            </div>
          </div>

          {/* OPEC Basket — Manual only */}
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">🛢️ OPEC Basket</p>
              <span className="text-[10px] bg-amber-100 text-amber-600 rounded px-1.5 py-0.5 font-medium">Manual</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Price ($/bbl)</label>
                <input
                  type="number"
                  step="0.01"
                  value={crudeEdit.opec ?? ''}
                  onChange={e => setCrudeEdit(p => ({ ...p, opec: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="e.g. 83.10"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Monthly Change (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={crudeEdit.opecChange ?? ''}
                  onChange={e => setCrudeEdit(p => ({ ...p, opecChange: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="e.g. 0.0"
                />
              </div>
              <ChangeBadge change={crudeEdit.opecChange ?? null} />
            </div>
            <a
              href="https://www.opec.org/opec-basket-price.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-[10px] text-amber-600 hover:underline"
            >
              View OPEC daily prices →
            </a>
          </div>
        </div>
      </div>

      {/* ── Economic Indicators ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-surface-900 text-sm">
              Sierra Leone Economic Indicators
            </h3>
            {econEdit.dataYear && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5">{econEdit.dataYear} data</span>
            )}
          </div>
          <button
            onClick={handleFetchEcon}
            disabled={isFetchingEcon}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-emerald-200"
          >
            <Globe className={`w-3.5 h-3.5 ${isFetchingEcon ? 'animate-spin' : ''}`} />
            {isFetchingEcon ? 'Fetching...' : 'Fetch from World Bank'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: 'cpiInflation', label: 'CPI Inflation', unit: '%', color: 'orange', hint: 'Annual %' },
            { key: 'gdpGrowth', label: 'GDP Growth', unit: '%', color: 'blue', hint: 'Annual %' },
            { key: 'fuelImportPct', label: 'Fuel Import %', unit: '%', color: 'purple', hint: 'Of merchandise imports' },
            { key: 'gdpPerCapita', label: 'GDP per Capita', unit: '$', color: 'green', hint: 'USD' },
          ].map(({ key, label, unit, hint }) => (
            <div key={key} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <label className="text-[10px] text-gray-500 uppercase font-medium">{label}</label>
              <p className="text-[10px] text-gray-400 mb-2">{hint}</p>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={(econEdit as any)[key] ?? ''}
                  onChange={e => setEconEdit(p => ({
                    ...p,
                    [key]: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={`e.g. ${key === 'gdpPerCapita' ? '650' : '12.5'}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <label className="text-[10px] text-gray-500 uppercase font-medium">Data Year</label>
          <input
            type="number"
            value={econEdit.dataYear ?? ''}
            onChange={e => setEconEdit(p => ({ ...p, dataYear: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="mt-1 w-full sm:w-40 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="e.g. 2024"
          />
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Data sourced from the World Bank Open Data API — updated annually. No API key required.
          </p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs bg-primary text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Data
          </button>
        </div>
      </div>

      {/* ── Smart Correlation Preview ────────────────────────── */}
      {correlation && (
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
          correlation.level === 'warning'
            ? 'bg-red-50 border-red-200'
            : correlation.level === 'positive'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-blue-50 border-blue-200'
        }`}>
          {correlation.level === 'warning'
            ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            : correlation.level === 'positive'
              ? <TrendingDown className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              : <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          }
          <div>
            <p className="text-xs font-bold text-surface-800 mb-0.5">
              💡 Smart Notice Preview (shown on public page)
            </p>
            <p className={`text-sm ${
              correlation.level === 'warning' ? 'text-red-700'
                : correlation.level === 'positive' ? 'text-emerald-800'
                : 'text-blue-700'
            }`}>
              {correlation.message}
            </p>
          </div>
        </div>
      )}

      {/* ── Save Button ──────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-500/20"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save to Firebase'}
        </button>
      </div>
    </div>
  );
}
