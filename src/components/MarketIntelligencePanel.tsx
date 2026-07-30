import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart2, Activity, AlertTriangle, Info, Zap } from 'lucide-react';
import { MarketIntelligenceData, computePriceCorrelation } from '../lib/marketIntelligence';

interface Props {
  data: MarketIntelligenceData;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function PriceChip({
  label,
  price,
  change,
  colorClass,
  explanation,
}: {
  label: string;
  price: number | null;
  change: number | null;
  colorClass: string;
  explanation: string;
}) {
  if (!price) return null;

  const isPos = (change ?? 0) > 0;
  const isNeg = (change ?? 0) < 0;

  return (
    <div title={explanation} className={`flex flex-col gap-1 ${colorClass} rounded-xl px-3 py-2.5 min-w-[110px] relative group cursor-help`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        <Info className="w-3 h-3 opacity-40 shrink-0" />
      </div>
      <p className="text-base font-black">${price.toFixed(2)}<span className="text-[10px] font-normal opacity-60">/bbl</span></p>
      {change !== null && (
        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${isPos ? 'text-red-500' : isNeg ? 'text-emerald-500' : 'opacity-60'}`}>
          {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {change > 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}

      {/* Custom Tooltip (hidden by default, shown on group-hover) */}
      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-gray-900 text-white text-[11px] rounded-xl z-50 font-medium normal-case tracking-normal shadow-xl text-center pointer-events-none">
        {explanation}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

function EconBadge({ label, value, unit, color, explanation }: { label: string; value: number | null; unit: string; color: string; explanation: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div title={explanation} className="flex flex-col relative group cursor-help">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</span>
        <Info className="w-3 h-3 text-gray-400" />
      </div>
      <span className={`text-sm font-black ${color}`}>{value.toFixed(1)}{unit}</span>

      {/* Custom Tooltip */}
      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-gray-900 text-white text-[11px] rounded-xl z-50 font-medium normal-case tracking-normal shadow-xl text-center pointer-events-none">
        {explanation}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketIntelligencePanel({ data }: Props) {
  const { crudeOil, economic } = data;

  const hasCrude = crudeOil && (crudeOil.brent || crudeOil.wti || crudeOil.opec);
  const hasEcon  = economic && (economic.cpiInflation !== null || economic.gdpGrowth !== null || economic.fuelImportPct !== null);

  const correlation = computePriceCorrelation(hasCrude ? crudeOil : null);

  if (!hasCrude && !hasEcon) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-2">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
        <BarChart2 className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Market Intelligence</span>
        {data.lastUpdated && (
          <span className="ml-auto text-[10px] text-gray-400 font-medium">
            Updated {new Date(data.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* ── Crude Oil Prices Row ── */}
        {hasCrude && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              🛢️ Global Oil Prices
            </p>
            <div className="flex flex-wrap gap-2.5">
              <PriceChip
                label="Brent Crude"
                price={crudeOil.brent}
                change={crudeOil.brentChange}
                colorClass="bg-blue-50 border border-blue-100 text-blue-900"
                explanation="The global benchmark for sweet light crude oil. Heavily impacts Atlantic basin fuel prices."
              />
              <PriceChip
                label="WTI Crude"
                price={crudeOil.wti}
                change={crudeOil.wtiChange}
                colorClass="bg-teal-50 border border-teal-100 text-teal-900"
                explanation="West Texas Intermediate. The primary benchmark for US oil prices."
              />
              <PriceChip
                label="OPEC Basket"
                price={crudeOil.opec}
                change={crudeOil.opecChange}
                colorClass="bg-amber-50 border border-amber-100 text-amber-900"
                explanation="A weighted average of prices for petroleum blends produced by OPEC members."
              />
            </div>
          </div>
        )}

        {/* ── Economic Indicators Row ── */}
        {hasEcon && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              SL Economic Indicators
              {economic.dataYear && <span className="ml-1 text-gray-300">({economic.dataYear})</span>}
            </p>
            <div className="bg-gray-50 rounded-xl px-4 py-3.5 flex flex-wrap gap-x-8 gap-y-3 border border-gray-100">
              <EconBadge 
                label="CPI Inflation" 
                value={economic.cpiInflation} 
                unit="%" 
                color="text-orange-500" 
                explanation="Consumer Price Index inflation rate. High inflation can reduce purchasing power and affect fuel subsidies."
              />
              <EconBadge 
                label="GDP Growth" 
                value={economic.gdpGrowth} 
                unit="%" 
                color="text-blue-500" 
                explanation="The annual economic growth rate. Strong growth often increases national fuel demand."
              />
              <EconBadge 
                label="Fuel Import %" 
                value={economic.fuelImportPct} 
                unit="%" 
                color="text-purple-500" 
                explanation="The percentage of total national imports that consist of fuel products. High dependency can stress foreign exchange."
              />
              {economic.gdpPerCapita && (
                <div title="Economic output per person, indicating the average purchasing power of the population." className="flex flex-col relative group cursor-help">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">GDP per Capita</span>
                    <Info className="w-3 h-3 text-gray-400" />
                  </div>
                  <span className="text-sm font-black text-emerald-600">${economic.gdpPerCapita.toLocaleString()}</span>
                  
                  {/* Custom Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-gray-900 text-white text-[11px] rounded-xl z-50 font-medium normal-case tracking-normal shadow-xl text-center pointer-events-none">
                    Economic output per person, indicating the average purchasing power of the population.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Why Prices Changed Smart Notice ── */}
        {correlation && (
          <div className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 ${
            correlation.level === 'warning'
              ? 'bg-red-50 border border-red-100'
              : correlation.level === 'positive'
                ? 'bg-emerald-50 border border-emerald-100'
                : 'bg-blue-50 border border-blue-100'
          }`}>
            {correlation.level === 'warning'
              ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              : correlation.level === 'positive'
                ? <TrendingDown className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                : <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            }
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mb-1 ${
                correlation.level === 'warning' ? 'text-red-700' : correlation.level === 'positive' ? 'text-emerald-700' : 'text-blue-700'
              }`}>
                <Zap className="w-3 h-3" /> Why prices may change
              </span>
              <p className={`text-xs font-medium leading-relaxed ${
                correlation.level === 'warning' ? 'text-red-800'
                  : correlation.level === 'positive' ? 'text-emerald-800'
                  : 'text-blue-800'
              }`}>
                {correlation.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
