import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  db,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
} from '../firebase';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Table as TableIcon,
  LineChart as LineChartIcon,
  BarChart3,
  DollarSign,
  ArrowRight,
  Download,
  RefreshCw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toCanvas } from 'html-to-image';
import { getLogoBase64, drawPdfHeader } from '../utils/pdfUtils';
import { trackPdfExport } from '../hooks/useAnalytics';

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

type Benchmark = 'brentUSD' | 'wtiUSD' | 'opecUSD' | 'averageUSD';
type ViewMode = 'chart' | 'table';

const SEED_RECORDS = [
  {
    monthLabel: 'May 2026',
    date: new Date('2026-05-01T00:00:00'),
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
    date: new Date('2026-07-01T00:00:00'),
    brentUSD: 72,
    wtiUSD: 68,
    opecUSD: 71,
    petrolNLe: 33,
    dieselNLe: 35,
    keroseneNLe: 0,
    notes: 'Backfilled record',
  },
];

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

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function fallbackMonthDate(monthLabel: string): Date | null {
  if (!monthLabel) return null;
  const d = new Date(`${monthLabel} 1`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function recordDate(record: BarrelFuelSnapshot): Date | null {
  return toDate(record.date) || fallbackMonthDate(record.monthLabel);
}

function dateValue(record: BarrelFuelSnapshot): number {
  return recordDate(record)?.getTime() ?? 0;
}

function formatRecordDate(record: BarrelFuelSnapshot): string {
  const d = recordDate(record);
  if (!d) return record.monthLabel || 'Unknown date';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function positiveOrNull(value: number): number | null {
  return Number.isFinite(value) && value > 0 ? value : null;
}

export default function BarrelVsFuel() {
  const [records, setRecords] = useState<BarrelFuelSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [benchmark, setBenchmark] = useState<Benchmark>('brentUSD');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [seeded, setSeeded] = useState(false);
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

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
      } catch (error) {
        console.warn('Seed skipped:', error);
      }
    }
    seedIfEmpty();
  }, [seeded]);

  useEffect(() => {
    const q = query(collection(db, 'barrelFuelSnapshots'), orderBy('date', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as BarrelFuelSnapshot));
        next.sort((a, b) => dateValue(a) - dateValue(b));
        setRecords(next);
        setLoading(false);
      },
      (error) => {
        console.error('barrelFuelSnapshots listener error:', error);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((r) => recordDate(r)?.getFullYear()?.toString())
          .filter((v): v is string => Boolean(v)),
      ),
    ).sort((a, b) => Number(b) - Number(a));
  }, [records]);

  const availableMonths = useMemo(() => {
    return Array.from(
      new Set(
        records
          .filter((r) => filterYear === 'all' || recordDate(r)?.getFullYear().toString() === filterYear)
          .map((r) => recordDate(r)?.toLocaleString('en-US', { month: 'long' }))
          .filter((v): v is string => Boolean(v)),
      ),
    );
  }, [records, filterYear]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        const d = recordDate(r);
        if (!d) return filterYear === 'all' && filterMonth === 'all';
        const year = d.getFullYear().toString();
        const month = d.toLocaleString('en-US', { month: 'long' });
        if (filterYear !== 'all' && year !== filterYear) return false;
        if (filterMonth !== 'all' && month !== filterMonth) return false;
        return true;
      })
      .sort((a, b) => dateValue(a) - dateValue(b));
  }, [records, filterYear, filterMonth]);

  const tableRecords = useMemo(
    () => [...filteredRecords].sort((a, b) => dateValue(b) - dateValue(a)),
    [filteredRecords],
  );

  const chartData = useMemo(() => {
    return filteredRecords.map((r) => {
      const avgUSD = (r.brentUSD + r.wtiUSD + r.opecUSD) / 3;
      return {
        label: formatRecordDate(r),
        barrel: benchmark === 'averageUSD' ? avgUSD : positiveOrNull(r[benchmark] as number),
        Petrol: positiveOrNull(r.petrolNLe),
        Diesel: positiveOrNull(r.dieselNLe),
        Kerosene: positiveOrNull(r.keroseneNLe),
      };
    });
  }, [filteredRecords, benchmark]);

  const latest = filteredRecords.length ? filteredRecords[filteredRecords.length - 1] : null;
  const previous = filteredRecords.length > 1 ? filteredRecords[filteredRecords.length - 2] : null;

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      trackPdfExport('Barrel vs Fuel Report');

      const logo = await getLogoBase64();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      let currentY = drawPdfHeader(pdf, 'Barrel vs Fuel Tracker Report', logo);

      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198);
      pdf.text('Barrel vs Fuel Price Analysis', margin, currentY);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      currentY += 8;
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, currentY);

      currentY += 6;
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 12;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198);
      pdf.text('Analysis Parameters', margin, currentY);

      currentY += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      [
        `Benchmark: ${BENCHMARK_LABELS[benchmark]}`,
        `Year: ${filterYear === 'all' ? 'All Years' : filterYear}`,
        `Month: ${filterMonth === 'all' ? 'All Months' : filterMonth}`,
      ].forEach((item) => {
        pdf.text(`• ${item}`, margin + 2, currentY);
        currentY += 5;
      });
      currentY += 5;

      if (chartRef.current && viewMode === 'chart') {
        const canvas = await toCanvas(chartRef.current, { backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const chartWidth = pageWidth - margin * 2;
        const chartHeight = (canvas.height * chartWidth) / canvas.width;
        if (currentY + chartHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.addImage(imgData, 'PNG', margin, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 15;
      }

      if (tableRecords.length > 0) {
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 114, 198);
        pdf.text('Historical Data', margin, currentY);
        currentY += 5;

        const body = tableRecords.map((rec) => {
          const avgUSD = (rec.brentUSD + rec.wtiUSD + rec.opecUSD) / 3;
          return [
            formatRecordDate(rec),
            `$${rec.brentUSD.toFixed(2)}`,
            `$${rec.wtiUSD.toFixed(2)}`,
            `$${rec.opecUSD.toFixed(2)}`,
            `$${avgUSD.toFixed(2)}`,
            `Le ${rec.petrolNLe.toFixed(2)}`,
            `Le ${rec.dieselNLe.toFixed(2)}`,
            rec.keroseneNLe > 0 ? `Le ${rec.keroseneNLe.toFixed(2)}` : '-',
            rec.notes || '-',
          ];
        });

        autoTable(pdf, {
          startY: currentY,
          head: [['Effective Date', 'Brent ($)', 'WTI ($)', 'OPEC ($)', 'Avg ($)', 'Petrol (Le)', 'Diesel (Le)', 'Kerosene (Le)', 'Notes']],
          body,
          theme: 'striped',
          headStyles: { fillColor: [0, 114, 198], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8.5, cellPadding: 3.5 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });
      }

      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`Page ${i} of ${pageCount} • Salone Fuel Monitor`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      pdf.save(`Barrel_vs_Fuel_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const latestAvg = latest ? (latest.brentUSD + latest.wtiUSD + latest.opecUSD) / 3 : 0;
  const previousAvg = previous ? (previous.brentUSD + previous.wtiUSD + previous.opecUSD) / 3 : 0;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A]">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-200 text-sm font-medium mb-2">
                <BarChart3 className="h-4 w-4" />
                <span>Market Intelligence</span>
                <ArrowRight className="h-3 w-3" />
                <span>Barrel vs Fuel</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Barrel vs Fuel Price Tracker</h1>
              <p className="text-blue-100 text-base max-w-xl">
                Compare global crude oil barrel prices against Sierra Leone&apos;s pump prices at the time of each official price update.
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
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {latest && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Brent Crude',
                value: `$${latest.brentUSD}`,
                unit: '/bbl',
                diff: previous ? latest.brentUSD - previous.brentUSD : 0,
                icon: DollarSign,
                color: '#0072C6',
              },
              {
                label: 'WTI Crude',
                value: `$${latest.wtiUSD}`,
                unit: '/bbl',
                diff: previous ? latest.wtiUSD - previous.wtiUSD : 0,
                icon: DollarSign,
                color: '#10B981',
              },
              {
                label: 'OPEC Basket',
                value: `$${latest.opecUSD}`,
                unit: '/bbl',
                diff: previous ? latest.opecUSD - previous.opecUSD : 0,
                icon: DollarSign,
                color: '#F59E0B',
              },
              {
                label: 'Combined Average',
                value: `$${latestAvg.toFixed(2)}`,
                unit: '/bbl',
                diff: previous ? latestAvg - previousAvg : 0,
                icon: DollarSign,
                color: '#8B5CF6',
              },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                  <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {kpi.value}
                  <span className="text-xs text-gray-400 font-normal ml-1">{kpi.unit}</span>
                </div>
                {kpi.diff !== 0 && (
                  <div className={`text-xs mt-1 font-medium ${kpi.diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {kpi.diff > 0 ? '▲' : '▼'} {Math.abs(kpi.diff).toFixed(2)} vs prev
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">as of {formatRecordDate(latest)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'chart' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LineChartIcon className="h-4 w-4" /> Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TableIcon className="h-4 w-4" /> Table
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setFilterMonth('all');
                }}
                className="block rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
              >
                <option value="all">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="block rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
              >
                <option value="all">All Months</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          {viewMode === 'chart' && (
            <div className="flex items-center gap-2">
              <label htmlFor="benchmark-select" className="text-sm text-gray-500 font-medium shrink-0">Barrel Benchmark:</label>
              <select
                id="benchmark-select"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value as Benchmark)}
                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
              >
                {(Object.keys(BENCHMARK_LABELS) as Benchmark[]).map((key) => (
                  <option key={key} value={key}>{BENCHMARK_LABELS[key]}</option>
                ))}
              </select>
            </div>
          )}
        </div>

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
          <div ref={chartRef} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-gray-900">{BENCHMARK_LABELS[benchmark]} vs Pump Prices</h2>
              <span className="ml-auto text-xs text-gray-400">Left axis: USD/bbl · Right axis: NLe/L</span>
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} minTickGap={12} />
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
                    if (value == null) return ['No price recorded', name];
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
                  connectNulls={false}
                />
                <Line yAxisId="fuel" type="monotone" dataKey="Petrol" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" connectNulls={false} />
                <Line yAxisId="fuel" type="monotone" dataKey="Diesel" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" connectNulls={false} />
                <Line yAxisId="fuel" type="monotone" dataKey="Kerosene" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400 text-center mt-3">
              Each point uses the record&apos;s actual effective date. Solid line = barrel price (USD/bbl) · Dashed lines = pump prices (NLe/L).
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-gray-900 text-base">Historical Snapshot Records</h2>
              <span className="ml-auto text-xs text-gray-400">{tableRecords.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Effective Date</th>
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
                  {tableRecords.map((r, i) => {
                    const avgUSD = (r.brentUSD + r.wtiUSD + r.opecUSD) / 3;
                    return (
                      <tr key={r.id} className={`hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatRecordDate(r)}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#0072C6] font-semibold">${r.brentUSD}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#10B981] font-semibold">${r.wtiUSD}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#F59E0B] font-semibold">${r.opecUSD}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#8B5CF6] font-semibold">${avgUSD.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">{r.petrolNLe > 0 ? `Le ${r.petrolNLe}` : '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">{r.dieselNLe > 0 ? `Le ${r.dieselNLe}` : '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">{r.keroseneNLe > 0 ? `Le ${r.keroseneNLe}` : '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{r.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <div className="flex gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">How to read this chart</p>
              <p className="text-sm text-blue-700">
                Each data point represents a dated snapshot of global crude benchmarks and Sierra Leone pump prices. Multiple updates in the same month remain separate because the graph uses the record&apos;s actual date rather than only the month name.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
