
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, query, orderBy, onSnapshot, getDocs } from '../firebase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { 
  Activity, History, ChevronDown, Download, Search, SlidersHorizontal,
  ArrowUpDown, Calendar, X, Filter, RotateCcw, TrendingUp, TrendingDown,
  Minus, Bus, DollarSign, Table as TableIcon, LineChart as LineChartIcon, BarChart3, RefreshCw,
  Car, Bike, Ship, Truck, Zap, LayoutGrid, List
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBase64, drawPdfHeader } from '../utils/pdfUtils';
import { toCanvas } from 'html-to-image';
import { trackPdfExport } from '../hooks/useAnalytics';

interface TransportPrice {
  id: string;
  route: string;
  vehicleType: string;
}

export default function TransportTrends() {
  const navigate = useNavigate();
  const [transportPrices, setTransportPrices] = useState<Record<string, TransportPrice>>({});
  const [globalPriceHistory, setGlobalPriceHistory] = useState<any[]>([]);
  const [globalHistoryLoading, setGlobalHistoryLoading] = useState(true);
  
  // Search, Filter & Sort States
  const [routeSearchQuery, setRouteSearchQuery] = useState<string>('');
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('All');
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

  // Fetch transport prices map first
  useEffect(() => {
    const fetchTransportPrices = async () => {
      const tpQuery = query(collection(db, 'transport_prices'));
      const snapshot = await getDocs(tpQuery);
      const tpMap: Record<string, TransportPrice> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        tpMap[doc.id] = {
          id: doc.id,
          route: data.route,
          vehicleType: data.vehicleType
        };
      });
      setTransportPrices(tpMap);
    };
    fetchTransportPrices();
  }, []);

  useEffect(() => {
    if (Object.keys(transportPrices).length === 0) return;

    const q = query(
      collection(db, 'transport_price_history'),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => {
        const data = doc.data();
        const tp = transportPrices[data.priceId];
        return {
          id: doc.id,
          priceId: data.priceId,
          price: data.price,
          date: data.date,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          route: tp ? tp.route : 'Unknown Route',
          vehicleType: tp ? tp.vehicleType : 'Unknown Type'
        };
      });
      
      setGlobalPriceHistory(history);
      setGlobalHistoryLoading(false);
    }, (error) => {
      console.error("Error fetching global history:", error);
      setGlobalHistoryLoading(false);
    });
    
    return unsubscribe;
  }, [transportPrices]);

  // Derived unique values for filters
  const allRoutes = useMemo(() => {
    let prices = Object.values(transportPrices);
    if (selectedVehicleType !== 'All') {
      prices = prices.filter(tp => tp.vehicleType === selectedVehicleType);
    }
    const routes = new Set(prices.map(tp => tp.route));
    return Array.from(routes).sort();
  }, [transportPrices, selectedVehicleType]);

  useEffect(() => {
    setSelectedRoutes([]);
  }, [selectedVehicleType]);

  const vehicleTypes = useMemo(() => {
    const types = new Set(Object.values(transportPrices).map(tp => tp.vehicleType));
    return Array.from(types).sort();
  }, [transportPrices]);

  const filteredHistory = useMemo(() => {
    let result = [...globalPriceHistory];
    const now = Date.now();
    let timeframeMs: number | null = null;
    
    if (selectedTimeframe === '30') timeframeMs = 30 * 24 * 60 * 60 * 1000;
    else if (selectedTimeframe === '90') timeframeMs = 90 * 24 * 60 * 60 * 1000;
    else if (selectedTimeframe === '180') timeframeMs = 180 * 24 * 60 * 60 * 1000;
    else if (selectedTimeframe === '365') timeframeMs = 365 * 24 * 60 * 60 * 1000;
    
    if (timeframeMs !== null) {
      result = result.filter(row => row.timestamp >= now - timeframeMs);
    }
    
    if (selectedRoutes.length > 0) {
      result = result.filter(row => selectedRoutes.includes(row.route));
    }
    
    if (selectedVehicleType !== 'All') {
      result = result.filter(row => row.vehicleType === selectedVehicleType);
    }
    
    if (startDate) {
      const start = new Date(startDate).getTime();
      result = result.filter(row => row.timestamp >= start);
    }
    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      result = result.filter(row => row.timestamp <= end);
    }
    
    if (minPrice) {
      result = result.filter(row => row.price >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter(row => row.price <= Number(maxPrice));
    }
    
    return result;
  }, [globalPriceHistory, selectedRoutes, selectedVehicleType, selectedTimeframe, startDate, endDate, minPrice, maxPrice]);

  const sortedHistory = useMemo(() => {
    let result = [...filteredHistory];
    
    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'date-asc':
        result.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'route-asc':
        result.sort((a, b) => a.route.localeCompare(b.route));
        break;
      case 'route-desc':
        result.sort((a, b) => b.route.localeCompare(a.route));
        break;
    }
    
    return result;
  }, [filteredHistory, sortBy]);

  // Transform data for charting (grouped by date)
  const chartData = useMemo(() => {
    if (sortedHistory.length === 0) return [];
    
    // Sort chronologically for chart
    const chronological = [...filteredHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    const dataByDate = new Map<string, any>();
    
    chronological.forEach(entry => {
      if (!dataByDate.has(entry.date)) {
        dataByDate.set(entry.date, { date: entry.date, sortTimestamp: entry.timestamp });
      }
      const dataPoint = dataByDate.get(entry.date);
      
      const key = `${entry.route} - ${entry.vehicleType}`;
      dataPoint[key] = entry.price;
    });
    
    return Array.from(dataByDate.values()).sort((a, b) => a.sortTimestamp - b.sortTimestamp);
  }, [filteredHistory]);

  const resetFilters = () => {
    setRouteSearchQuery('');
    setSelectedRoutes([]);
    setSelectedVehicleType('All');
    setSelectedTimeframe('365');
    setStartDate('');
    setEndDate('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('date-desc');
  };

  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'Car': return <Car className="w-4 h-4" />;
      case 'Bus': 
      case 'Poda Poda': return <Bus className="w-4 h-4" />;
      case 'Keke': return <Zap className="w-4 h-4" />;
      case 'Okada': return <Bike className="w-4 h-4" />;
      case 'Ferry': return <Ship className="w-4 h-4" />;
      default: return <Bus className="w-4 h-4" />;
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      trackPdfExport('Transport Trends Report');
      
      const logo = await getLogoBase64();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      
      let currentY = drawPdfHeader(pdf, 'Official Transport Trends Report', logo);

      // --- Report Title & Meta ---
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198); // Sierra Leone Blue
      pdf.text('Transport Trends Analysis', margin, currentY);
      
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
        `Vehicle Type: ${selectedVehicleType}`,
        `Timeframe: ${selectedTimeframe === 'all' ? 'All Time' : `Last ${selectedTimeframe} Days`}`,
        `Sort By: ${sortBy}`
      ];
      
      if (startDate || endDate) {
        filters[1] = `Timeframe: ${startDate || 'N/A'} to ${endDate || 'N/A'}`;
      }
      if (minPrice || maxPrice) {
        filters.push(`Price Range: Le ${minPrice || '0'} - ${maxPrice || 'Any'}`);
      }
      if (selectedRoutes.length > 0) {
        filters.push(`Routes: ${selectedRoutes.join(', ')}`);
      }

      filters.forEach(filter => {
        pdf.text(`• ${filter}`, margin + 2, currentY);
        currentY += 5;
      });

      // --- Summary Statistics ---
      if (sortedHistory.length > 0) {
        currentY += 8;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 114, 198); // Sierra Leone Blue
        pdf.text('Summary Statistics', margin, currentY);
        
        currentY += 6;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105);
        
        const prices = sortedHistory.map(r => r.price);
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        const avgP = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        pdf.text(`Total Records: ${sortedHistory.length}`, margin + 2, currentY);
        currentY += 5;
        pdf.text(`Price Range: Le ${minP.toLocaleString()} - Le ${maxP.toLocaleString()}`, margin + 2, currentY);
        currentY += 5;
        pdf.text(`Average Price: Le ${Math.round(avgP).toLocaleString()}`, margin + 2, currentY);
        currentY += 10;
      }

      if (chartRef.current && chartType !== 'table') {
        const canvas = await toCanvas(chartRef.current, { 
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        
        const chartWidth = pageWidth - (margin * 2);
        const chartHeight = (canvas.height * chartWidth) / canvas.width;
        
        if (currentY + chartHeight > pageHeight - margin - 20) {
          pdf.addPage();
          currentY = margin + 10;
        } else {
          currentY += 5;
        }
        
        pdf.addImage(imgData, 'PNG', margin, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 15;
      }
      
      const tableData = sortedHistory.map(row => [
        row.date,
        row.route,
        row.vehicleType,
        `Le ${row.price.toLocaleString()}`
      ]);
      
      autoTable(pdf, {
        startY: currentY,
        head: [['Date', 'Route', 'Vehicle Type', 'Price']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [4, 120, 87] },
      });
      
      pdf.save(`Transport_Price_Trends_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Get dynamic colors for lines based on route+vehicle
  const lineKeys = useMemo(() => {
    if (chartData.length === 0) return [];
    const keys = new Set<string>();
    chartData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'date' && k !== 'sortTimestamp') keys.add(k);
      });
    });
    return Array.from(keys);
  }, [chartData]);
  
  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 leading-tight">Transport Trends</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">Analyze and export historical transport price data</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center bg-gray-100/50 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => navigate('/transport-prices', { state: { viewMode: 'cards' } })}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700"
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => navigate('/transport-prices', { state: { viewMode: 'list' } })}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700"
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white text-primary shadow-sm"
            >
              <TrendingUp className="w-4 h-4" />
              Transport Trends
            </button>
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting || sortedHistory.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-surface-900 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Main Controls - Filters & View Toggle */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]" onMouseLeave={() => setIsRouteDropdownOpen(false)}>
            <div 
              onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <span className="truncate max-w-[150px] md:max-w-[200px] text-gray-700">
                {selectedRoutes.length === 0 ? "All Routes" : `${selectedRoutes.length} Route(s) Selected`}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
            </div>
            
            {isRouteDropdownOpen && (
              <div className="absolute z-[60] top-full left-0 mt-1 w-72 bg-white border border-gray-100 shadow-xl rounded-xl max-h-80 flex flex-col">
                 <div className="p-2 border-b border-gray-50 sticky top-0 bg-white rounded-t-xl shrink-0">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                     <input 
                        type="text" 
                        placeholder="Search routes..." 
                        value={routeSearchQuery}
                        onChange={e => setRouteSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border-none rounded-lg text-sm focus:ring-0"
                     />
                   </div>
                 </div>
                 <div className="p-1 overflow-y-auto flex-1">
                   {allRoutes.filter(r => r.toLowerCase().includes(routeSearchQuery.toLowerCase())).map(route => (
                     <label key={route} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                       <input 
                         type="checkbox" 
                         checked={selectedRoutes.includes(route)}
                         onChange={() => {
                           if (selectedRoutes.includes(route)) {
                             setSelectedRoutes(selectedRoutes.filter(r => r !== route));
                           } else {
                             setSelectedRoutes([...selectedRoutes, route]);
                           }
                         }}
                         className="rounded text-blue-500 focus:ring-blue-500 border-gray-300 w-4 h-4"
                       />
                       <span className="text-sm font-medium text-gray-700">{route}</span>
                     </label>
                   ))}
                   {allRoutes.filter(r => r.toLowerCase().includes(routeSearchQuery.toLowerCase())).length === 0 && (
                     <div className="p-3 text-center text-sm text-gray-500">No routes found</div>
                   )}
                 </div>
              </div>
            )}
          </div>
          
          <select
            value={selectedVehicleType}
            onChange={(e) => setSelectedVehicleType(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="All">All Vehicles</option>
            {vehicleTypes.map(vt => (
              <option key={vt} value={vt}>{vt}</option>
            ))}
          </select>
          
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="180">Last 6 Months</option>
            <option value="365">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
          
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
              showAdvancedFilters || startDate || endDate || minPrice || maxPrice
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
            title="Advanced Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setChartType('line')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${chartType === 'line' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LineChartIcon className="w-4 h-4" />
            Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${chartType === 'bar' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Bar
          </button>
          <button
            onClick={() => setChartType('table')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${chartType === 'table' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <TableIcon className="w-4 h-4" />
            Table
          </button>
        </div>
      </div>
      
      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" />
              Advanced Filters
            </h3>
            <button onClick={resetFilters} className="text-xs font-bold text-gray-500 hover:text-surface-900 flex items-center gap-1 transition-colors">
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date Range</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-gray-400">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            
            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price Range (Le)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        {globalHistoryLoading ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p className="font-medium">Loading transport history...</p>
          </div>
        ) : sortedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <History className="w-12 h-12 mb-4 text-gray-300" />
            <p className="font-medium text-gray-500">No transport price history found for the selected filters.</p>
            <button 
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-surface-900 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div ref={chartRef} className="bg-white">
            {chartType === 'table' ? (
              // Table View
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-surface-900">Price Records</h2>
                  <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 pl-2">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-surface-900 focus:ring-0 cursor-pointer"
                    >
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="price-desc">Highest Price</option>
                      <option value="price-asc">Lowest Price</option>
                      <option value="route-asc">Route (A-Z)</option>
                      <option value="route-desc">Route (Z-A)</option>
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th 
                          className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')}
                        >
                          <div className="flex items-center gap-2">
                            Date
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setSortBy(sortBy === 'route-asc' ? 'route-desc' : 'route-asc')}
                        >
                          <div className="flex items-center gap-2">
                            Route
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wider">Vehicle Type</th>
                        <th 
                          className="px-6 py-4 font-bold tracking-wider text-right cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setSortBy(sortBy === 'price-desc' ? 'price-asc' : 'price-desc')}
                        >
                          <div className="flex items-center justify-end gap-2">
                            Price
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedHistory.map((row) => (
                        <tr key={row.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-600 whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="px-6 py-4 font-bold text-surface-900">
                            {row.route}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
                              {getVehicleIcon(row.vehicleType)}
                              {row.vehicleType}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-primary text-right">
                            Le {row.price.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Chart View
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-surface-900">Price Trends</h2>
                    <p className="text-sm text-gray-500 font-medium">Historical transport prices over time</p>
                  </div>
                  
                  {/* Legend hint if too many lines */}
                  {lineKeys.length > 5 && (
                    <div className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      Showing top routes. Use search to isolate specific routes.
                    </div>
                  )}
                </div>
                
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                          dx={-10}
                          tickFormatter={(value) => `Le ${value.toLocaleString()}`}
                        />
                        <Tooltip
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            padding: '16px',
                            fontWeight: 600
                          }}
                          labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '13px' }}
                          formatter={(value: number, name: string) => [`Le ${value.toLocaleString()}`, name]}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }}
                          iconType="circle"
                        />
                        
                        {lineKeys.slice(0, 10).map((key, index) => (
                          <Line 
                            key={key}
                            type="monotone" 
                            dataKey={key} 
                            stroke={colors[index % colors.length]} 
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                          dx={-10}
                          tickFormatter={(value) => `Le ${value.toLocaleString()}`}
                        />
                        <Tooltip
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            padding: '16px',
                            fontWeight: 600
                          }}
                          labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '13px' }}
                          formatter={(value: number, name: string) => [`Le ${value.toLocaleString()}`, name]}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }}
                          iconType="circle"
                        />
                        
                        {lineKeys.slice(0, 10).map((key, index) => (
                          <Bar 
                            key={key}
                            dataKey={key} 
                            fill={colors[index % colors.length]} 
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
