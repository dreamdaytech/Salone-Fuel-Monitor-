import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { 
  Activity, History, ChevronDown, Download, Search, SlidersHorizontal, 
  ArrowUpDown, Calendar, X, Filter, RotateCcw, TrendingUp, TrendingDown, 
  Minus, Fuel, DollarSign, Table as TableIcon, LineChart as LineChartIcon, BarChart3, RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export default function PriceTrends() {
  const [globalPriceHistory, setGlobalPriceHistory] = useState<any[]>([]);
  const [globalHistoryLoading, setGlobalHistoryLoading] = useState(true);
  
  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFuel, setSelectedFuel] = useState<string>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('365');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [chartType, setChartType] = useState<string>('line');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      const pdf = new jsPDF('p', 'mm', 'a4'); 
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      
      let currentY = 0;

      const getTrendText = (current?: number, previous?: number) => {
        if (!current || !previous || current === previous) return '';
        const diff = current - previous;
        const percent = (diff / previous) * 100;
        return ` (${diff > 0 ? '+' : ''}${percent.toFixed(1)}%)`;
      };

      // --- Brand Header Banner ---
      pdf.setFillColor(0, 114, 198); // Sierra Leone Blue
      pdf.rect(0, 0, pageWidth, 28, 'F');
      
      // Green Accent line at the bottom of the header
      pdf.setFillColor(30, 181, 58); // Sierra Leone Green
      pdf.rect(0, 28, pageWidth, 2, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Salone Fuel Monitor', margin, 18);
      
      // Subtitle / Label in header
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(255, 255, 255); // White
      pdf.text('OFFICIAL PRICE TRENDS REPORT', pageWidth - margin, 18, { align: 'right' });

      currentY = 42;

      // --- Report Title & Meta ---
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198); // Sierra Leone Blue
      pdf.text('Fuel Price Trends Analysis', margin, currentY);
      
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
        `Fuel Type: ${selectedFuel}`,
        `Timeframe: ${selectedTimeframe === 'custom' ? `${startDate || 'N/A'} to ${endDate || 'N/A'}` : selectedTimeframe === 'all' ? 'All Time' : `Last ${selectedTimeframe} Days`}`,
        `Sort By: ${sortBy}`
      ];
      
      if (minPrice || maxPrice) {
        filters.push(`Price Range: NLe ${minPrice || '0'} - ${maxPrice || 'Any'}`);
      }
      if (searchQuery) {
        filters.push(`Search: "${searchQuery}"`);
      }

      filters.forEach(filter => {
        pdf.text(`• ${filter}`, margin + 2, currentY);
        currentY += 5;
      });

      // --- Statistics ---
      if (stats) {
        currentY += 8;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 114, 198); // Sierra Leone Blue
        pdf.text('Summary Statistics', margin, currentY);
        
        currentY += 6;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105);
        
        // Add Latest Prices
        if (stats.latest) {
          let latestText = `Latest Recorded Prices (${stats.latest.date}):`;
          pdf.text(latestText, margin + 2, currentY);
          currentY += 5;
          
          if (selectedFuel === 'All' || selectedFuel === 'Petrol') {
            const trend = getTrendText(stats.latest.Petrol, stats.previous?.Petrol);
            pdf.text(`  • Petrol: ${formatPrice(stats.latest.Petrol)}${trend}`, margin + 2, currentY);
            currentY += 5;
          }
          if (selectedFuel === 'All' || selectedFuel === 'Diesel') {
            const trend = getTrendText(stats.latest.Diesel, stats.previous?.Diesel);
            pdf.text(`  • Diesel: ${formatPrice(stats.latest.Diesel)}${trend}`, margin + 2, currentY);
            currentY += 5;
          }
          if (selectedFuel === 'All' || selectedFuel === 'Kerosene') {
            const trend = getTrendText(stats.latest.Kerosene, stats.previous?.Kerosene);
            pdf.text(`  • Kerosene: ${formatPrice(stats.latest.Kerosene)}${trend}`, margin + 2, currentY);
            currentY += 5;
          }
          currentY += 3; // Extra spacing after latest prices
        }

        pdf.text(`Average Price: ${formatPrice(stats.avgActive)}`, margin + 2, currentY);
        currentY += 5;
        pdf.text(`Price Range: ${formatPrice(stats.minActive)} - ${formatPrice(stats.maxActive)}`, margin + 2, currentY);
        currentY += 5;
        pdf.text(`Total Records: ${filteredData.length}`, margin + 2, currentY);
        currentY += 8;
      }

      // --- Chart ---
      if (chartRef.current && chartType !== 'table') {
        const canvas = await html2canvas(chartRef.current, { 
          scale: 2,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        
        const chartWidth = pageWidth - (margin * 2);
        const chartHeight = (canvas.height * chartWidth) / canvas.width;
        
        // If chart doesn't fit on this page, add a new page
        if (currentY + chartHeight > pageHeight - margin - 20) {
          pdf.addPage();
          currentY = margin + 10;
        } else {
          currentY += 5;
        }
        
        pdf.addImage(imgData, 'PNG', margin, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 15;
      }

      // --- Table data ---
      if (filteredData.length > 0) {
        const tableColumns = ['Date / Period'];
        if (selectedFuel === 'All' || selectedFuel === 'Petrol') tableColumns.push('Petrol');
        if (selectedFuel === 'All' || selectedFuel === 'Diesel') tableColumns.push('Diesel');
        if (selectedFuel === 'All' || selectedFuel === 'Kerosene') tableColumns.push('Kerosene');

        const tableRows = filteredData.map((row: any) => {
          const rowData = [row.date];
          if (selectedFuel === 'All' || selectedFuel === 'Petrol') {
            const trend = getTrendText(row.Petrol, row.prevPetrol);
            rowData.push(`${formatPrice(row.Petrol)}${trend}`);
          }
          if (selectedFuel === 'All' || selectedFuel === 'Diesel') {
            const trend = getTrendText(row.Diesel, row.prevDiesel);
            rowData.push(`${formatPrice(row.Diesel)}${trend}`);
          }
          if (selectedFuel === 'All' || selectedFuel === 'Kerosene') {
            const trend = getTrendText(row.Kerosene, row.prevKerosene);
            rowData.push(`${formatPrice(row.Kerosene)}${trend}`);
          }
          return rowData;
        });

        autoTable(pdf, {
          startY: currentY,
          head: [tableColumns],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 181, 58], textColor: 255, fontStyle: 'bold' }, // Sierra Leone Green
          styles: { fontSize: 9, cellPadding: 4 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: margin, right: margin, bottom: margin + 15, left: margin }
        });
      }
      
      // --- Footer for all pages ---
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184); // slate-400
        
        // Footer line
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        pdf.text('Powered by Salone Fuel Monitor', margin, pageHeight - 10);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      pdf.save(`Salone_Fuel_Monitor_Price_Trends_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const calculateTrends = (data: any[]) => {
      return data.map((item, index) => {
        const prev = index > 0 ? data[index - 1] : null;
        return {
          ...item,
          prevPetrol: prev?.Petrol,
          prevDiesel: prev?.Diesel,
          prevKerosene: prev?.Kerosene,
        };
      });
    };

    // 1. Subscribe to the official price_trends collection managed in the Admin Dashboard
    const unsubscribeTrends = onSnapshot(
      collection(db, 'price_trends'),
      (snapshot) => {
        const trendsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (trendsData.length > 0) {
          const parseDate = (item: any) => {
            if (item.effectiveDate) {
              const d = new Date(item.effectiveDate);
              if (!isNaN(d.getTime())) return d;
            }
            if (item.monthYear) {
              const d = new Date(item.monthYear);
              if (!isNaN(d.getTime())) return d;
            }
            return new Date(0);
          };

          const formatted = trendsData.map((item: any) => {
            const dObj = parseDate(item);
            return {
              id: item.id,
              date: item.monthYear || item.effectiveDate || 'N/A',
              effectiveDate: item.effectiveDate || '',
              monthYear: item.monthYear || '',
              dateObj: dObj,
              timestamp: dObj.getTime(),
              Petrol: Number(item.petrolPrice) || 0,
              Diesel: Number(item.dieselPrice) || 0,
              Kerosene: Number(item.kerosenePrice) || 0,
            };
          });

          // Default sort ascending for store
          formatted.sort((a, b) => a.timestamp - b.timestamp);

          setGlobalPriceHistory(calculateTrends(formatted));
          setGlobalHistoryLoading(false);
        } else {
          // Fallback: If price_trends collection is empty, load from price_history
          const unsubscribeHistory = onSnapshot(
            query(collection(db, 'price_history'), orderBy('timestamp', 'asc')),
            (historySnap) => {
              const historyData = historySnap.docs.map(doc => doc.data());
              const groupedData: Record<string, any> = {};

              historyData.forEach((entry: any) => {
                if (!entry.timestamp) return;
                const dObj = entry.timestamp.toDate();
                const date = dObj.toLocaleDateString();
                if (!groupedData[date]) {
                  groupedData[date] = { date, dateObj: dObj, sumPetrol: 0, countPetrol: 0, sumDiesel: 0, countDiesel: 0, sumKerosene: 0, countKerosene: 0 };
                }
                if (entry.fuelType === 'Petrol') {
                  groupedData[date].sumPetrol += entry.price;
                  groupedData[date].countPetrol += 1;
                } else if (entry.fuelType === 'Diesel') {
                  groupedData[date].sumDiesel += entry.price;
                  groupedData[date].countDiesel += 1;
                } else if (entry.fuelType === 'Kerosene') {
                  groupedData[date].sumKerosene += entry.price;
                  groupedData[date].countKerosene += 1;
                }
              });

              const result = Object.values(groupedData).map((d: any) => ({
                id: d.date,
                date: d.date,
                effectiveDate: d.date,
                monthYear: d.date,
                dateObj: d.dateObj,
                timestamp: d.dateObj ? d.dateObj.getTime() : 0,
                Petrol: d.countPetrol ? Math.round(d.sumPetrol / d.countPetrol) : 0,
                Diesel: d.countDiesel ? Math.round(d.sumDiesel / d.countDiesel) : 0,
                Kerosene: d.countKerosene ? Math.round(d.sumKerosene / d.countKerosene) : 0,
              }));

              result.sort((a, b) => a.timestamp - b.timestamp);

              setGlobalPriceHistory(calculateTrends(result));
              setGlobalHistoryLoading(false);
            },
            (err) => {
              console.error("Error fetching price history fallback:", err);
              setGlobalHistoryLoading(false);
            }
          );
        }
      },
      (error) => {
        console.error("Error fetching price trends:", error);
        setGlobalHistoryLoading(false);
      }
    );

    return () => {
      unsubscribeTrends();
    };
  }, []);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    if (!globalPriceHistory.length) return [];

    let result = [...globalPriceHistory];

    // 1. Search Query Filter (Matches date, monthYear, effectiveDate)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        (item.date && item.date.toLowerCase().includes(q)) ||
        (item.effectiveDate && item.effectiveDate.toLowerCase().includes(q)) ||
        (item.monthYear && item.monthYear.toLowerCase().includes(q))
      );
    }

    // 2. Timeframe Filter
    if (selectedTimeframe !== 'all') {
      if (selectedTimeframe === 'custom') {
        if (startDate) {
          const start = new Date(startDate).getTime();
          result = result.filter(item => item.timestamp >= start);
        }
        if (endDate) {
          const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
          result = result.filter(item => item.timestamp <= end);
        }
      } else {
        const days = parseInt(selectedTimeframe, 10);
        if (!isNaN(days) && days > 0) {
          const latestTime = Math.max(...globalPriceHistory.map(i => i.timestamp));
          const cutoff = latestTime - (days * 24 * 60 * 60 * 1000);
          result = result.filter(item => item.timestamp >= cutoff);
        }
      }
    }

    // 3. Price Range Filter
    const minP = minPrice ? parseFloat(minPrice) : null;
    const maxP = maxPrice ? parseFloat(maxPrice) : null;

    if (minP !== null || maxP !== null) {
      result = result.filter(item => {
        const fuelsToCheck = selectedFuel === 'Petrol' ? [item.Petrol]
          : selectedFuel === 'Diesel' ? [item.Diesel]
          : selectedFuel === 'Kerosene' ? [item.Kerosene]
          : [item.Petrol, item.Diesel, item.Kerosene].filter(p => p > 0);

        return fuelsToCheck.some(price => {
          if (minP !== null && price < minP) return false;
          if (maxP !== null && price > maxP) return false;
          return true;
        });
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return a.timestamp - b.timestamp;
        case 'date-desc':
          return b.timestamp - a.timestamp;
        case 'petrol-desc':
          return b.Petrol - a.Petrol;
        case 'petrol-asc':
          return a.Petrol - b.Petrol;
        case 'diesel-desc':
          return b.Diesel - a.Diesel;
        case 'diesel-asc':
          return a.Diesel - b.Diesel;
        case 'kerosene-desc':
          return b.Kerosene - a.Kerosene;
        case 'kerosene-asc':
          return a.Kerosene - b.Kerosene;
        default:
          return b.timestamp - a.timestamp;
      }
    });

    return result;
  }, [globalPriceHistory, searchQuery, selectedTimeframe, startDate, endDate, minPrice, maxPrice, selectedFuel, sortBy]);

  // Data sorted chronologically ascending specifically for charts
  const chartData = useMemo(() => {
    return [...filteredData].sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredData]);

  // Key Statistics
  const stats = useMemo(() => {
    if (!filteredData.length) return null;

    const latest = [...filteredData].sort((a, b) => b.timestamp - a.timestamp)[0];
    const previous = [...filteredData].sort((a, b) => b.timestamp - a.timestamp)[1];

    const petrolPrices = filteredData.map(d => d.Petrol).filter(p => p > 0);
    const dieselPrices = filteredData.map(d => d.Diesel).filter(p => p > 0);
    const kerosenePrices = filteredData.map(d => d.Kerosene).filter(p => p > 0);

    const getAvg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const getMax = (arr: number[]) => arr.length ? Math.max(...arr) : 0;
    const getMin = (arr: number[]) => arr.length ? Math.min(...arr) : 0;

    let activePrices: number[] = [];
    if (selectedFuel === 'Petrol') activePrices = petrolPrices;
    else if (selectedFuel === 'Diesel') activePrices = dieselPrices;
    else if (selectedFuel === 'Kerosene') activePrices = kerosenePrices;
    else activePrices = [...petrolPrices, ...dieselPrices, ...kerosenePrices];

    return {
      latest,
      previous,
      avgPetrol: getAvg(petrolPrices),
      avgDiesel: getAvg(dieselPrices),
      avgKerosene: getAvg(kerosenePrices),
      avgActive: getAvg(activePrices),
      maxActive: getMax(activePrices),
      minActive: getMin(activePrices),
    };
  }, [filteredData, selectedFuel]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedFuel !== 'All') count++;
    if (selectedTimeframe !== '365') count++;
    if (startDate || endDate) count++;
    if (minPrice || maxPrice) count++;
    if (sortBy !== 'date-desc') count++;
    return count;
  }, [searchQuery, selectedFuel, selectedTimeframe, startDate, endDate, minPrice, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedFuel('All');
    setSelectedTimeframe('365');
    setStartDate('');
    setEndDate('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('date-desc');
  };

  const formatPrice = (val: number) => {
    if (!val) return '-';
    return val >= 1000 ? `${val.toLocaleString()} SLL` : `NLe ${Number(val).toFixed(2)}`;
  };

  const renderTrend = (current?: number, previous?: number) => {
    if (!current || !previous || current === previous) {
      return <span className="text-xs text-gray-400 font-medium ml-2 inline-flex items-center"><Minus className="w-3 h-3 mr-1" /> 0%</span>;
    }
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    const isUp = diff > 0;
    return (
      <span className={`text-xs font-bold ml-2 inline-flex items-center ${isUp ? 'text-rose-500' : 'text-emerald-500'}`}>
        {isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(percent).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2 tracking-tight">Price Trends</h1>
          <p className="text-gray-500 font-medium">Historical official fuel prices across Sierra Leone with interactive analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExporting || globalHistoryLoading || filteredData.length === 0}
            className="flex items-center justify-center gap-2 bg-surface-900 text-white hover:bg-black px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Latest Petrol</span>
              <div className="text-xl font-extrabold text-surface-900">
                {formatPrice(stats.latest?.Petrol)}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {stats.latest?.date || 'Latest Entry'}
                {renderTrend(stats.latest?.Petrol, stats.previous?.Petrol)}
              </span>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Fuel className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Latest Diesel</span>
              <div className="text-xl font-extrabold text-surface-900">
                {formatPrice(stats.latest?.Diesel)}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {stats.latest?.date || 'Latest Entry'}
                {renderTrend(stats.latest?.Diesel, stats.previous?.Diesel)}
              </span>
            </div>
            <div className="p-3 bg-surface-900/10 text-surface-900 rounded-2xl">
              <Fuel className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Latest Kerosene</span>
              <div className="text-xl font-extrabold text-surface-900">
                {formatPrice(stats.latest?.Kerosene)}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {stats.latest?.date || 'Latest Entry'}
                {renderTrend(stats.latest?.Kerosene, stats.previous?.Kerosene)}
              </span>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <Fuel className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Period Average</span>
              <div className="text-xl font-extrabold text-emerald-600">
                {formatPrice(Math.round(stats.avgActive))}
              </div>
              <span className="text-xs text-gray-500 font-medium">Range: {formatPrice(stats.minActive)} - {formatPrice(stats.maxActive)}</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
        {/* Search, Sorting & Filter Controls Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search date, month or year (e.g. '2024', 'Jan', '18 Mar')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-2xl pl-11 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Filter Selects */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View Type Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                <button
                  onClick={() => setChartType('line')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    chartType === 'line' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Line Chart"
                >
                  <LineChartIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Line</span>
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    chartType === 'bar' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Bar Chart"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Bar</span>
                </button>
                <button
                  onClick={() => setChartType('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    chartType === 'table' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              {/* Timeframe Select */}
              <div className="relative">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:border-gray-300 transition-all"
                >
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 3 Months</option>
                  <option value="180">Last 6 Months</option>
                  <option value="365">Last 1 Year</option>
                  <option value="custom">Custom Range...</option>
                  <option value="all">All Time</option>
                </select>
                <ChevronDown className="h-4 w-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Fuel Type Select */}
              <div className="relative">
                <select
                  value={selectedFuel}
                  onChange={(e) => setSelectedFuel(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:border-gray-300 transition-all"
                >
                  <option value="All">All Fuel Types</option>
                  <option value="Petrol">Petrol Only</option>
                  <option value="Diesel">Diesel Only</option>
                  <option value="Kerosene">Kerosene Only</option>
                </select>
                <ChevronDown className="h-4 w-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:border-gray-300 transition-all"
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="petrol-desc">Petrol (Highest First)</option>
                  <option value="petrol-asc">Petrol (Lowest First)</option>
                  <option value="diesel-desc">Diesel (Highest First)</option>
                  <option value="diesel-asc">Diesel (Lowest First)</option>
                  <option value="kerosene-desc">Kerosene (Highest First)</option>
                  <option value="kerosene-asc">Kerosene (Lowest First)</option>
                </select>
                <ArrowUpDown className="h-4 w-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Advanced Filter Toggle Button */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-bold border transition-all ${
                  showAdvancedFilters || activeFiltersCount > 0
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expandable Advanced Filters */}
          {showAdvancedFilters && (
            <div className="pt-4 mt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
              {/* Custom Date Range */}
              {selectedTimeframe === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* Min Price Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Min Price (NLe / SLL)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">NLe</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl pl-11 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Max Price Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Max Price (NLe / SLL)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">NLe</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl pl-11 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Filter Reset Button */}
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  disabled={activeFiltersCount === 0}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            </div>
          )}

          {/* Results Summary Counter */}
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-1">
            <span>Showing <strong className="text-gray-900 font-bold">{filteredData.length}</strong> of {globalPriceHistory.length} historical price entries</span>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-primary hover:underline font-bold flex items-center gap-1"
              >
                Clear filters ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {/* Content Display Area */}
        <div className="p-6 md:p-8">
          <div className="h-96 w-full" ref={chartRef}>
            {globalHistoryLoading ? (
              <div className="flex flex-col justify-center items-center h-full gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Trends...</p>
              </div>
            ) : filteredData.length > 0 ? (
              <>
                {chartType === 'line' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(value) => value >= 1000 ? `NLe ${(value / 1000).toFixed(0)}` : `NLe ${value}`}
                        dx={-10}
                        domain={[0, 'auto']}
                        tickCount={5}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          padding: '12px'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                        labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '8px' }}
                        formatter={(value: number) => [value >= 1000 ? `${value.toLocaleString()} SLL` : `NLe ${Number(value).toFixed(2)}/L`, '']}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                      {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                        <Line name="Diesel" type="monotone" dataKey="Diesel" stroke="var(--color-surface-900)" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                        <Line name="Kerosene" type="monotone" dataKey="Kerosene" stroke="#2563EB" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                        <Line name="Petrol" type="monotone" dataKey="Petrol" stroke="var(--color-primary)" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'bar' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} dy={10} minTickGap={30} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => value >= 1000 ? `NLe ${(value / 1000).toFixed(0)}` : `NLe ${value}`} dx={-10} domain={[0, 'auto']} tickCount={5} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '12px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                        labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '8px' }}
                        formatter={(value: number) => [value >= 1000 ? `${value.toLocaleString()} SLL` : `NLe ${Number(value).toFixed(2)}/L`, '']}
                      />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                      {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                        <Bar name="Diesel" dataKey="Diesel" fill="var(--color-surface-900)" radius={[4, 4, 0, 0]} maxBarSize={8} />
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                        <Bar name="Kerosene" dataKey="Kerosene" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={8} />
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                        <Bar name="Petrol" dataKey="Petrol" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={8} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'table' && (
                  <div className="overflow-auto w-full h-full border border-gray-100 rounded-2xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Effective Date / Period</th>
                          {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Petrol</th>
                          )}
                          {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Diesel</th>
                          )}
                          {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kerosene</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{row.date}</td>
                            {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                                {formatPrice(row.Petrol)}
                                {renderTrend(row.Petrol, row.prevPetrol)}
                              </td>
                            )}
                            {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-surface-900">
                                {formatPrice(row.Diesel)}
                                {renderTrend(row.Diesel, row.prevDiesel)}
                              </td>
                            )}
                            {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                {formatPrice(row.Kerosene)}
                                {renderTrend(row.Kerosene, row.prevKerosene)}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-gray-400 gap-2">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-2">
                  <Filter className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-600">No matching price trend entries</p>
                <p className="text-xs font-medium text-gray-400">Try adjusting your search criteria or resetting filters</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-3 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-all"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Additional Data Table below charts if not in table mode */}
          {chartType !== 'table' && filteredData.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-gray-500" />
                  Detailed Price Record Breakdown ({filteredData.length})
                </h3>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-2xl max-h-80 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date / Period</th>
                      {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Petrol</th>
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Diesel</th>
                      )}
                      {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kerosene</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-900">{row.date}</td>
                        {(selectedFuel === 'All' || selectedFuel === 'Petrol') && (
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-primary">
                            {formatPrice(row.Petrol)}
                            {renderTrend(row.Petrol, row.prevPetrol)}
                          </td>
                        )}
                        {(selectedFuel === 'All' || selectedFuel === 'Diesel') && (
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-surface-900">
                            {formatPrice(row.Diesel)}
                            {renderTrend(row.Diesel, row.prevDiesel)}
                          </td>
                        )}
                        {(selectedFuel === 'All' || selectedFuel === 'Kerosene') && (
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-blue-600">
                            {formatPrice(row.Kerosene)}
                            {renderTrend(row.Kerosene, row.prevKerosene)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
