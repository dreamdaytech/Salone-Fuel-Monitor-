import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs
} from '../firebase';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Table as TableIcon, LineChart as LineChartIcon,
  BarChart3, DollarSign, Fuel, ArrowRight, Download, RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBase64, drawPdfHeader } from '../utils/pdfUtils';
import { toCanvas } from 'html-to-image';

// ---------- types ----------
interface BarrelFuelSnapshot {
  id: string;
  monthLabel: string;
  date: any;
  brentUSD: number;
  wtiUSD: number;
  opecUSD: number;
  petrolNLe: number;
  dieselNLe: number;
  keroseneNLe: number;
  notes?: string;
}

// ---------- seed data ----------
const SEED_RECORDS = [
  {
    monthLabel: 'May 2026',
    date: new Date('2026-05-01'),
    brentUSD: 110,
    wtiUSD: 106,
    opecUSD: 109,
    petrolNLe: 35,
    dieselNLe: 40,
    keroseneNLe: 0,
    notes: 'Backfilled record',
  },
  {
    monthLabel: 'July 2026',
    date: new Date('2026-07-01'),
    brentUSD: 72,
    wtiUSD: 68,
    opecUSD: 71,
    petrolNLe: 33,
    dieselNLe: 35,
    keroseneNLe: 0,
    notes: 'Backfilled record',
  },
];

type Benchmark = 'brentUSD' | 'wtiUSD' | 'opecUSD' | 'averageUSD';
type ViewMode = 'chart' | 'table';

const BENCHMARK_LABELS: Record<Benchmark, string> = {
  brentUSD: 'Brent Crude',
  wtiUSD: 'WTI Crude',
  opecUSD: 'OPEC Basket',
  averageUSD: 'Combined Average',
};

const BENCHMARK_COLORS: Record<Benchmark, string> = {
  brentUSD: '#0072C6',
  wtiUSD: '#10B981',
  opecUSD: '#F59E0B',
  averageUSD: '#8B5CF6',
};

// ---------- component ----------
export default function BarrelVsFuel() {

  const [records, setRecords] = useState<BarrelFuelSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [benchmark, setBenchmark] = useState<Benchmark>('brentUSD');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [seeded, setSeeded] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = React.useRef<HTMLDivElement>(null);

  // Seed initial data if collection is empty
  useEffect(() => {
    async function seedIfEmpty() {
      try {
        const snap = await getDocs(collection(db, 'barrelFuelSnapshots'));
        if (snap.empty && !seeded) {
          setSeeded(true);
          for (const rec of SEED_RECORDS) {
            await addDoc(collection(db, 'barrelFuelSnapshots'), {
              ...rec,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (e) {
        console.warn('Seed skipped:', e);
      }
    }
    seedIfEmpty();
  }, []);

  // Live data listener
  useEffect(() => {
    const q = query(collection(db, 'barrelFuelSnapshots'), orderBy('date', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRecords(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        );
        setLoading(false);
      },
      (err) => {
        console.error('barrelFuelSnapshots listener error:', err);
        setLoading(false);
      }
    );
  

  return () => unsub();
  }, []);

  // Derive unique years and months from loaded records
  const availableYears = Array.from(new Set(records.map((r) => r.monthLabel.split(' ')[1]))).sort();
  const availableMonths = Array.from(
    new Set(
      records
        .filter((r) => filterYear === 'all' || r.monthLabel.split(' ')[1] === filterYear)
        .map((r) => r.monthLabel.split(' ')[0])
    )
  );

  // Apply filters
  const filteredRecords = records.filter((r) => {
    const [mon, yr] = r.monthLabel.split(' ');
    if (filterYear !== 'all' && yr !== filterYear) return false;
    if (filterMonth !== 'all' && mon !== filterMonth) return false;
    return true;
  });

  // Chart data: merge barrel + fuel on same x-axis point
  const chartData = filteredRecords.map((r) => {
    const avgUSD = (r.brentUSD + r.wtiUSD + r.opecUSD) / 3;
    return {
      label: r.monthLabel,
      barrel: benchmark === 'averageUSD' ? avgUSD : r[benchmark] ?? null,
      Petrol: r.petrolNLe || null,
      Diesel: r.dieselNLe || null,
      Kerosene: r.keroseneNLe || null,
      averageUSD: avgUSD,
    };
  });

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      const logo = await getLogoBase64();
      const pdf = new jsPDF('p', 'mm', 'a4'); 
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      
      let currentY = drawPdfHeader(pdf, 'Barrel vs Fuel Tracker Report', logo);

      // --- Report Title & Meta ---
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198); // Sierra Leone Blue
      pdf.text('Barrel vs Fuel Price Analysis', margin, currentY);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139); // slate-500
      currentY += 8;
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, currentY);

      // Accent Line
      currentY += 6;
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY, pageWidth - margin, currentY);

      // --- Analysis Parameters ---
      currentY += 12;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198); // Sierra Leone Blue
      pdf.text('Analysis Parameters', margin, currentY);
      
      currentY += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      
      const filters = [
        `Benchmark: ${BENCHMARK_LABELS[benchmark]}`,
        `Year: ${filterYear === 'all' ? 'All Years' : filterYear}`,
        `Month: ${filterMonth === 'all' ? 'All Months' : filterMonth}`
      ];
      
      filters.forEach(filter => {
        pdf.text(`• ${filter}`, margin + 2, currentY);
        currentY += 5;
      });
      currentY += 5;

      // --- Chart ---
      if (chartRef.current && viewMode !== 'table') {
        const canvas = await toCanvas(chartRef.current, { backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const chartWidth = pageWidth - (margin * 2);
        const chartHeight = (canvas.height * chartWidth) / canvas.width;
        
        if (currentY + chartHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.addImage(imgData, 'PNG', margin, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 15;
      }

      // --- Table Data ---
      if (filteredRecords.length > 0) {
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 114, 198);
        pdf.text('Historical Data', margin, currentY);
        currentY += 5;

        const tableBody = filteredRecords.map(rec => {
          const avgUSD = (rec.brentUSD + rec.wtiUSD + rec.opecUSD) / 3;

          return [
            rec.monthLabel,
            `$${rec.brentUSD.toFixed(2)}`,
            `$${rec.wtiUSD.toFixed(2)}`,
            `$${rec.opecUSD.toFixed(2)}`,
            `$${avgUSD.toFixed(2)}`,
            `Le ${rec.petrolNLe.toFixed(2)}`,
            `Le ${rec.dieselNLe.toFixed(2)}`,
            `Le ${(rec.keroseneNLe || 0).toFixed(2)}`,
            rec.notes || '-'
          ];
        });

        autoTable(pdf, {
          startY: currentY,
          head: [['Month', 'Brent ($)', 'WTI ($)', 'OPEC ($)', 'Avg ($)', 'Petrol (Le)', 'Diesel (Le)', 'Kerosene (Le)', 'Notes']],
          body: tableBody,
          theme: 'striped',
          headStyles: {
            fillColor: [0, 114, 198],
            textColor: 255,
            fontStyle: 'bold',
          },
          styles: {
            fontSize: 9,
            cellPadding: 4,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
        });
      }

      // --- Footer ---
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        const footerText = `Page ${i} of ${pageCount} • Salone Fuel Monitor`;
        pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      pdf.save(`Barrel_vs_Fuel_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A]">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-200 text-sm font-medium mb-2">
                <BarChart3 className="h-4 w-4" />
                <span>Market Intelligence</span>
                <ArrowRight className="h-3 w-3" />
                <span>Barrel vs Fuel</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
                Barrel vs Fuel Price Tracker
              </h1>
              <p className="text-blue-100 text-base max-w-xl">
                Compare global crude oil barrel prices against Sierra Leone's pump prices at the time of each official price update.
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <Link
                to="/price-trends"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/80 px-4 py-2 rounded-lg text-sm transition-colors border border-white/20"
              >
                ← Back to Price Trends
              </Link>

              <button
                onClick={handleExportPDF}
                disabled={isExporting || loading || filteredRecords.length === 0}
                className="flex items-center justify-center gap-2 bg-white text-[#005aa0] hover:bg-gray-50 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#005aa0]" />
                ) : (
                  <Download className="w-4 h-4 text-[#005aa0]" />
                )}
                <span>Export Report</span>
              </button>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* KPI Cards */}
        {(() => {
          if (filteredRecords.length === 0) return null;
          const latest = filteredRecords[filteredRecords.length - 1];
          const prev = filteredRecords.length > 1 ? filteredRecords[filteredRecords.length - 2] : null;
          const brentDiff = prev ? latest.brentUSD - prev.brentUSD : 0;
          const wtiDiff = prev ? latest.wtiUSD - prev.wtiUSD : 0;
          const opecDiff = prev ? latest.opecUSD - prev.opecUSD : 0;
          const petrolDiff = prev ? latest.petrolNLe - prev.petrolNLe : 0;
          
          const latestAvg = (latest.brentUSD + latest.wtiUSD + latest.opecUSD) / 3;
          const prevAvg = prev ? (prev.brentUSD + prev.wtiUSD + prev.opecUSD) / 3 : 0;
          const avgDiff = prev ? latestAvg - prevAvg : 0;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Brent Crude', value: `$${latest.brentUSD}`, unit: '/bbl', diff: brentDiff, icon: DollarSign, color: '#0072C6' },
                { label: 'WTI Crude', value: `$${latest.wtiUSD}`, unit: '/bbl', diff: wtiDiff, icon: DollarSign, color: '#10B981' },
                { label: 'OPEC Basket', value: `$${latest.opecUSD}`, unit: '/bbl', diff: opecDiff, icon: DollarSign, color: '#F59E0B' },
                { label: 'Combined Average', value: `$${latestAvg.toFixed(2)}`, unit: '/bbl', diff: avgDiff, icon: DollarSign, color: '#8B5CF6' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                    <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{kpi.value}<span className="text-xs text-gray-400 font-normal ml-1">{kpi.unit}</span></div>
                  {kpi.diff !== 0 && (
                    <div className={`text-xs mt-1 font-medium ${kpi.diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {kpi.diff > 0 ? '▲' : '▼'} {Math.abs(kpi.diff).toFixed(2)} vs prev
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                    <span>as of {latest.monthLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* View toggle & Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'chart' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LineChartIcon className="h-4 w-4" /> Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <TableIcon className="h-4 w-4" /> Table
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setFilterMonth('all'); // reset month when year changes
                }}
                className="block rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
              >
                <option value="all">All Years</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="block rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
              >
                <option value="all">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Benchmark selector */}
          {viewMode === 'chart' && (
            <div className="flex items-center gap-2">
              <label htmlFor="benchmark-select" className="text-sm text-gray-500 font-medium shrink-0">
                Barrel Benchmark:
              </label>
              <select
                id="benchmark-select"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value as Benchmark)}
                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
              >
                {(Object.keys(BENCHMARK_LABELS) as Benchmark[]).map((b) => (
                  <option key={b} value={b}>
                    {BENCHMARK_LABELS[b]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No records found for the selected criteria.</p>
          </div>
        ) : viewMode === 'chart' ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-gray-900">
                {BENCHMARK_LABELS[benchmark]} vs Pump Prices
              </h2>
              <span className="ml-auto text-xs text-gray-400">Left axis: USD/bbl · Right axis: NLe/L</span>
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  yAxisId="barrel"
                  orientation="left"
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{ value: 'USD/bbl', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#94a3b8' } }}
                />
                <YAxis
                  yAxisId="fuel"
                  orientation="right"
                  tickFormatter={(v) => `Le${v}`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{ value: 'NLe/L', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 11, fill: '#94a3b8' } }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(value: any, name: string) => {
                    if (name === 'barrel') return [`$${value}`, BENCHMARK_LABELS[benchmark]];
                    return [`Le ${value}`, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => value === 'barrel' ? BENCHMARK_LABELS[benchmark] : value} />
                <Line
                  yAxisId="barrel"
                  type="monotone"
                  dataKey="barrel"
                  stroke={BENCHMARK_COLORS[benchmark]}
                  strokeWidth={3}
                  dot={{ r: 5, fill: BENCHMARK_COLORS[benchmark] }}
                  activeDot={{ r: 7 }}
                  connectNulls
                />
                <Line yAxisId="fuel" type="monotone" dataKey="Petrol" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" connectNulls />
                <Line yAxisId="fuel" type="monotone" dataKey="Diesel" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" connectNulls />
                <Line yAxisId="fuel" type="monotone" dataKey="Kerosene" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400 text-center mt-3">
              Solid line = barrel price (USD/bbl) · Dashed lines = pump prices (NLe/L)
            </p>
          </div>
        ) : (
          /* Table view */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-gray-900 text-base">Historical Snapshot Records</h2>
              <span className="ml-auto text-xs text-gray-400">{filteredRecords.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Month</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#0072C6]">Brent ($)</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#10B981]">WTI ($)</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#F59E0B]">OPEC ($)</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#8B5CF6]">Average ($)</th>
                    <th className="text-right px-4 py-3 font-semibold">Petrol (Le)</th>
                    <th className="text-right px-4 py-3 font-semibold">Diesel (Le)</th>
                    <th className="text-right px-4 py-3 font-semibold">Kerosene (Le)</th>
                    <th className="text-left px-4 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredRecords.map((r, i) => {
                    const avgUSD = (r.brentUSD + r.wtiUSD + r.opecUSD) / 3;
                    return (
                      <tr key={r.id} className={`hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{r.monthLabel}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#0072C6] font-semibold">${r.brentUSD}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#10B981] font-semibold">${r.wtiUSD}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#F59E0B] font-semibold">${r.opecUSD}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#8B5CF6] font-semibold">${avgUSD.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">Le {r.petrolNLe}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">Le {r.dieselNLe}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">Le {r.keroseneNLe}</td>
                        <td className="px-4 py-3 text-gray-500">{r.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insight callout */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <div className="flex gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">How to read this chart</p>
              <p className="text-sm text-blue-700">
                Each data point represents a moment when Sierra Leone officially published new fuel prices.
                The barrel price shown is the global crude benchmark price at that exact time.
                This allows you to track whether local fuel prices move in proportion to global crude market changes.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
