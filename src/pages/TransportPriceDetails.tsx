
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, db } from '../firebase';
import { 
  ArrowLeft, MapPin, Banknote, Calendar, Clock, TrendingUp, History, 
  Car, Bus, Bike, Ship, Zap, Search, ArrowUpDown, ChevronUp, ChevronDown, ListFilter,
  LineChart as LineChartIcon, BarChart3, Table as TableIcon, Download, RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toCanvas } from 'html-to-image';

interface TransportPrice {
  id: string;
  route: string;
  vehicleType: string;
  price: number;
  date: string;
  lastUpdated: any;
}

interface PriceHistory {
  id: string;
  priceId: string;
  price: number;
  date: string;
  timestamp: any;
}

export default function TransportPriceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);
  const [priceDetails, setPriceDetails] = useState<TransportPrice | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'price'>('date');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewType, setViewType] = useState<'line' | 'bar' | 'table'>('line');
  const [timeRange, setTimeRange] = useState<'30d' | '3m' | '6m' | '1y' | 'all' | 'custom'>('1y');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        const docRef = doc(db, 'transport_prices', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPriceDetails({ id: docSnap.id, ...docSnap.data() } as TransportPrice);
        } else {
          setPriceDetails(null);
        }
      } catch (error) {
        console.error("Error fetching price details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();

    const q = query(
      collection(db, 'transport_price_history'),
      where('priceId', '==', id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PriceHistory[];
      setPriceHistory(history);
    });

    return () => unsubscribe();
  }, [id]);

  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'Car': return <Car className="w-5 h-5" />;
      case 'Bus': 
      case 'Poda Poda': return <Bus className="w-5 h-5" />;
      case 'Keke': return <Zap className="w-5 h-5" />;
      case 'Okada': return <Bike className="w-5 h-5" />;
      case 'Ferry': return <Ship className="w-5 h-5" />;
      default: return <Bus className="w-5 h-5" />;
    }
  };

  const effectiveStartDate = useMemo(() => {
    if (timeRange === 'custom') return startDate;
    if (timeRange === 'all') return '';
    const date = new Date();
    if (timeRange === '30d') date.setDate(date.getDate() - 30);
    else if (timeRange === '3m') date.setMonth(date.getMonth() - 3);
    else if (timeRange === '6m') date.setMonth(date.getMonth() - 6);
    else if (timeRange === '1y') date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  }, [timeRange, startDate]);

  const effectiveEndDate = useMemo(() => {
    if (timeRange === 'custom') return endDate;
    return '';
  }, [timeRange, endDate]);

  const filteredAndSortedHistory = useMemo(() => {
    return priceHistory
      .filter((history) => {
        const matchesSearch = history.price.toString().includes(searchTerm) || history.date.includes(searchTerm);
        const matchesStartDate = effectiveStartDate ? history.date >= effectiveStartDate : true;
        const matchesEndDate = effectiveEndDate ? history.date <= effectiveEndDate : true;
        return matchesSearch && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          return sortDirection === 'asc'
            ? a.date.localeCompare(b.date)
            : b.date.localeCompare(a.date);
        } else {
          return sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
        }
      });
  }, [priceHistory, searchTerm, effectiveStartDate, effectiveEndDate, sortField, sortDirection]);

  const handleSort = (field: 'date' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      let chartImgData = null;
      if (viewType !== 'table' && chartRef.current) {
        try {
          const canvas = await toCanvas(chartRef.current, {
            backgroundColor: '#ffffff',
            pixelRatio: 2
          });
          chartImgData = canvas.toDataURL('image/png');
        } catch (e) {
          console.error('Failed to capture chart image', e);
        }
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 14;
      let currentY = 0;

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
      pdf.setTextColor(255, 255, 255);
      pdf.text('OFFICIAL TRANSPORT PRICE REPORT', pageWidth - margin, 18, { align: 'right' });

      currentY = 42;

      // --- Report Title & Meta ---
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198); // Sierra Leone Blue
      pdf.text('Transport Price Details', margin, currentY);
      
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

      // --- Details ---
      currentY += 12;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('Route Information', margin, currentY);

      currentY += 8;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Route: ${priceDetails?.route || 'N/A'}`, margin, currentY);
      currentY += 6;
      pdf.text(`Vehicle Type: ${priceDetails?.vehicleType || 'N/A'}`, margin, currentY);
      currentY += 6;
      pdf.text(`Current Price: Le ${priceDetails?.price.toLocaleString() || 'N/A'}`, margin, currentY);
      
      currentY += 12;

      if (chartImgData) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        pdf.text('Price Trend Graph', margin, currentY);
        
        currentY += 6;
        const chartWidth = pageWidth - (margin * 2);
        const chartHeight = 75;
        pdf.addImage(chartImgData, 'PNG', margin, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 12;
      }

      // --- Table ---
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('Historical Data', margin, currentY);
      currentY += 4;

      const tableData = filteredAndSortedHistory.map(item => [
        item.date,
        `Le ${item.price.toLocaleString()}`
      ]);

      autoTable(pdf, {
        startY: currentY + 4,
        head: [['Date', 'Price (Le)']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [248, 250, 252], // slate-50
          textColor: [100, 116, 139], // slate-500
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'left'
        },
        styles: {
          font: 'helvetica',
          fontSize: 10,
          textColor: [51, 65, 85], // slate-700
          cellPadding: 4,
          lineColor: [241, 245, 249], // slate-100
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 50, halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        margin: { left: margin, right: margin }
      });

      // --- Footer ---
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184); // slate-400
        
        // Page number
        pdf.text(
          `Page ${i} of ${pageCount}`, 
          pageWidth / 2, 
          pdf.internal.pageSize.getHeight() - 10, 
          { align: 'center' }
        );
      }

      pdf.save(`Transport_Price_Details_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const chartData = useMemo(() => {
    // For charts, we usually want chronological order, but we should respect the filter at least.
    // However, if the user sorts by price, the chart might look weird. We'll just map the filtered array.
    return [...filteredAndSortedHistory]
      .sort((a, b) => a.date.localeCompare(b.date)) // Always sort by date for charts
      .map(h => ({
        date: h.date,
        price: h.price
    }));
  }, [filteredAndSortedHistory]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="h-10 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded w-full mb-8"></div>
        </div>
      </div>
    );
  }

  if (!priceDetails) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Price Not Found</h2>
        <p className="text-gray-500 mb-8">The transport price details you are looking for do not exist or have been removed.</p>
        <button 
          onClick={() => navigate('/transport-prices')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
        >
          Back to Transport Prices
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <Link 
        to="/transport-prices"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Transport Prices
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary shrink-0">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 leading-tight mb-2">
                {priceDetails.route}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-sm font-bold text-gray-600">
                  {getVehicleIcon(priceDetails.vehicleType)}
                  {priceDetails.vehicleType}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Recorded: {priceDetails.date}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100 text-right w-full md:w-auto">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Current Price</p>
            <div className="text-3xl font-black text-primary">
              Le {priceDetails.price.toLocaleString()}
            </div>
            {priceDetails.lastUpdated && (
              <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mt-2 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                Updated: {priceDetails.lastUpdated.toDate().toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-surface-900">Price History</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-gray-100/50 p-1 rounded-xl">
                <button
                  onClick={() => setViewType('line')}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    viewType === 'line' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LineChartIcon className="w-4 h-4" />
                  Line
                </button>
                <button
                  onClick={() => setViewType('bar')}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    viewType === 'bar' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Bar
                </button>
                <button
                  onClick={() => setViewType('table')}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    viewType === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  Table
                </button>
              </div>
              <button 
                onClick={handleExportPDF}
                disabled={isExporting || filteredAndSortedHistory.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-surface-900 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>

          </div>
          
          {/* Filters */}
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1 w-full min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search date or price..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shrink-0">
                {(['30d', '3m', '6m', '1y', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setStartDate('');
                      setEndDate('');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                      timeRange === range
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {range === '30d' ? '30 Days' :
                     range === '3m' ? '3 Months' :
                     range === '6m' ? '6 Months' :
                     range === '1y' ? '1 Year' : 'All Time'}
                  </button>
                ))}
                <button
                  onClick={() => setTimeRange('custom')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    timeRange === 'custom'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Custom
                </button>
              </div>

              {timeRange === 'custom' && (
                <div className="flex items-center gap-2 shrink-0 animate-in fade-in zoom-in-95 duration-200">
                  <input
                    type="date"
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-[130px]"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="date"
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-[130px]"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {viewType === 'table' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-surface-50">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {sortField === 'date' ? (
                            sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
                          ) : (
                            <ArrowUpDown className="w-4 h-4 opacity-30" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {sortField === 'price' ? (
                            sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
                          ) : (
                            <ArrowUpDown className="w-4 h-4 opacity-30" />
                          )}
                          Price (Le)
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {filteredAndSortedHistory.length > 0 ? (
                      filteredAndSortedHistory.map((history) => (
                        <tr key={history.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">
                            {history.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary text-right">
                            {history.price.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-sm font-medium text-gray-400">
                          No price history matches your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : chartData.length > 1 ? (
            <div ref={chartRef} className="h-[400px] w-full bg-white rounded-2xl p-4 border border-gray-50">
              <ResponsiveContainer width="100%" height="100%">
                {viewType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                      formatter={(value: number) => [`Le ${value.toLocaleString()}`, 'Price']}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={4}
                      dot={{ r: 6, strokeWidth: 3, fill: '#fff', stroke: '#10b981' }}
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                      formatter={(value: number) => [`Le ${value.toLocaleString()}`, 'Price']}
                      cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                    />
                    <Bar dataKey="price" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-100 flex flex-col items-center justify-center">
              <History className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Not enough historical data to display a trend chart.</p>
              <p className="text-sm text-gray-400 mt-1">Check back later as more price updates are recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
