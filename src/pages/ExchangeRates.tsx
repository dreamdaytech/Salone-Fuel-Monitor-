import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign, RefreshCw, ArrowLeftRight, Search,
  TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight,
  Info, Globe, AlertCircle, Clock, CheckCircle
} from 'lucide-react';
import {
  buildResponseFromCache,
  getCurrencyInfo,
  CURRENCY_LIST,
  HIGHLIGHT_PAIRS,
  type ExchangeRateResponse,
  type ExchangeRateCache,
  type CurrencyInfo,
} from '../lib/exchangeRateService';
import { db, doc, onSnapshot } from '../firebase';

const PAGE_SIZE = 20;

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatRate(rate: number): string {
  if (rate >= 1000) return rate.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (rate >= 1) return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return rate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (amount >= 1) return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function formatLastUpdated(utcString: string): string {
  try {
    const d = new Date(utcString);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
  } catch {
    return utcString;
  }
}

// ─── Currency Dropdown ───────────────────────────────────────────────────────

interface CurrencySelectProps {
  value: string;
  onChange: (code: string) => void;
  id: string;
  label: string;
}

function CurrencySelect({ value, onChange, id, label }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = getCurrencyInfo(value);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CURRENCY_LIST.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 60);
  }, [search]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById(`currency-select-${id}`);
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, id]);

  return (
    <div className="relative" id={`currency-select-${id}`}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-400 focus:border-emerald-500 focus:outline-none transition-colors text-left"
      >
        <span className="text-2xl leading-none">{selected.flag}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-surface-900 text-sm">{selected.code}</p>
          <p className="text-xs text-gray-500 truncate">{selected.name}</p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search currency..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-surface-900 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-64">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No currencies found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.code); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left ${c.code === value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700'}`}
                >
                  <span className="text-xl leading-none w-7 flex-shrink-0">{c.flag}</span>
                  <span className="font-bold text-sm w-12 flex-shrink-0">{c.code}</span>
                  <span className="text-sm truncate">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Highlight Card ───────────────────────────────────────────────────────────

interface HighlightCardProps {
  from: string;
  to: string;
  label: string;
  rates: ExchangeRateResponse | null;
  index: number;
}

const CARD_COLORS = [
  { bg: 'from-emerald-600 to-emerald-800', badge: 'bg-emerald-500/30 text-emerald-100' },
  { bg: 'from-blue-600 to-blue-800', badge: 'bg-blue-500/30 text-blue-100' },
  { bg: 'from-purple-600 to-purple-800', badge: 'bg-purple-500/30 text-purple-100' },
  { bg: 'from-amber-500 to-amber-700', badge: 'bg-amber-400/30 text-amber-100' },
];

function HighlightCard({ from, to, label, rates, index }: HighlightCardProps) {
  const colors = CARD_COLORS[index % CARD_COLORS.length];
  const fromInfo = getCurrencyInfo(from);
  const toInfo = getCurrencyInfo(to);

  let rate: number | null = null;
  if (rates && rates.rates[from] && rates.rates[to]) {
    rate = rates.rates[to] / rates.rates[from];
  }

  return (
    <div className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
      <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
            {fromInfo.flag} {from} → {toInfo.flag} {to}
          </span>
          {((from === 'USD' && to === 'SLE') || (from === 'SLE' && to === 'USD')) && rates?.rates?.SLE === 23.8 && (
            // A small hint if an override might be active, though we don't have direct access to the overrides object here easily without passing it down. 
            // Better to handle the badge in the main converter section, or pass overrides down.
            null
          )}
        </div>
        {rate !== null ? (
          <>
            <p className="text-3xl font-black tracking-tight leading-none">
              {formatRate(rate)}
            </p>
            <p className="text-white/70 text-xs mt-1.5">
              1 {fromInfo.name} = {formatRate(rate)} {toInfo.name}
            </p>
          </>
        ) : (
          <p className="text-2xl font-black text-white/50">—</p>
        )}
        <p className="text-[10px] text-white/50 mt-2 font-medium uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExchangeRates() {
  const [rates, setRates] = useState<ExchangeRateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Converter state
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('SLE');

  // Table state
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tableBase, setTableBase] = useState('USD');

  // Firebase config state — reads ONLY from the public exchange_rates/current doc
  const [rateCache, setRateCache] = useState<ExchangeRateCache | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // ── Listen to public exchange_rates/current (no API key exposed) ──
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'exchange_rates', 'current'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as ExchangeRateCache;
          setRateCache(d);
          setOverrides(d.overrides ?? {});
          // Build ExchangeRateResponse from the cached data
          try {
            const response = buildResponseFromCache(d, 'USD');
            setRates(response);
            setError(null);
          } catch (e: any) {
            setError(e.message);
          }
        } else {
          setError('Exchange rate data is not yet available. Please ask the administrator to fetch rates from the Admin Dashboard.');
        }
        setLoading(false);
        setCacheLoaded(true);
      },
      (err) => {
        console.warn('Could not load exchange rate cache:', err);
        setError('Unable to load exchange rate data. Please try again later.');
        setLoading(false);
        setCacheLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  // ── Reload rates when table base changes (cross-rate calculation) ──
  const loadRates = useCallback((base: string) => {
    if (!rateCache) return;
    try {
      const response = buildResponseFromCache(rateCache, base);
      setRates(response);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [rateCache]);

  // When fromCurrency changes update rates for converter
  useEffect(() => {
    if (rateCache && fromCurrency !== 'USD') {
      loadRates(fromCurrency);
    } else if (rateCache) {
      loadRates('USD');
    }
  }, [fromCurrency, rateCache, loadRates]);

  // Table base rates (derived from cache)
  const [tableRates, setTableRates] = useState<ExchangeRateResponse | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    if (rateCache) {
      setTableLoading(true);
      try {
        const response = buildResponseFromCache(rateCache, tableBase);
        setTableRates(response);
      } catch {
        setTableRates(null);
      } finally {
        setTableLoading(false);
      }
    }
  }, [tableBase, rateCache]);

  // ── Handle refresh (just re-reads from Firestore cache) ──
  const handleRefresh = () => {
    if (!rateCache) return;
    setRefreshing(true);
    try {
      const response = buildResponseFromCache(rateCache, 'USD');
      setRates(response);
    } catch { /* noop */ } finally {
      setRefreshing(false);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const fromInfo = getCurrencyInfo(fromCurrency);
  const toInfo = getCurrencyInfo(toCurrency);

  // ── Converter result ──
  const convertedAmount = useMemo(() => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || !rates) return null;

    let rate: number | null = null;
    if (rates.base_code === fromCurrency && rates.rates[toCurrency]) {
      rate = rates.rates[toCurrency];
    } else if (rates.base_code === toCurrency && rates.rates[fromCurrency]) {
      rate = 1 / rates.rates[fromCurrency];
    } else if (rates.rates[fromCurrency] && rates.rates[toCurrency]) {
      rate = rates.rates[toCurrency] / rates.rates[fromCurrency];
    }
    return rate !== null ? amt * rate : null;
  }, [amount, fromCurrency, toCurrency, rates]);

  // ── Table data ──
  const tableData = useMemo(() => {
    if (!tableRates) return [];
    return CURRENCY_LIST
      .filter((c) => {
        if (!tableRates.rates[c.code]) return false;
        const q = tableSearch.toLowerCase();
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      })
      .map((c) => ({
        info: c,
        rate: tableRates.rates[c.code],
      }));
  }, [tableRates, tableSearch]);

  const totalPages = Math.ceil(tableData.length / PAGE_SIZE);
  const pagedData = tableData.slice((tablePage - 1) * PAGE_SIZE, tablePage * PAGE_SIZE);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50">
        <div className="bg-gradient-to-br from-surface-900 via-surface-800 to-emerald-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Live Rates</p>
                <h1 className="text-2xl sm:text-4xl font-black text-white">Exchange Rates</h1>
              </div>
            </div>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Loading live exchange rate data for 160+ global currencies…
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-br from-surface-900 via-surface-800 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Live Rates</p>
                <h1 className="text-2xl sm:text-4xl font-black text-white">Exchange Rates</h1>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh rates"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50 mt-1"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Live exchange rates for 160+ global currencies. Convert between any pair and explore
            how the Sierra Leonean Leone (SLE) compares to major world currencies.
          </p>
          {rates && (
            <div className="flex items-center gap-2 mt-4 text-emerald-300/80 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Last updated: {formatLastUpdated(rates.time_last_update_utc)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10 space-y-6 sm:space-y-8">

        {/* ── Error Banner ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Could not load rates</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Quick Reference Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {HIGHLIGHT_PAIRS.map((pair, i) => (
            <HighlightCard
              key={pair.label}
              from={pair.from}
              to={pair.to}
              label={pair.label}
              rates={rates}
              index={i}
            />
          ))}
        </div>

        {/* ── Currency Converter ── */}
        <div className="relative z-20 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-1.5 rounded-lg">
                <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-surface-900">Currency Converter</h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">Convert between any two of 160+ global currencies</p>
          </div>

          <div className="p-6">
            <div className="relative z-20 flex flex-col gap-6">
              {/* Currencies Row */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                <CurrencySelect
                  id="from"
                  label="From Currency"
                  value={fromCurrency}
                  onChange={setFromCurrency}
                />

                <div className="flex justify-center pb-2">
                  <button
                    type="button"
                    onClick={handleSwap}
                    title="Swap currencies"
                    className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all hover:scale-110 active:scale-95"
                  >
                    <ArrowLeftRight className="w-5 h-5" />
                  </button>
                </div>

                <CurrencySelect
                  id="to"
                  label="To Currency"
                  value={toCurrency}
                  onChange={setToCurrency}
                />
              </div>

              {/* Amounts Row */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                <div>
                  <label htmlFor="converter-amount" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Amount
                  </label>
                  <input
                    id="converter-amount"
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-surface-900 font-bold text-lg focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="1"
                  />
                </div>

                <div className="hidden sm:flex justify-center pb-2 w-11 mx-auto">
                  {/* Empty spacer to align with the swap button above */}
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    <span>Converted Amount</span>
                    {((fromCurrency === 'USD' && toCurrency === 'SLE') || (fromCurrency === 'SLE' && toCurrency === 'USD')) && overrides['SLE'] && (
                      <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                        <CheckCircle className="w-3 h-3" /> Official Rate
                      </span>
                    )}
                  </label>
                  <div className="w-full px-4 py-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-xl min-h-[54px] flex items-center">
                    {convertedAmount !== null ? (
                      <span className="text-emerald-700 font-black text-xl">
                        {formatAmount(convertedAmount)}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium text-sm">Enter an amount to convert</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion summary */}
            {convertedAmount !== null && (
              <div className="relative z-10 mt-5 pt-5 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                  <span className="text-2xl">{fromInfo.flag}</span>
                  <span className="text-lg font-bold text-surface-900">
                    {parseFloat(amount).toLocaleString()} {fromCurrency}
                  </span>
                  <span className="text-gray-400 font-medium">=</span>
                  <span className="text-2xl">{toInfo.flag}</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {formatAmount(convertedAmount)} {toCurrency}
                  </span>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Indicative rate · Updates every 24 hours · {rates ? formatLastUpdated(rates.time_last_update_utc) : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Global Rates Table ── */}
        <div className="relative z-10 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-surface-900">Global Rates Table</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{tableData.length} currencies · Base: {tableBase}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Base selector */}
                <div className="flex items-center gap-2">
                  <label htmlFor="table-base" className="text-xs font-semibold text-gray-500 whitespace-nowrap">Base:</label>
                  <select
                    id="table-base"
                    value={tableBase}
                    onChange={(e) => { setTableBase(e.target.value); setTablePage(1); }}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-surface-900 focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    {['USD', 'EUR', 'GBP', 'SLE', 'NGN', 'GHS', 'ZAR', 'CNY', 'JPY', 'AED', 'CAD', 'AUD'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search currency..."
                    value={tableSearch}
                    onChange={(e) => { setTableSearch(e.target.value); setTablePage(1); }}
                    className="bg-transparent text-sm outline-none w-40 text-surface-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {tableLoading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Currency</th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Rate (1 {tableBase})</th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Inverse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pagedData.map(({ info, rate }, i) => (
                      <tr
                        key={info.code}
                        className="hover:bg-emerald-50/30 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-3.5 text-gray-400 text-xs font-medium">
                          {(tablePage - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="text-xl leading-none">{info.flag}</span>
                            <div>
                              <p className="font-bold text-surface-900">{info.code}</p>
                              <p className="text-xs text-gray-400 hidden sm:block">{info.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right">
                          <span className="font-mono font-bold text-surface-900">{formatRate(rate)}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right hidden sm:table-cell">
                          <span className="font-mono text-gray-500 text-xs">{formatRate(1 / rate)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {(tablePage - 1) * PAGE_SIZE + 1}–{Math.min(tablePage * PAGE_SIZE, tableData.length)} of {tableData.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                      disabled={tablePage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page = i + 1;
                        if (totalPages > 5 && tablePage > 3) {
                          page = tablePage - 2 + i;
                        }
                        if (page > totalPages) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => setTablePage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${page === tablePage ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                      disabled={tablePage === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Fuel Context Banner ── */}
        <div className="bg-gradient-to-r from-emerald-900 to-surface-900 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30 flex-shrink-0">
              <Info className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base mb-1.5">How Exchange Rates Affect Fuel Prices</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Sierra Leone imports most of its refined fuel, priced in <strong className="text-white">US Dollars (USD)</strong>.
                When the Leone weakens against the Dollar, import costs rise — which typically leads to higher pump prices.
                Monitoring the <strong className="text-white">USD/SLE rate</strong> gives you an early indicator of possible fuel price movements
                before they are announced by the National Petroleum regulatory authority.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                  SLE weakens → Fuel prices may rise
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                  SLE strengthens → Fuel prices may fall
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold">
                  <Minus className="w-3.5 h-3.5 text-blue-400" />
                  Stable rate → Prices likely unchanged
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Attribution ── */}

      </div>
    </div>
  );
}
