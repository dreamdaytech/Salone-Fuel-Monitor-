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
  badgeClass,
  explanation,
}: {
  label: string;
  price: number | null;
  change: number | null;
  colorClass: string;
  badgeClass: string;
  explanation: string;
}) {
  if (!price) return null;

  const isPos = (change ?? 0) > 0;
  const isNeg = (change ?? 0) < 0;

  return (
    <div title={explanation} className={`bg-gradient-to-br ${colorClass} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex-1 min-w-[200px] group cursor-help`}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
      <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/5" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass} uppercase tracking-wider`}>
            {label}
          </span>
          <Info className="w-4 h-4 text-white/40" />
        </div>
        
        <div>
          <p className="text-3xl font-black tracking-tight leading-none mb-2">
            ${price.toFixed(2)}<span className="text-sm font-medium text-white/60 ml-1">/bbl</span>
          </p>
          
          {change !== null && (
            <div className="flex items-center mt-2">
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isPos ? 'bg-rose-500/30 text-rose-100' : isNeg ? 'bg-emerald-500/30 text-emerald-100' : 'bg-white/20 text-white'
              }`}>
                {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {change > 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

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
    <div title={explanation} className="flex flex-col relative group cursor-help min-w-[120px]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">{label}</span>
        <Info className="w-3 h-3 text-white/30" />
      </div>
      <span className={`text-2xl font-black ${color}`}>{value.toFixed(1)}<span className="text-sm font-semibold opacity-70 ml-0.5">{unit}</span></span>

      {/* Custom Tooltip */}
      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-white text-surface-900 text-[11px] rounded-xl z-50 font-medium normal-case tracking-normal shadow-xl text-center pointer-events-none">
        {explanation}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
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
            <div className="flex flex-col sm:flex-row gap-4">
              <PriceChip
                label="Brent Crude"
                price={crudeOil.brent}
                change={crudeOil.brentChange}
                colorClass="from-blue-600 to-blue-800"
                badgeClass="bg-blue-500/30 text-blue-100"
                explanation="The global benchmark for sweet light crude oil. Heavily impacts Atlantic basin fuel prices."
              />
              <PriceChip
                label="WTI Crude"
                price={crudeOil.wti}
                change={crudeOil.wtiChange}
                colorClass="from-emerald-600 to-emerald-800"
                badgeClass="bg-emerald-500/30 text-emerald-100"
                explanation="West Texas Intermediate. The primary benchmark for US oil prices."
              />
              <PriceChip
                label="OPEC Basket"
                price={crudeOil.opec}
                change={crudeOil.opecChange}
                colorClass="from-amber-500 to-amber-700"
                badgeClass="bg-amber-400/30 text-amber-100"
                explanation="A weighted average of prices for petroleum blends produced by OPEC members."
              />
            </div>
          </div>
        )}

        {/* ── Economic Indicators Row ── */}
        {hasEcon && (
          <div className="bg-surface-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-lg mt-6">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
              <Activity className="w-48 h-48" />
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                SL Economic Indicators
                {economic.dataYear && <span className="ml-1 text-emerald-400/70">({economic.dataYear})</span>}
              </p>
              
              <div className="flex flex-wrap gap-x-10 gap-y-6">
                <EconBadge 
                  label="CPI Inflation" 
                  value={economic.cpiInflation} 
                  unit="%" 
                  color="text-orange-400" 
                  explanation="Consumer Price Index inflation rate. High inflation can reduce purchasing power and affect fuel subsidies."
                />
                <EconBadge 
                  label="GDP Growth" 
                  value={economic.gdpGrowth} 
                  unit="%" 
                  color="text-blue-400" 
                  explanation="The annual economic growth rate. Strong growth often increases national fuel demand."
                />
                <EconBadge 
                  label="Fuel Import %" 
                  value={economic.fuelImportPct} 
                  unit="%" 
                  color="text-purple-400" 
                  explanation="The percentage of total national imports that consist of fuel products. High dependency can stress foreign exchange."
                />
                {economic.gdpPerCapita && (
                  <div title="Economic output per person, indicating the average purchasing power of the population." className="flex flex-col relative group cursor-help min-w-[120px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">GDP Per Capita</span>
                      <Info className="w-3 h-3 text-white/30" />
                    </div>
                    <span className="text-2xl font-black text-emerald-400">${economic.gdpPerCapita.toFixed(0)}</span>
                    
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-white text-surface-900 text-[11px] rounded-xl z-50 font-medium normal-case tracking-normal shadow-xl text-center pointer-events-none">
                      Economic output per person, indicating the average purchasing power of the population.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                )}
              </div>
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
