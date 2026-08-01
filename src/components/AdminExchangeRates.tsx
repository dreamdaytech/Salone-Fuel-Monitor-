import React, { useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc, getDoc } from '../firebase';
import {
  DollarSign, RefreshCw, Save, ShieldCheck, Key, Globe,
  CheckCircle, Info, TrendingUp, TrendingDown, Minus, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchExchangeRatesFromOER, buildResponseFromCache, HIGHLIGHT_PAIRS, getCurrencyInfo, type ExchangeRateCache } from '../lib/exchangeRateService';

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatRate(rate: number): string {
  if (rate >= 1000) return rate.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (rate >= 1) return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return rate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminExchangeRates() {
  const [oerApiKey, setOerApiKey] = useState('');
  const [showOerApiKey, setShowOerApiKey] = useState(false);
  const [sleOverride, setSleOverride] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [cachedRates, setCachedRates] = useState<ExchangeRateCache | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // ── Load API keys and current cached rates from Firebase ──
  useEffect(() => {
    // Load OER API key from admin-only settings doc
    const unsubKeys = onSnapshot(
      doc(db, 'settings', 'api_keys'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setOerApiKey(d.oerApiKey ?? '');
        }
      },
      (err) => console.warn('API keys load error:', err)
    );

    // Load cached exchange rates (public doc)
    const unsubRates = onSnapshot(
      doc(db, 'exchange_rates', 'current'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as ExchangeRateCache;
          setCachedRates(d);
          setSleOverride(d.overrides?.SLE?.toString() ?? '');
          setLastUpdated(d.fetchedAt ?? null);
        }
      },
      (err) => console.warn('Exchange rates load error:', err)
    );

    return () => { unsubKeys(); unsubRates(); };
  }, []);

  // ── Save OER API key and SLE override ──
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save OER API key to admin-only settings doc
      await setDoc(doc(db, 'settings', 'api_keys'), {
        oerApiKey: oerApiKey.trim(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // 2. Update SLE override in public exchange_rates doc
      const ratesSnap = await getDoc(doc(db, 'exchange_rates', 'current'));
      const existingOverrides = ratesSnap.exists() ? (ratesSnap.data().overrides ?? {}) : {};
      if (sleOverride.trim()) {
        const parsed = parseFloat(sleOverride);
        if (!isNaN(parsed)) existingOverrides.SLE = parsed;
      } else {
        delete existingOverrides.SLE;
      }
      if (ratesSnap.exists()) {
        await setDoc(doc(db, 'exchange_rates', 'current'), { overrides: existingOverrides }, { merge: true });
      }

      toast.success('Exchange rate settings saved securely!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Fetch live OER exchange rates and cache ──
  const handleFetchOerRates = async () => {
    if (!oerApiKey.trim()) {
      toast.error('Please enter your OER API key and save it first.');
      return;
    }
    setIsFetching(true);
    const overrides: Record<string, number> = {};
    if (sleOverride.trim()) {
      const parsed = parseFloat(sleOverride);
      if (!isNaN(parsed)) overrides.SLE = parsed;
    }
    try {
      toast.loading('Fetching live rates from OER...', { id: 'oer-fetch' });
      const cache = await fetchExchangeRatesFromOER(oerApiKey.trim(), overrides);
      await setDoc(doc(db, 'exchange_rates', 'current'), cache);
      toast.success('Exchange rates refreshed and cached successfully!', { id: 'oer-fetch' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch exchange rates.', { id: 'oer-fetch' });
    } finally {
      setIsFetching(false);
    }
  };

  // Build response from cache to display highlight pairs
  const rateResponse = cachedRates ? buildResponseFromCache(cachedRates, 'USD') : null;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Exchange Rates Management
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure the Open Exchange Rates API, set the SLE override rate, and refresh cached data.
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Last fetched: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      {/* ── OER API Key ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-surface-900 text-sm">Open Exchange Rates API Key (OER)</h3>
          <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
            <ShieldCheck className="w-3 h-3" /> Admin-Only
          </span>
          <a
            href="https://openexchangerates.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary hover:underline"
          >
            Get OER key →
          </a>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-medium mb-1">Open Exchange Rates App ID</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showOerApiKey ? 'text' : 'password'}
                  value={oerApiKey}
                  onChange={e => setOerApiKey(e.target.value)}
                  placeholder="Enter your OER App ID..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                />
              </div>
              <button
                onClick={() => setShowOerApiKey(v => !v)}
                className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                {showOerApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Free tier provides 1,000 requests/month (Base currency: USD).</p>
          </div>

          {/* SLE Override */}
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-[10px] text-gray-500 uppercase font-medium mb-2">
              Official SLE Override Rate <span className="normal-case text-gray-400">(USD → SLE)</span>
            </label>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Le</span>
                <input
                  type="number"
                  step="0.01"
                  value={sleOverride}
                  onChange={e => setSleOverride(e.target.value)}
                  placeholder="e.g. 23.80"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <p className="text-xs text-gray-500 max-w-sm">
                If set, this rate overrides the OER API rate for Sierra Leonean Leone across the entire platform.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Rate data cached publicly. API key stored in admin-only doc.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleFetchOerRates}
                disabled={isFetching}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Fetching...' : 'Fetch & Cache Rates'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs bg-primary text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Currently Cached Highlight Rates ────────────────── */}
      {rateResponse && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-surface-900 text-sm">Currently Cached Rates (USD Base)</h3>
            <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 font-medium">
              Live from Firestore
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {HIGHLIGHT_PAIRS.map(({ from, to }) => {
              const info = getCurrencyInfo(to);
              const rate = rateResponse.rates[to];
              if (!rate) return null;
              return (
                <div key={`${from}-${to}`} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{info?.flag ?? '🌍'}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{to}</span>
                  </div>
                  <p className="text-sm font-black text-surface-900 leading-none">{formatRate(rate)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{info?.name ?? to}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              These are the cached rates currently being served to all users on the public Exchange Rates page.
              Click <strong>Fetch &amp; Cache Rates</strong> above to update them.
            </p>
          </div>
        </div>
      )}

      {!rateResponse && (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">No cached rates yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Enter your OER API key above and click <strong>Fetch &amp; Cache Rates</strong> to populate.
          </p>
        </div>
      )}
    </div>
  );
}
