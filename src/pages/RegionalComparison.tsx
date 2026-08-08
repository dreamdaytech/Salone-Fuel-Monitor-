import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, doc, onSnapshot, collection, query, orderBy, limit } from '../firebase';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  Globe, Table as TableIcon, LayoutGrid, Map as MapIcon,
  BarChart3, TrendingUp, ArrowUpDown, Fuel, DollarSign,
  ArrowUp, ArrowDown, Minus, RefreshCw, ExternalLink, Info,
  ChevronDown, ChevronUp, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBase64, drawPdfHeader } from '../utils/pdfUtils';
import { toCanvas } from 'html-to-image';
import { trackPdfExport } from '../hooks/useAnalytics';
import {
  REGIONAL_COUNTRIES, computeRegionalData, getMockHistoricalData,
  getCountryColor, formatUSD, formatLocal, getRankMedal,
  FuelType, ComputedCountry, RegionalCountry
} from '../lib/regionalData';

type ViewMode = 'table' | 'card' | 'map' | 'bar' | 'line';
type CurrencyMode = 'usd' | 'local';
type SortField = 'rank' | 'name' | 'petrol' | 'diesel' | 'kerosene' | 'diff';
type SortDir = 'asc' | 'desc';

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'table',  label: 'Table',     icon: <TableIcon className="w-4 h-4" /> },
  { id: 'card',   label: 'Cards',     icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'map',    label: 'Map',       icon: <MapIcon className="w-4 h-4" /> },
  { id: 'bar',    label: 'Bar Chart', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'line',   label: 'Trends',    icon: <TrendingUp className="w-4 h-4" /> },
];

const FUEL_TYPES: { id: FuelType; label: string; color: string }[] = [
  { id: 'petrol',   label: 'Petrol',   color: '#10B981' },
  { id: 'diesel',   label: 'Diesel',   color: '#3B82F6' },
  { id: 'kerosene', label: 'Kerosene', color: '#F59E0B' },
];

function DiffBadge({ pct, isBase }: { pct: number; isBase: boolean }) {
  if (isBase) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
        Base
      </span>
    );
  }
  const abs = Math.abs(pct);
  const cheaper = pct < 0;
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
      cheaper ? 'bg-emerald-50 text-emerald-700' : pct === 0 ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'
    }`}>
      {cheaper ? <ArrowDown className="w-3 h-3" /> : pct > 0 ? <ArrowUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {abs.toFixed(1)}%
    </span>
  );
}

// ─── Table View ───────────────────────────────────────────────────
function TableView({
  data, fuel, currency, sortField, sortDir, onSort, worldAvg
}: {
  data: ComputedCountry[];
  fuel: FuelType;
  currency: CurrencyMode;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  worldAvg?: { petrol: number | null; diesel: number | null; kerosene: number | null; asOfDate: string } | null;
}) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary" />;
  };

  const th = (label: string, field: SortField) => (
    <th
      className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary select-none whitespace-nowrap"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">{label} <SortIcon field={field} /></span>
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {th('Rank', 'rank')}
            {th('Country', 'name')}
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Currency</th>
            {th('Petrol', 'petrol')}
            {th('Diesel', 'diesel')}
            {th('Kerosene', 'kerosene')}
            {th('Diff vs SL', 'diff')}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-50">
          {data.map((c) => {
            const diffPct = fuel === 'petrol' ? c.petrolDiffPct : fuel === 'diesel' ? c.dieselDiffPct : c.keroseneDiffPct;
            return (
              <tr key={c.id} className={`transition-colors hover:bg-emerald-50/40 ${c.isSierraLeone ? 'bg-emerald-50/60' : ''}`}>
                <td className="px-4 py-3.5">
                  {c.rank <= 3 ? (
                    <span className="text-3xl">{getRankMedal(c.rank)}</span>
                  ) : (
                    <span className="text-lg font-bold text-surface-900">#{c.rank}</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{c.flag}</span>
                    <div>
                      <p className="font-bold text-surface-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.capital}</p>
                    </div>
                    {c.isSierraLeone && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">LIVE</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-semibold text-gray-700">{c.currencyCode}</p>
                  <p className="text-xs text-gray-400">{c.currencySymbol}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-bold text-surface-900">
                    {currency === 'usd' ? formatUSD(c.petrolUSD) : formatLocal(c.prices.petrol, c.currencySymbol)}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-bold text-surface-900">
                    {currency === 'usd' ? formatUSD(c.dieselUSD) : formatLocal(c.prices.diesel, c.currencySymbol)}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-bold text-surface-900">
                    {currency === 'usd' ? formatUSD(c.keroseneUSD) : formatLocal(c.prices.kerosene, c.currencySymbol)}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <DiffBadge pct={diffPct} isBase={!!c.isSierraLeone} />
                </td>
              </tr>
            );
          })}

          {/* World Average reference row */}
          {worldAvg && (worldAvg.petrol || worldAvg.diesel) && (
            <tr className="bg-blue-50/60 border-t-2 border-dashed border-blue-200">
              <td className="px-4 py-3.5">
                <span className="text-xs font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">AVG</span>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none">🌍</span>
                  <div>
                    <p className="font-bold text-blue-800 text-sm">World Average</p>
                    <p className="text-xs text-blue-400">
                      {worldAvg.asOfDate
                        ? `As of ${new Date(worldAvg.asOfDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Reference benchmark'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">GLOBAL</span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <p className="text-sm font-semibold text-blue-700">USD</p>
                <p className="text-xs text-blue-400">per litre</p>
              </td>
              <td className="px-4 py-3.5">
                <p className="text-sm font-bold text-blue-800">
                  {worldAvg.petrol ? `$${worldAvg.petrol.toFixed(3)}` : '—'}
                </p>
              </td>
              <td className="px-4 py-3.5">
                <p className="text-sm font-bold text-blue-800">
                  {worldAvg.diesel ? `$${worldAvg.diesel.toFixed(3)}` : '—'}
                </p>
              </td>
              <td className="px-4 py-3.5">
                <p className="text-sm font-bold text-blue-800">
                  {worldAvg.kerosene ? `$${worldAvg.kerosene.toFixed(3)}` : '—'}
                </p>
              </td>
              <td className="px-4 py-3.5">
                <span className="text-xs text-blue-500 font-semibold italic">Reference</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Card View ────────────────────────────────────────────────────
const CARD_COLORS = [
  { bg: 'from-emerald-600 to-emerald-800', badge: 'bg-emerald-500/30 text-emerald-100' },
  { bg: 'from-blue-600 to-blue-800', badge: 'bg-blue-500/30 text-blue-100' },
  { bg: 'from-purple-600 to-purple-800', badge: 'bg-purple-500/30 text-purple-100' },
  { bg: 'from-amber-500 to-amber-700', badge: 'bg-amber-400/30 text-amber-100' },
];

function CardView({
  data, fuel, currency, worldAvg
}: {
  data: ComputedCountry[];
  fuel: FuelType;
  currency: CurrencyMode;
  worldAvg?: { petrol: number | null; diesel: number | null; kerosene: number | null; asOfDate: string } | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {data.map((c, index) => {
        const diffPct = fuel === 'petrol' ? c.petrolDiffPct : fuel === 'diesel' ? c.dieselDiffPct : c.keroseneDiffPct;
        const fuelUSD = fuel === 'petrol' ? c.petrolUSD : fuel === 'diesel' ? c.dieselUSD : c.keroseneUSD;
        const fuelLocal = fuel === 'petrol' ? c.prices.petrol : fuel === 'diesel' ? c.prices.diesel : c.prices.kerosene;
        const colors = CARD_COLORS[index % CARD_COLORS.length];
        
        return (
          <div
            key={c.id}
            className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${
              c.isSierraLeone ? 'ring-2 ring-white/50' : ''
            } ${
              c.rank <= 3 ? 'ring-2 ring-white/30 shadow-2xl' : ''
            }`}
          >
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/5" />
            {c.rank <= 3 && (
              <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
            )}

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge} flex items-center gap-1.5`}>
                    <span className="text-sm">{c.flag}</span> {c.name}
                  </span>
                  {c.isSierraLeone && (
                    <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full text-center">LIVE</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={c.rank <= 3 ? 'text-4xl' : 'text-2xl'}>{getRankMedal(c.rank)}</span>
                </div>
              </div>

              {/* Primary fuel price */}
              <div className="mb-4">
                <p className={`font-black tracking-tight leading-none ${
                  c.rank <= 3 ? 'text-5xl sm:text-6xl drop-shadow-lg' : 'text-3xl'
                }`}>
                  {currency === 'usd' ? formatUSD(fuelUSD) : formatLocal(fuelLocal, c.currencySymbol)}
                </p>
                <p className={`text-white/70 mt-2 ${
                  c.rank <= 3 ? 'text-sm font-semibold' : 'text-xs'
                }`}>
                  {currency === 'usd' ? formatLocal(fuelLocal, c.currencySymbol) : formatUSD(fuelUSD)} • {fuel.toUpperCase()}
                </p>
              </div>

              {/* All 3 fuels in small grid */}
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {FUEL_TYPES.map(ft => {
                  const usdVal = ft.id === 'petrol' ? c.petrolUSD : ft.id === 'diesel' ? c.dieselUSD : c.keroseneUSD;
                  const localVal = ft.id === 'petrol' ? c.prices.petrol : ft.id === 'diesel' ? c.prices.diesel : c.prices.kerosene;
                  return (
                    <div key={ft.id} className={`rounded-lg p-2 text-center ${
                      fuel === ft.id ? 'bg-white/20 ring-1 ring-white/30' : 'bg-white/5'
                    }`}>
                      <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">{ft.label}</p>
                      <p className={`font-bold text-white ${
                        c.rank <= 3 && fuel === ft.id ? 'text-sm' : 'text-xs'
                      }`}>
                        {currency === 'usd' ? formatUSD(usdVal) : formatLocal(localVal, c.currencySymbol)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.isSierraLeone ? 'bg-white/20 text-white' : 
                    diffPct < 0 ? 'bg-emerald-500/30 text-emerald-100' : 
                    diffPct === 0 ? 'bg-white/20 text-white' : 'bg-rose-500/30 text-rose-100'
                  }`}>
                    {!c.isSierraLeone && (
                      diffPct < 0 ? <ArrowDown className="w-3 h-3" /> : diffPct > 0 ? <ArrowUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />
                    )}
                    {c.isSierraLeone ? 'Base' : `${Math.abs(diffPct).toFixed(1)}% vs SL`}
                  </span>
                </div>
                <p className="text-[10px] text-white/50">
                  {new Date(c.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Map View ─────────────────────────────────────────────────────
function MapView({ data, fuel, currency }: { data: ComputedCountry[]; fuel: FuelType; currency: CurrencyMode }) {
  const sl = data.find(c => c.isSierraLeone);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 520 }}>
      <MapContainer
        center={[9.0, -10.5]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((c) => {
          const diffPct = fuel === 'petrol' ? c.petrolDiffPct : fuel === 'diesel' ? c.dieselDiffPct : c.keroseneDiffPct;
          const fuelUSD = fuel === 'petrol' ? c.petrolUSD : fuel === 'diesel' ? c.dieselUSD : c.keroseneUSD;
          const fuelLocal = fuel === 'petrol' ? c.prices.petrol : fuel === 'diesel' ? c.prices.diesel : c.prices.kerosene;

          // Color: green if cheaper/same, red if more expensive vs SL
          const color = c.isSierraLeone
            ? '#10B981'
            : diffPct < -3 ? '#22c55e'
            : diffPct > 3  ? '#ef4444'
            : '#f59e0b';

          return (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lng]}
              radius={c.isSierraLeone ? 20 : 15}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 2 }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.capital}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Petrol</span>
                      <span className="font-bold">{formatUSD(c.petrolUSD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Diesel</span>
                      <span className="font-bold">{formatUSD(c.dieselUSD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kerosene</span>
                      <span className="font-bold">{formatUSD(c.keroseneUSD)}</span>
                    </div>
                  </div>
                  {!c.isSierraLeone && sl && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <DiffBadge pct={diffPct} isBase={false} />
                      <span className="text-xs text-gray-400 ml-1">vs Sierra Leone</span>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500" /> Cheaper than SL</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-amber-500" /> Similar to SL</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-500" /> More expensive</span>
      </div>
    </div>
  );
}

// ─── Bar Chart View ───────────────────────────────────────────────
function BarChartView({ data, fuel }: { data: ComputedCountry[]; fuel: FuelType }) {
  const chartData = [...data]
    .sort((a, b) => a.rank - b.rank)
    .map(c => ({
      name: c.flag + ' ' + c.name.split(' ')[0],
      fullName: c.name,
      petrol: parseFloat(c.petrolUSD.toFixed(3)),
      diesel: parseFloat(c.dieselUSD.toFixed(3)),
      kerosene: parseFloat(c.keroseneUSD.toFixed(3)),
      isSL: c.isSierraLeone,
    }));

  const fuelColors = { petrol: '#10B981', diesel: '#3B82F6', kerosene: '#F59E0B' };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const country = data.find(c => c.flag + ' ' + c.name.split(' ')[0] === label);
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-bold text-surface-900 mb-2">{country?.name || label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span className="capitalize text-gray-500">{p.dataKey}</span>
            <span className="font-bold" style={{ color: p.fill }}>{formatUSD(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <p className="text-sm text-gray-500 mb-4">Prices shown in USD equivalent (ranked cheapest → most expensive for selected fuel)</p>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fontWeight: 600 }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 11 }}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Bar dataKey="petrol" name="Petrol" fill={fuelColors.petrol} radius={[4, 4, 0, 0]}
            opacity={fuel === 'petrol' ? 1 : 0.35}
          />
          <Bar dataKey="diesel" name="Diesel" fill={fuelColors.diesel} radius={[4, 4, 0, 0]}
            opacity={fuel === 'diesel' ? 1 : 0.35}
          />
          <Bar dataKey="kerosene" name="Kerosene" fill={fuelColors.kerosene} radius={[4, 4, 0, 0]}
            opacity={fuel === 'kerosene' ? 1 : 0.35}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Line Chart (Trends) View ─────────────────────────────────────
function LineChartView({ data, fuel }: { data: ComputedCountry[]; fuel: FuelType }) {
  const chartData = useMemo(() => getMockHistoricalData(data, fuel), [data, fuel]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm min-w-[180px]">
        <p className="font-bold text-surface-900 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex justify-between gap-3">
            <span className="text-gray-500 truncate max-w-[120px]">{p.dataKey}</span>
            <span className="font-bold" style={{ color: p.stroke }}>{formatUSD(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-semibold text-surface-900">6-Month Price Trend</p>
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Mock historical data</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">USD equivalent prices per litre — Feb to Jul 2026</p>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} width={55} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {data.map((c) => (
            <Line
              key={c.id}
              type="monotone"
              dataKey={c.name}
              stroke={getCountryColor(c.id)}
              strokeWidth={c.isSierraLeone ? 3 : 1.5}
              dot={{ r: c.isSierraLeone ? 5 : 3 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function RegionalComparison() {
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 768 ? 'card' : 'table');
  const [fuel, setFuel] = useState<FuelType>('petrol');
  const [currency, setCurrency] = useState<CurrencyMode>('usd');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [slPrices, setSlPrices] = useState<Record<string, number> | null>(null);
  const [slLoading, setSlLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [worldAvg, setWorldAvg] = useState<{ petrol: number | null; diesel: number | null; kerosene: number | null; asOfDate: string } | null>(null);

  // ── PDF text sanitiser: strips emoji & non-Latin-1 chars that Helvetica can't render
  const safePdfText = (str: string): string =>
    String(str)
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')   // emoji flags, misc emoji
      .replace(/[\u{2600}-\u{27BF}]/gu, '')       // misc symbols & dingbats
      .replace(/\u2014|\u2013/g, '-')             // em/en dash -> hyphen
      .replace(/\u2022/g, '-')                    // bullet -> dash
      .replace(/[^\x00-\xFF]/g, '')               // anything outside Latin-1
      .replace(/\s{2,}/g, ' ')                    // collapse double spaces
      .trim();

  // ── Safe local price formatter for PDF (replaces ₦ ₵ etc. with ISO code)
  const safePdfPrice = (val: number, country: ComputedCountry): string => {
    const formatted = val >= 1000
      ? `${country.currencyCode} ${val.toLocaleString()}`
      : `${country.currencyCode} ${val.toFixed(2)}`;
    return formatted;
  };

  // ── Branded PDF Export ──────────────────────────────────────────
  const handleExportPDF = async () => {
    setIsExporting(true);
    trackPdfExport('Regional Comparison Report');
    try {
      const logo = await getLogoBase64();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      let currentY = drawPdfHeader(pdf, 'West Africa Regional Fuel Comparison', logo);

      const fuelLabel = fuel.charAt(0).toUpperCase() + fuel.slice(1);
      const currencyLabel = currency === 'usd' ? 'USD Equivalent' : 'Local Currency';
      const viewLabel = VIEW_MODES.find(v => v.id === viewMode)?.label || viewMode;

      // ── Report Title ──
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198);
      pdf.text('Regional Fuel Price Report', margin, currentY);

      currentY += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, currentY);

      // ── Divider ──
      currentY += 6;
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY, pageWidth - margin, currentY);

      // ── Filter Summary ──
      currentY += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198);
      pdf.text('Report Filters', margin, currentY);

      currentY += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      const filters = [
        `Fuel Type: ${fuelLabel}`,
        `Currency Display: ${currencyLabel}`,
        `View Mode: ${viewLabel}`,
        `Countries Compared: 8 (West Africa)`,
      ];
      filters.forEach(f => {
        pdf.text(`- ${f}`, margin + 2, currentY);
        currentY += 5;
      });

      currentY += 4;

      // ── World Average Benchmark ──
      if (worldAvg && (worldAvg.petrol || worldAvg.diesel)) {
        currentY += 6;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 114, 198);
        pdf.text('World Average Benchmark (USD)', margin, currentY);

        currentY += 6;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105);
        if (worldAvg.petrol) {
          pdf.text(`- Petrol: $${worldAvg.petrol.toFixed(3)}/L`, margin + 2, currentY);
          currentY += 5;
        }
        if (worldAvg.diesel) {
          pdf.text(`- Diesel: $${worldAvg.diesel.toFixed(3)}/L`, margin + 2, currentY);
          currentY += 5;
        }
        if (worldAvg.kerosene) {
          pdf.text(`- Kerosene: $${worldAvg.kerosene.toFixed(3)}/L`, margin + 2, currentY);
          currentY += 5;
        }
        if (worldAvg.asOfDate) {
          const dateStr = new Date(worldAvg.asOfDate + 'T00:00:00').toLocaleDateString();
          pdf.text(`(As of ${dateStr})`, margin + 2, currentY);
          currentY += 5;
        }
        currentY += 4;
      }

      // ── Chart Capture (bar / line views) ──
      if (chartRef.current && (viewMode === 'bar' || viewMode === 'line')) {
        try {
          const canvas = await Promise.race([
            toCanvas(chartRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' }),
            new Promise<HTMLCanvasElement>((_, reject) =>
              setTimeout(() => reject(new Error('Chart timeout')), 6000)
            )
          ]);
          const imgData = canvas.toDataURL('image/png');
          const chartW = pageWidth - margin * 2;
          const chartH = (canvas.height * chartW) / canvas.width;

          if (currentY + chartH > pageHeight - margin - 20) {
            pdf.addPage();
            currentY = margin + 10;
          } else {
            currentY += 4;
          }

          pdf.addImage(imgData, 'PNG', margin, currentY, chartW, chartH);
          currentY += chartH + 10;
        } catch (e) {
          console.warn('Chart capture failed:', e);
        }
      }

      // ── Data Table ──
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198);
      pdf.text(`${fuelLabel} Prices - Ranked by USD Cost`, margin, currentY);
      currentY += 4;

      // Build rows — all text sanitised for Helvetica (no emoji, no non-Latin-1)
      const tableData = [...computed]
        .sort((a, b) => a.rank - b.rank)
        .map(c => {
          const fuelUSD   = fuel === 'petrol' ? c.petrolUSD   : fuel === 'diesel' ? c.dieselUSD   : c.keroseneUSD;
          const fuelLocal = fuel === 'petrol' ? c.prices.petrol : fuel === 'diesel' ? c.prices.diesel : c.prices.kerosene;
          const diffPct   = fuel === 'petrol' ? c.petrolDiffPct : fuel === 'diesel' ? c.dieselDiffPct : c.keroseneDiffPct;
          const diffStr   = c.isSierraLeone ? 'Base' : `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%`;
          // Rank: plain #N instead of emoji medals
          const rankText  = c.rank <= 3 ? `#${c.rank} ${['1st','2nd','3rd'][c.rank-1]}` : `#${c.rank}`;
          // Country: name only, no emoji flag
          const countryText = safePdfText(c.name);
          // Currency: ISO code only (no special symbols like ₦ ₵)
          const currencyText = c.currencyCode;
          // Prices: use ISO code prefix instead of symbol
          const displayPrice = currency === 'usd' ? formatUSD(fuelUSD) : safePdfPrice(fuelLocal, c);
          return [
            rankText,
            countryText,
            currencyText,
            displayPrice,
            formatUSD(fuelUSD),
            safePdfPrice(fuelLocal, c),
            diffStr,
            new Date(c.lastUpdated).toLocaleDateString(),
          ];
        });

      // Add World Average Row to Table
      if (worldAvg && (worldAvg.petrol || worldAvg.diesel)) {
        const avgPrice = fuel === 'petrol' ? worldAvg.petrol : fuel === 'diesel' ? worldAvg.diesel : worldAvg.kerosene;
        tableData.push([
          '—',
          'World Average',
          'USD',
          avgPrice ? `$${avgPrice.toFixed(3)}` : '—',
          avgPrice ? `$${avgPrice.toFixed(3)}` : '—',
          '—',
          'Reference',
          worldAvg.asOfDate ? new Date(worldAvg.asOfDate + 'T00:00:00').toLocaleDateString() : '',
        ]);
      }

      autoTable(pdf, {
        startY: currentY,
        head: [['Rank', 'Country', 'Currency', 'Price', 'USD Equiv.', 'Local Price', 'vs SL', 'Updated']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 114, 198],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          6: { halign: 'center' },
        },
        margin: { top: margin, right: margin, bottom: margin + 15, left: margin },
        didParseCell: (data) => {
          // Highlight Sierra Leone row
          const row = tableData[data.row.index];
          if (row && row[6] === 'Base') {
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.textColor = [6, 95, 70];
          }
          // Color diff column
          if (data.column.index === 6 && data.section === 'body') {
            const val = String(data.cell.raw);
            if (val.startsWith('-')) data.cell.styles.textColor = [21, 128, 61];
            else if (val.startsWith('+')) data.cell.styles.textColor = [185, 28, 28];
          }
        },
      });

      // ── Footer on every page ──
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        pdf.text('Powered by Salone Fuel Monitor - salonefuelmonitor.com', margin, pageHeight - 10);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      pdf.save(`SFM_Regional_${fuelLabel}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err: any) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch Sierra Leone live prices from Firebase
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'price_trends'), orderBy('effectiveDate', 'desc'), limit(1)),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setSlPrices({
            Petrol: data.petrolPrice || 0,
            Diesel: data.dieselPrice || 0,
            Kerosene: data.kerosenePrice || 0
          });
        }
        setSlLoading(false);
      },
      (err) => {
        console.warn('Could not load SL prices:', err);
        setSlLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Fetch saved regional prices from Firebase
  const [regionalPrices, setRegionalPrices] = useState<Record<string, any>>({});
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'regional_fuel_prices'),
      (snap) => {
        const saved: Record<string, any> = {};
        snap.forEach(doc => { saved[doc.id] = doc.data(); });
        setRegionalPrices(saved);
      },
      (err) => console.warn('Could not load regional prices:', err)
    );
    return () => unsub();
  }, []);

  // Fetch world average prices
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'world_average_prices', 'current'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setWorldAvg({
            petrol:   d.petrol   ?? null,
            diesel:   d.diesel   ?? null,
            kerosene: d.kerosene ?? null,
            asOfDate: d.asOfDate ?? '',
          });
        }
      },
      (err) => console.warn('Could not load world avg prices:', err)
    );
    return () => unsub();
  }, []);

  // Merge live SL prices and saved regional prices into the countries list
  const countries = useMemo<RegionalCountry[]>(() => {
    return REGIONAL_COUNTRIES.map(c => {
      if (c.isSierraLeone && slPrices) {
        // Use admin-saved exchange rate for SL if available, otherwise fall back to static
        const savedSL = regionalPrices['SL'];
        const liveRate = savedSL?.exchangeRateToUSD ?? c.exchangeRateToUSD;
        return {
          ...c,
          exchangeRateToUSD: liveRate,
          prices: {
            petrol: slPrices.Petrol || c.prices.petrol,
            diesel: slPrices.Diesel || c.prices.diesel,
            kerosene: slPrices.Kerosene || c.prices.kerosene,
          },
          lastUpdated: new Date().toISOString(),
        };
      }
      
      // Override with DB saved prices if they exist
      const saved = regionalPrices[c.id];
      if (saved) {
        return {
          ...c,
          prices: {
            petrol: saved.petrol ?? c.prices.petrol,
            diesel: saved.diesel ?? c.prices.diesel,
            kerosene: saved.kerosene ?? c.prices.kerosene,
          },
          exchangeRateToUSD: saved.exchangeRateToUSD ?? c.exchangeRateToUSD,
          lastUpdated: saved.updatedAt ? new Date(saved.updatedAt.toMillis()).toISOString() : c.lastUpdated,
        };
      }

      return c;
    });
  }, [slPrices, regionalPrices]);

  const computed = useMemo(() => computeRegionalData(countries, fuel), [countries, fuel]);

  // Sorting for table view
  const sorted = useMemo(() => {
    const arr = [...computed];
    arr.sort((a, b) => {
      let av: number, bv: number;
      if (sortField === 'rank')      { av = a.rank; bv = b.rank; }
      else if (sortField === 'name') { av = a.name.localeCompare(b.name); bv = 0; return sortDir === 'asc' ? av : -av; }
      else if (sortField === 'petrol')   { av = a.petrolUSD; bv = b.petrolUSD; }
      else if (sortField === 'diesel')   { av = a.dieselUSD; bv = b.dieselUSD; }
      else if (sortField === 'kerosene') { av = a.keroseneUSD; bv = b.keroseneUSD; }
      else { // diff
        av = fuel === 'petrol' ? a.petrolDiffPct : fuel === 'diesel' ? a.dieselDiffPct : a.keroseneDiffPct;
        bv = fuel === 'petrol' ? b.petrolDiffPct : fuel === 'diesel' ? b.dieselDiffPct : b.keroseneDiffPct;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [computed, sortField, sortDir, fuel]);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  };

  const sl = computed.find(c => c.isSierraLeone);
  const cheapest = computed.find(c => c.rank === 1);
  const mostExp = computed.reduce((max, c) => c.rank > max.rank ? c : max, computed[0]);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] text-white">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
              <Globe className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">West Africa</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Regional Fuel Comparison</h1>
            </div>
          </div>
          <p className="text-gray-300 text-sm max-w-2xl">
            Compare fuel prices across 8 West African countries in real-time. Sierra Leone prices are live from official sources.
            All prices shown in USD equivalent for fair comparison.
          </p>

          {/* World Average Benchmark Banner */}
          {worldAvg && (worldAvg.petrol || worldAvg.diesel) && (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-xl shadow-black/10 border border-white/20">
                <div className="flex items-center gap-2 mr-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-black text-surface-900 uppercase tracking-wider">World Average</span>
                  {worldAvg.asOfDate && (
                    <span className="text-[10px] font-medium text-gray-500">
                      as of {new Date(worldAvg.asOfDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                {worldAvg.petrol && (
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
                    <Fuel className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-gray-600">Petrol</span>
                    <span className="text-sm font-black text-emerald-600">${worldAvg.petrol.toFixed(3)}<span className="text-[10px] font-bold text-gray-400 ml-0.5">/L</span></span>
                  </div>
                )}
                {worldAvg.diesel && (
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
                    <Fuel className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-medium text-gray-600">Diesel</span>
                    <span className="text-sm font-black text-blue-600">${worldAvg.diesel.toFixed(3)}<span className="text-[10px] font-bold text-gray-400 ml-0.5">/L</span></span>
                  </div>
                )}
                {worldAvg.kerosene && (
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
                    <Fuel className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-gray-600">Kerosene</span>
                    <span className="text-sm font-black text-amber-600">${worldAvg.kerosene.toFixed(3)}<span className="text-[10px] font-bold text-gray-400 ml-0.5">/L</span></span>
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-2 ml-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                The World Average is a global benchmark updated periodically to compare regional prices against the global norm.
              </p>
            </>
          )}

          {/* Stats row */}
          {!slLoading && sl && cheapest && (
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {/* SL Fuel Price */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/5" />
                <div className="relative">
                  <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-100 uppercase tracking-wider mb-3 inline-block">
                    SL {fuel}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none mb-1 truncate">
                    {formatUSD(fuel === 'petrol' ? sl.petrolUSD : fuel === 'diesel' ? sl.dieselUSD : sl.keroseneUSD)}
                  </p>
                  <p className="text-emerald-100/70 text-xs font-medium mt-2">
                    {formatLocal(fuel === 'petrol' ? sl.prices.petrol : fuel === 'diesel' ? sl.prices.diesel : sl.prices.kerosene, sl.currencySymbol)}
                  </p>
                </div>
              </div>

              {/* SL Rank */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/5" />
                <div className="relative">
                  <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/30 text-blue-100 uppercase tracking-wider mb-3 inline-block">
                    SL Rank
                  </span>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                      #{sl.rank}
                    </p>
                    {sl.rank <= 3 && (
                      <span className="text-2xl">{getRankMedal(sl.rank)}</span>
                    )}
                  </div>
                  <p className="text-blue-100/70 text-xs font-medium mt-2">
                    out of {computed.length} countries
                  </p>
                </div>
              </div>

              {/* Cheapest */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/5" />
                <div className="relative">
                  <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/30 text-purple-100 uppercase tracking-wider mb-3 inline-block">
                    Cheapest
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <span className="text-xl sm:text-2xl">{cheapest.flag}</span>
                    <p className="text-xl sm:text-2xl font-black tracking-tight leading-none truncate">
                      {cheapest.name}
                    </p>
                  </div>
                  <p className="text-purple-100/70 text-xs font-medium mt-2">
                    {formatUSD(fuel === 'petrol' ? cheapest.petrolUSD : fuel === 'diesel' ? cheapest.dieselUSD : cheapest.keroseneUSD)} {fuel}
                  </p>
                </div>
              </div>

              {/* Total Countries */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/5" />
                <div className="relative">
                  <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/30 text-amber-100 uppercase tracking-wider mb-3 inline-block">
                    Countries
                  </span>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none mb-1">
                    {computed.length}
                  </p>
                  <p className="text-amber-100/70 text-xs font-medium mt-2">
                    West Africa
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            {VIEW_MODES.map(vm => (
              <button
                key={vm.id}
                onClick={() => setViewMode(vm.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === vm.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {vm.icon}
                <span className="hidden sm:inline">{vm.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Fuel Type Dropdown */}
            <div className="relative">
              <Fuel className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value as FuelType)}
                className="pl-8 pr-8 py-2 text-xs font-bold bg-gray-100 border-none rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="petrol">⛽ Petrol</option>
                <option value="diesel">🛢️ Diesel</option>
                <option value="kerosene">🔥 Kerosene</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Currency Dropdown */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyMode)}
                className="pl-8 pr-8 py-2 text-xs font-bold bg-gray-100 border-none rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="usd">$ USD Equivalent</option>
                <option value="local">🏦 Local Currency</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting || slLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-500/20"
            >
              {isExporting
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => setLastRefreshed(new Date())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-6 text-xs text-blue-700">
          <Info className="w-4 h-4 shrink-0 text-blue-500" />
          <span>
            <strong>Sierra Leone</strong> prices are fetched live from official government sources.
            Other countries use the latest admin-verified data. Prices shown in USD use July 2026 exchange rates.
          </span>
        </div>

        {/* Loading state */}
        {slLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {viewMode === 'table' && (
              <TableView
                data={sorted}
                fuel={fuel}
                currency={currency}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                worldAvg={worldAvg}
              />
            )}
            {viewMode === 'card' && (
              <CardView data={sorted} fuel={fuel} currency={currency} worldAvg={worldAvg} />
            )}
            {viewMode === 'map' && (
              <MapView data={computed} fuel={fuel} currency={currency} />
            )}
            {/* Chart views wrapped in ref for PDF capture */}
            <div ref={chartRef}>
              {viewMode === 'bar' && (
                <BarChartView data={computed} fuel={fuel} />
              )}
              {viewMode === 'line' && (
                <LineChartView data={computed} fuel={fuel} />
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
