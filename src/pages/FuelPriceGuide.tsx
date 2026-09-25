import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CalendarDays, Fuel, Globe2, Info, MapPin } from 'lucide-react';
import { db, collection, query, orderBy, limit, onSnapshot } from '../firebase';

type FuelKey = 'petrol' | 'diesel' | 'kerosene';
type FuelField = 'petrolPrice' | 'dieselPrice' | 'kerosenePrice';

type FuelRecord = {
  id: string;
  effectiveDate?: string;
  monthYear?: string;
  petrolPrice?: unknown;
  dieselPrice?: unknown;
  kerosenePrice?: unknown;
};

type FuelConfig = {
  label: string;
  shortName: string;
  code: string;
  field: FuelField;
  route: string;
  accent: string;
  intro: string;
  whyItMatters: string;
};

const FUEL_CONFIG: Record<FuelKey, FuelConfig> = {
  petrol: {
    label: 'Petrol',
    shortName: 'petrol',
    code: 'PMS',
    field: 'petrolPrice',
    route: '/petrol-price-sierra-leone',
    accent: 'bg-red-500',
    intro: 'Petrol is one of the most closely watched retail fuel prices in Sierra Leone. This page shows the latest confirmed petrol value in the official price timeline and the date on which that price became effective.',
    whyItMatters: 'Changes in petrol prices can affect household transport costs, taxi and commercial vehicle expenses, business travel and the wider cost of moving people and goods.'
  },
  diesel: {
    label: 'Diesel',
    shortName: 'diesel',
    code: 'AGO',
    field: 'dieselPrice',
    route: '/diesel-price-sierra-leone',
    accent: 'bg-emerald-500',
    intro: 'Diesel is widely used across transport, logistics, commercial activity and electricity generation. This page shows the latest confirmed diesel value in the official price timeline and its effective date.',
    whyItMatters: 'Diesel-price changes can influence logistics, distribution, public transport, power generation and other operating costs, so the effective date is important when comparing business expenses over time.'
  },
  kerosene: {
    label: 'Kerosene',
    shortName: 'kerosene',
    code: 'DPK',
    field: 'kerosenePrice',
    route: '/kerosene-price-sierra-leone',
    accent: 'bg-amber-500',
    intro: 'Kerosene may not receive a confirmed value in every fuel-price event. This page identifies the latest confirmed positive kerosene value in the official timeline and shows the date attached to that value.',
    whyItMatters: 'Keeping kerosene independent from petrol and diesel prevents a missing field in a newer record from being misread as a real NLe 0 price or as a newly announced kerosene price.'
  }
};

const toPositivePrice = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseEffectiveDate = (value?: string) => {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [year, month, day] = parts;
    const localDate = new Date(year, month - 1, day);
    if (!Number.isNaN(localDate.getTime())) return localDate;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value?: string) => {
  const date = parseEffectiveDate(value);
  return date
    ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : (value || 'Date not available');
};

export default function FuelPriceGuide({ fuel }: { fuel: FuelKey }) {
  const config = FUEL_CONFIG[fuel];
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'price_trends'), orderBy('effectiveDate', 'desc'), limit(60));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRecords(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as FuelRecord[]);
        setLoading(false);
      },
      (error) => {
        console.error(`Error loading ${fuel} price records:`, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fuel]);

  const history = useMemo(() => {
    return records
      .map((record) => ({
        ...record,
        value: toPositivePrice(record[config.field]),
      }))
      .filter((record) => record.value !== null)
      .slice(0, 8);
  }, [records, config.field]);

  const latest = history[0] || null;
  const otherFuelLinks = (Object.keys(FUEL_CONFIG) as FuelKey[]).filter((key) => key !== fuel);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-100">
              Sierra Leone fuel prices
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {config.label} Price in Sierra Leone Today
            </h1>
            <p className="mt-5 text-lg leading-8 text-blue-50">{config.intro}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Latest confirmed {config.shortName} price
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`h-12 w-2 rounded-full ${config.accent}`} aria-hidden="true" />
                  <div>
                    {loading ? (
                      <div className="h-11 w-48 animate-pulse rounded-xl bg-slate-100" />
                    ) : latest ? (
                      <p className="text-4xl font-extrabold text-slate-950">
                        NLe {latest.value!.toFixed(2)}
                        <span className="ml-2 text-base font-semibold text-slate-500">/ litre</span>
                      </p>
                    ) : (
                      <p className="text-2xl font-bold text-slate-700">Price temporarily unavailable</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Fuel className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <CalendarDays className="h-4 w-4" /> Effective date
                </div>
                <p className="mt-2 font-bold text-slate-900">
                  {latest ? formatDate(latest.effectiveDate || latest.monthYear) : 'Not available'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Info className="h-4 w-4" /> Fuel code
                </div>
                <p className="mt-2 font-bold text-slate-900">{config.code}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-950">
              <strong>How this value is selected:</strong> this page uses the most recent confirmed positive {config.shortName} value in the effective-date timeline. Blank, null and zero entries are treated as no price recorded for that fuel on that date.
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/price-trends" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                <BarChart3 className="h-4 w-4" /> Full price history
              </Link>
              <Link to="/data-methodology" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50">
                Data methodology <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-slate-950">Recent {config.label.toLowerCase()} price records</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Recent confirmed values are shown by effective date. Missing values are excluded instead of being displayed as NLe 0.
            </p>

            <div className="mt-6 space-y-3">
              {loading ? (
                [1, 2, 3, 4].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)
              ) : history.length > 0 ? (
                history.map((record) => (
                  <div key={record.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{formatDate(record.effectiveDate || record.monthYear)}</p>
                      <p className="text-xs text-slate-500">Effective date</p>
                    </div>
                    <p className="text-lg font-extrabold text-slate-950">NLe {record.value!.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No confirmed {config.shortName} history is currently available.</p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Why the {config.label.toLowerCase()} price matters</h2>
            <p className="mt-4 leading-7 text-slate-700">{config.whyItMatters}</p>
            <p className="mt-4 leading-7 text-slate-700">
              The current amount should always be read together with its effective date. That prevents an older price from being mistaken for a new announcement and makes historical comparisons more reliable.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Explore the wider fuel market</h2>
            <p className="mt-4 leading-7 text-slate-700">
              A single pump price does not explain the whole market. Use Salone Fuel Monitor to compare Sierra Leone fuel history, selected West African markets, station information and global oil movements.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link to="/stations" className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 font-semibold text-slate-800 hover:bg-slate-100">
                <MapPin className="h-4 w-4 text-blue-600" /> Fuel stations
              </Link>
              <Link to="/regional-comparison" className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 font-semibold text-slate-800 hover:bg-slate-100">
                <Globe2 className="h-4 w-4 text-blue-600" /> West Africa comparison
              </Link>
            </div>
          </article>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">Other Sierra Leone fuel prices</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {otherFuelLinks.map((key) => {
              const other = FUEL_CONFIG[key];
              return (
                <Link key={key} to={other.route} className="group flex items-center justify-between rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:bg-blue-50/40">
                  <div>
                    <p className="font-bold text-slate-950">{other.label} price in Sierra Leone</p>
                    <p className="mt-1 text-sm text-slate-500">Latest confirmed {other.code} value</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
