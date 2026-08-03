import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, where, db, handleFirestoreError, OperationType, doc, addDoc, serverTimestamp, limit } from '../firebase';
import { Search, Download, MapPin, Filter, TrendingDown, TrendingUp, Minus, Shield, Fuel, Bell, BellOff, X, ShieldCheck, Building2, ArrowUpDown, History, Clock, Activity, ArrowLeft, CheckSquare, Square, Trophy, ChevronDown, Check, Navigation, Phone, ExternalLink, ShieldAlert, Slash, LayoutList, ChevronUp, Target, Percent, Heart, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoriteContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import StationReviews from '../components/StationReviews';
import StationComparisonChart from "../components/StationComparisonChart";
import AdminStationMap from '../components/AdminStationMap';
import { SIERRA_LEONE_DISTRICTS } from '../lib/constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toCanvas } from 'html-to-image';

interface Station {
  id: string;
  name: string;
  district: string;
  location: string;
  brand: string;
  operatingHours: string | string[];
  prices: Record<string, number>;
  fuelTypes: string[];
  lastUpdated: any;
  isVerified?: boolean;
  latitude?: number;
  longitude?: number;
  isSuspended?: boolean;
  isPublished?: boolean;
  status?: 'pending' | 'approved' | 'disapproved';
  isOutOfStock?: boolean;
}

interface Promotion {
  id: string;
  stationIds: string[];
  fuelTypes: string[];
  discountAmount: number;
  discountType: 'fixed' | 'percentage';
  startTime: any;
  endTime: any;
  description?: string;
  isActive: boolean;
}

const isStationOutOfStock = (station: Station) => {
  if (station.isOutOfStock) return true;
  const prices = Object.values(station.prices || {});
  if (prices.length === 0) return true;
  return prices.every(p => p === 0);
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Home() {
  const { user } = useAuth();
  const { subscribe, unsubscribe, isSubscribed, subscriptions } = useNotifications();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const [stations, setStations] = useState<Station[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [govPrices, setGovPrices] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedFuel, setSelectedFuel] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'updated' | 'proximity'>('updated');
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [viewingStation, setViewingStation] = useState<Station | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [rawPriceHistory, setRawPriceHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyViewMode, setHistoryViewMode] = useState<'line' | 'bar' | 'table'>('line');
  const [historyFuelFilter, setHistoryFuelFilter] = useState<string>('All');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historySortOrder, setHistorySortOrder] = useState<'desc' | 'asc'>('desc');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyTimeframe, setHistoryTimeframe] = useState<string>('365');

  const [reportStatus, setReportStatus] = useState<Record<string, 'idle' | 'reporting' | 'success' | 'error'>>({});

  const handleReportDiscrepancy = async (station: Station, fuelType: string, listedPrice: number) => {
    const key = `${station.id}-${fuelType}`;
    if (!user) {
      setReportStatus(prev => ({ ...prev, [key]: 'error' }));
      setTimeout(() => setReportStatus(prev => ({ ...prev, [key]: 'idle' })), 3000);
      return;
    }
    
    setReportStatus(prev => ({ ...prev, [key]: 'reporting' }));
    try {
      await addDoc(collection(db, 'price_reports'), {
        stationId: station.id,
        stationName: station.name,
        fuelType,
        listedPrice,
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setReportStatus(prev => ({ ...prev, [key]: 'success' }));
      setTimeout(() => setReportStatus(prev => ({ ...prev, [key]: 'idle' })), 3000);
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      setReportStatus(prev => ({ ...prev, [key]: 'error' }));
      setTimeout(() => setReportStatus(prev => ({ ...prev, [key]: 'idle' })), 3000);
    }
  };

  const filteredPriceHistory = useMemo(() => {
    let result = [...priceHistory];
    
    const now = new Date().getTime();
    let timeframeMs: number | null = null;
    
    if (historyTimeframe === '30') timeframeMs = 30 * 24 * 60 * 60 * 1000;
    else if (historyTimeframe === '90') timeframeMs = 90 * 24 * 60 * 60 * 1000;
    else if (historyTimeframe === '180') timeframeMs = 180 * 24 * 60 * 60 * 1000;
    else if (historyTimeframe === '365') timeframeMs = 365 * 24 * 60 * 60 * 1000;
    
    if (timeframeMs !== null) {
      result = result.filter(row => row.timestamp >= now - timeframeMs);
    }
    
    if (historySearchTerm) {
      const lower = historySearchTerm.toLowerCase();
      result = result.filter(row => row.date.toLowerCase().includes(lower));
    }
    
    if (historyDateFrom) {
      const fromTime = new Date(historyDateFrom).getTime();
      result = result.filter(row => row.timestamp >= fromTime);
    }
    
    if (historyDateTo) {
      const toTime = new Date(historyDateTo).getTime() + 86400000;
      result = result.filter(row => row.timestamp <= toTime);
    }
    
    return result;
  }, [priceHistory, historySearchTerm, historyDateFrom, historyDateTo, historyTimeframe]);

  const sortedTableHistory = useMemo(() => {
    let result = [...filteredPriceHistory];
    if (historySortOrder === 'desc') {
      result.reverse();
    }
    return result;
  }, [filteredPriceHistory, historySortOrder]);

  const exportHistoryToPDF = async () => {
    if (!viewingStation) return;
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      
      let currentY = 0;

      // --- Brand Header Banner ---
      doc.setFillColor(0, 114, 198); // Sierra Leone Blue
      doc.rect(0, 0, pageWidth, 28, 'F');
      
      // Green Accent line at the bottom of the header
      doc.setFillColor(30, 181, 58); // Sierra Leone Green
      doc.rect(0, 28, pageWidth, 2, 'F');
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Salone Fuel Monitor', margin, 18);
      
      // Subtitle / Label in header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255); // White
      doc.text('STATION PRICE HISTORY', pageWidth - margin, 18, { align: 'right' });

      currentY = 42;

      // --- Report Title & Meta ---
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 114, 198); // Sierra Leone Blue
      doc.text(`Price History - ${viewingStation.name}`, margin, currentY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500
      currentY += 8;
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, currentY);

      // Accent Line
      currentY += 6;
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      // --- Analysis Parameters ---
      currentY += 12;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 114, 198); // Sierra Leone Blue
      doc.text('Filters', margin, currentY);
      
      currentY += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      
      const filters = [
        `Fuel Type: ${historyFuelFilter}`
      ];
      if (historySearchTerm) filters.push(`Search: "${historySearchTerm}"`);
      if (historyDateFrom || historyDateTo) filters.push(`Date Range: ${historyDateFrom || 'Any'} to ${historyDateTo || 'Any'}`);

      filters.forEach(filter => {
        doc.text(`• ${filter}`, margin + 2, currentY);
        currentY += 5;
      });

      currentY += 5;

      // --- Chart ---
      if (historyChartRef.current && historyViewMode !== 'table') {
        try {
          const canvas = await Promise.race([
            toCanvas(historyChartRef.current, { 
              pixelRatio: 2,
              backgroundColor: '#ffffff'
            }),
            new Promise<HTMLCanvasElement>((_, reject) => setTimeout(() => reject(new Error("Chart rendering timeout")), 5000))
          ]);
          const imgData = canvas.toDataURL('image/png');
          
          const chartWidth = pageWidth - (margin * 2);
          const chartHeight = (canvas.height * chartWidth) / canvas.width;
          
          // If chart doesn't fit on this page, add a new page
          if (currentY + chartHeight > pageHeight - margin - 20) {
            doc.addPage();
            currentY = margin + 10;
          } else {
            currentY += 5;
          }
          
          doc.addImage(imgData, 'PNG', margin, currentY, chartWidth, chartHeight);
          currentY += chartHeight + 15;
        } catch (err) {
          console.error("Error capturing chart", err);
        }
      }

      const tableColumn = ["Date", "Petrol (NLe)", "Diesel (NLe)", "Kerosene (NLe)"];
      const tableRows: any[] = [];

      sortedTableHistory.forEach(row => {
        const rowData = [
          row.date,
          row.Petrol || '-',
          row.Diesel || '-',
          row.Kerosene || '-'
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        startY: currentY,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 181, 58], textColor: 255, fontStyle: 'bold' }, // Sierra Leone Green
        styles: { fontSize: 9, cellPadding: 4 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: margin, right: margin, bottom: margin + 15, left: margin }
      });

      // --- Footer for all pages ---
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // slate-400
        
        // Footer line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.text('Powered by Salone Fuel Monitor', margin, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      doc.save(`${viewingStation.name}_Price_History.pdf`);
      alert('PDF exported successfully');
    } catch (err: any) {
      console.error(err);
      alert(`Failed to export PDF: ${err.message || 'Unknown error'}`);
    }
  };

  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const districtDropdownRef = useRef<HTMLDivElement>(null);
  const historyChartRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const targetStationId = searchParams.get('station');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Location permission or detection not available:", error.message || error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(event.target as Node)) {
        setIsDistrictDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribeStations = onSnapshot(
      query(collection(db, 'stations'), orderBy('name')),
      { includeMetadataChanges: true },
      (snapshot) => {
        setIsOffline(snapshot.metadata.fromCache);
        const stationData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Station[];
        
        // Filter approved and published stations client-side to support legacy data
        const approvedStations = stationData.filter(s => 
          (s.status === 'approved' || !s.status) && 
          s.isPublished !== false &&
          s.isSuspended !== true
        );
        setStations(approvedStations);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'stations');
      }
    );

    const unsubscribeGov = onSnapshot(
      query(collection(db, 'price_trends'), orderBy('effectiveDate', 'desc'), limit(1)),
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setGovPrices({
            Petrol: data.petrolPrice || 0,
            Diesel: data.dieselPrice || 0,
            Kerosene: data.kerosenePrice || 0
          });
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'price_trends')
    );

    const promoQ = query(collection(db, 'promotions'), where('isActive', '==', true));
    const unsubscribePromos = onSnapshot(promoQ, (snapshot) => {
      const now = new Date();
      const promoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[];
      
      // Filter by time client-side
      const activePromos = promoData.filter(p => {
        const start = p.startTime?.seconds ? new Date(p.startTime.seconds * 1000) : new Date(p.startTime);
        const end = p.endTime?.seconds ? new Date(p.endTime.seconds * 1000) : new Date(p.endTime);
        return now >= start && now <= end;
      });
      
      setPromotions(activePromos);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'promotions'));

    return () => {
      unsubscribeStations();
      unsubscribeGov();
      unsubscribePromos();
    };
  }, []);

  const districts = React.useMemo(() => {
    const uniqueDistricts = Array.from(new Set(stations.map(s => s.district))).sort();
    return ['All', ...uniqueDistricts];
  }, [stations]);
  const brands = ['All', ...Array.from(new Set(stations.map(s => s.brand || 'Unknown')))].sort();
  const fuelTypes = ['All', 'Petrol', 'Diesel', 'Kerosene'];

  const cheapestPricesByDistrict = React.useMemo(() => {
    const minPrices: Record<string, Record<string, number>> = {};
    stations.forEach(station => {
      if (!minPrices[station.district]) {
        minPrices[station.district] = {};
      }
      fuelTypes.filter(f => f !== 'All').forEach(fuel => {
        const price = station.prices?.[fuel];
        if (price && price > 0) {
          if (!minPrices[station.district][fuel] || price < minPrices[station.district][fuel]) {
            minPrices[station.district][fuel] = price;
          }
        }
      });
    });
    return minPrices;
  }, [stations]);

  useEffect(() => {
    if (targetStationId && stations.length > 0) {
      const station = stations.find(s => s.id === targetStationId);
      if (station) setViewingStation(station);
    }
  }, [targetStationId, stations]);

  useEffect(() => {
    if (!viewingStation) {
      setPriceHistory([]);
      return;
    }

    setHistoryLoading(true);
    const unsubscribeHistory = onSnapshot(
      query(
        collection(db, 'price_history'),
        where('stationId', '==', viewingStation.id),
        orderBy('timestamp', 'asc')
      ),
      (snapshot) => {
        const historyData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
        setRawPriceHistory(historyData);
        // Group by date to format for chart
        const groupedData: Record<string, any> = {};
        
        historyData.forEach((entry: any) => {
          if (!entry.timestamp || typeof entry.timestamp.toDate !== 'function') return;
          const date = entry.timestamp.toDate().toLocaleDateString();
          if (!groupedData[date]) {
            groupedData[date] = { date, timestamp: entry.timestamp.toMillis() };
          }
          groupedData[date][entry.fuelType] = entry.price;
        });

        // Convert grouped object to array
        let chartData = Object.values(groupedData);
        chartData.sort((a, b) => a.timestamp - b.timestamp);
        
        chartData = chartData.map((item, index) => {
          const prev = index > 0 ? chartData[index - 1] : null;
          return {
            ...item,
            prevPetrol: prev?.Petrol,
            prevDiesel: prev?.Diesel,
            prevKerosene: prev?.Kerosene,
          };
        });

        setPriceHistory(chartData);
        setHistoryLoading(false);
      },
      (error) => {
        setHistoryLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'price_history');
      }
    );

    return () => unsubscribeHistory();
  }, [viewingStation]);

  const getBrandColor = (brand: string) => {
    const b = brand.toLowerCase();
    if (b.includes('np')) return 'emerald';
    if (b.includes('total')) return 'red';
    if (b.includes('leonco')) return 'emerald';
    if (b.includes('conex')) return 'orange';
    return 'gray';
  };

  const formatPrice = (val?: number) => {
    if (!val) return '-';
    return val >= 1000 ? `${val.toLocaleString()} SLL` : `NLe ${Number(val).toFixed(2)}`;
  };

  const renderTrend = (current?: number, previous?: number) => {
    if (!current || !previous || current === previous) {
      return <span className="text-[10px] text-gray-400 font-medium ml-1.5 inline-flex items-center"><Minus className="w-3 h-3 mr-0.5" /> 0%</span>;
    }
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    const isUp = diff > 0;
    return (
      <span className={`text-[10px] font-bold ml-1.5 inline-flex items-center ${isUp ? 'text-rose-500' : 'text-emerald-500'}`}>
        {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
        {Math.abs(percent).toFixed(1)}%
      </span>
    );
  };

  const getBrandColors = (brand: string) => {
    const color = getBrandColor(brand);
    const colors: Record<string, any> = {
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'text-emerald-500' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', icon: 'text-red-500' },
      blue: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'text-emerald-500' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: 'text-orange-500' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: 'text-gray-500' },
    };
    return colors[color];
  };

  const filteredStations = stations.filter(station => {
    if (targetStationId) {
      return station.id === targetStationId;
    }
    const matchesSearch = (station.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (station.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (station.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = selectedDistrict === 'All' || station.district === selectedDistrict;
    const matchesBrand = selectedBrand === 'All' || station.brand === selectedBrand;
    const matchesVerified = !showVerifiedOnly || station.isVerified;
    const matchesFavorites = !showFavoritesOnly || isFavorite(station.id);
    const hasFuelType = selectedFuel === 'All' || (station.fuelTypes || []).includes(selectedFuel);
    
    return matchesSearch && matchesDistrict && matchesBrand && matchesVerified && hasFuelType && matchesFavorites;
  }).sort((a, b) => {
    // If we have a picked location or user location, and sortBy is 'proximity' (or by default if no other sort is better)
    const refLocation = pickedLocation || userLocation;
    
    if (sortBy === 'updated' && refLocation) {
      // If we have a location, we might want to prioritize it, but let's stick to the explicit sort
    }

    switch (sortBy) {
      case 'price_asc': {
        const sortFuel = selectedFuel === 'All' ? 'Petrol' : selectedFuel;
        const priceA = (a.prices || {})[sortFuel] || Infinity;
        const priceB = (b.prices || {})[sortFuel] || Infinity;
        return priceA - priceB;
      }
      case 'price_desc': {
        const sortFuel = selectedFuel === 'All' ? 'Petrol' : selectedFuel;
        const priceA = (a.prices || {})[sortFuel] || 0;
        const priceB = (b.prices || {})[sortFuel] || 0;
        return priceB - priceA;
      }
      case 'name_asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name_desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'updated': {
        const dateA = a.lastUpdated?.toDate?.()?.getTime() || 0;
        const dateB = b.lastUpdated?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      }
      case 'proximity': {
        const refLocation = pickedLocation || userLocation;
        if (refLocation && a.latitude && a.longitude && b.latitude && b.longitude) {
          const distA = calculateDistance(refLocation.lat, refLocation.lng, a.latitude, a.longitude);
          const distB = calculateDistance(refLocation.lat, refLocation.lng, b.latitude, b.longitude);
          return distA - distB;
        }
        return 0;
      }
      default:
        // Handle proximity sort if implemented or as a fallback
        if (refLocation && a.latitude && a.longitude && b.latitude && b.longitude) {
          const distA = calculateDistance(refLocation.lat, refLocation.lng, a.latitude, a.longitude);
          const distB = calculateDistance(refLocation.lat, refLocation.lng, b.latitude, b.longitude);
          return distA - distB;
        }
        return 0;
    }
  });

  const clearTargetStation = () => {
    navigate('/');
  };

  const isProximityActive = !!(pickedLocation || userLocation);

  const getPriceIndicator = (price: number, govPrice: number) => {
    if (!govPrice) return null;
    const diff = price - govPrice;
    
    if (diff > 0) {
      return (
        <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border border-red-100 animate-pulse">
          <ShieldAlert className="w-3 h-3 mr-1" />
          Above Limit (+{diff.toLocaleString()})
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border border-emerald-100">
          <TrendingDown className="w-3 h-3 mr-1" />
          {diff.toLocaleString()}
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border border-emerald-100">
          <Check className="w-3 h-3 mr-1" />
          Official
        </div>
      );
    }
  };

  const getActivePromosForStation = (stationId: string) => {
    return promotions.filter(p => p.stationIds && p.stationIds.includes(stationId));
  };

  const getDiscountedPrice = (price: number, promo?: Promotion) => {
    if (!promo) return price;
    if (promo.discountType === 'fixed') {
      return Math.max(0, price - promo.discountAmount);
    } else {
      return Math.max(0, price * (1 - promo.discountAmount / 100));
    }
  };

  const isRecentlyUpdated = (station: Station) => {
    if (!station.lastUpdated?.toDate) return false;
    const updatedTime = station.lastUpdated.toDate().getTime();
    const now = new Date().getTime();
    return (now - updatedTime) < 60000; // 60 seconds
  };

  const handleSubscribeDistrict = () => {
    if (!user) return;
    if (selectedDistrict === 'All') return;
    
    const sub = subscriptions.find(s => s.type === 'district' && s.targetId === selectedDistrict);
    if (sub) {
      unsubscribe(sub.id);
    } else {
      subscribe('district', selectedDistrict, selectedDistrict);
    }
  };

  const handleSubscribeStation = (station: Station) => {
    if (!user) return;
    
    const sub = subscriptions.find(s => s.type === 'station' && s.targetId === station.id);
    if (sub) {
      unsubscribe(sub.id);
    } else {
      subscribe('station', station.id, station.name);
    }
  };

  const isCheapestPrice = (fuelType: string, price: number | undefined) => {
    if (!price) return false;
    const allPrices = selectedStations
      .map(id => stations.find(s => s.id === id)?.prices?.[fuelType])
      .filter((p): p is number => p !== undefined && p > 0);
    
    if (allPrices.length === 0) return false;
    const minPrice = Math.min(...allPrices);
    return price === minPrice;
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2 tracking-tight">Fuel Price Monitor</h1>
          <p className="text-gray-500 font-medium">Compare fuel prices across Sierra Leone</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live Updates Active</span>
        </div>
      </div>

      {/* Filters */}
      {!targetStationId ? (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 mb-10 relative z-40">
          <div className="p-8">
            <div className="flex flex-col gap-8">
              {/* Main Search - Hero Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="w-6 h-6 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by station name, location, or brand..."
                    className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-lg font-medium placeholder:text-gray-400 shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Mobile Filter Toggle */}
                <Button
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  showNotification={false}
                  variant="outline"
                  className="sm:hidden flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-surface-900 active:scale-95 transition-all"
                >
                  <Filter className="w-5 h-5 text-primary" />
                  {isFiltersExpanded ? 'Hide Filters' : 'Show Filters'}
                  {isFiltersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              {/* Collapsible Filter Section */}
              <AnimatePresence initial={false}>
                {(isFiltersExpanded || window.innerWidth >= 640) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                    animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                    exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="flex flex-col gap-8 pt-2">
                      {/* Filter Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Primary Filters - Location & Fuel */}
                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Location / District</label>
                            <div className="relative flex gap-2">
                              <div className="relative flex-1 z-50" ref={districtDropdownRef}>
                                <div className="relative group z-50">
                                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors pointer-events-none" />
                                  <Button
                                    type="button"
                                    onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
                                    showNotification={false}
                                    variant="ghost"
                                    className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-gray-200 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold text-surface-900 text-left flex items-center justify-between shadow-sm"
                                  >
                                    <span className="truncate">
                                      {selectedDistrict === 'All' ? 'All Districts' : selectedDistrict}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDistrictDropdownOpen ? 'rotate-180' : ''}`} />
                                  </Button>
                                  
                                  {isDistrictDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 max-h-[320px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                                      <div className="px-3 pb-2 mb-2 border-b border-gray-50">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Select District</p>
                                      </div>
                                      {districts.map(d => (
                                        <Button
                                          key={d}
                                          type="button"
                                          onClick={() => {
                                            setSelectedDistrict(d);
                                            setIsDistrictDropdownOpen(false);
                                          }}
                                          showNotification={false}
                                          variant="ghost"
                                          className={`w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center justify-between mx-1 rounded-lg w-[calc(100%-8px)] ${
                                            selectedDistrict === d 
                                              ? 'bg-primary/10 text-primary font-bold' 
                                              : 'text-gray-600 hover:bg-gray-50'
                                          }`}
                                        >
                                          {d === 'All' ? 'All Districts' : d}
                                          {selectedDistrict === d && <Check className="w-4 h-4" />}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {user && selectedDistrict !== 'All' && (
                                <Button
                                  onClick={handleSubscribeDistrict}
                                  notificationMessage={isSubscribed('district', selectedDistrict) ? "Unsubscribed from district alerts" : "Subscribed to district alerts"}
                                  variant="ghost"
                                  className={`px-4 py-3.5 rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                                    isSubscribed('district', selectedDistrict)
                                      ? 'bg-emerald-50 border-primary/20 text-primary hover:bg-emerald-100'
                                      : 'bg-white border-gray-100 text-gray-400 hover:border-primary/20 hover:text-primary'
                                  }`}
                                  title={isSubscribed('district', selectedDistrict) ? "Unsubscribe from district" : "Subscribe to district alerts"}
                                >
                                  {isSubscribed('district', selectedDistrict) ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fuel Type</label>
                            <div className="relative group">
                              <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                              <select
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-gray-200 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold text-surface-900 appearance-none cursor-pointer shadow-sm"
                                value={selectedFuel}
                                onChange={(e) => setSelectedFuel(e.target.value)}
                              >
                                <option value="All">All Fuel Types</option>
                                {fuelTypes.filter(f => f !== 'All').map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Secondary Filters - Brand & Sort */}
                        <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Brand</label>
                            <div className="relative group">
                              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                              <select
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-gray-200 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold text-surface-900 appearance-none cursor-pointer shadow-sm"
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                              >
                                {brands.map(b => <option key={b} value={b}>{b === 'All' ? 'All Brands' : b}</option>)}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sort By</label>
                            <div className="relative group">
                              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                              <select
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-gray-200 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold text-surface-900 appearance-none cursor-pointer shadow-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                              >
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="name_asc">Name: A-Z</option>
                                <option value="name_desc">Name: Z-A</option>
                                <option value="updated">Recently Updated</option>
                                {isProximityActive && <option value="proximity">Nearest to Me</option>}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Controls */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-8">
                           <label className="flex items-center cursor-pointer group gap-3">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={showVerifiedOnly}
                                onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                              />
                              <div className={`w-11 h-6 rounded-full transition-all duration-300 relative ${showVerifiedOnly ? 'bg-primary' : 'bg-gray-200'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${showVerifiedOnly ? 'translate-x-5' : ''}`} />
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-600 group-hover:text-surface-900 transition-colors">Verified Only</span>
                          </label>

                          {user && (
                            <>
                              <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                              <label className="flex items-center cursor-pointer group gap-3">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showFavoritesOnly}
                                    onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                                  />
                                  <div className={`w-11 h-6 rounded-full transition-all duration-300 relative ${showFavoritesOnly ? 'bg-rose-500' : 'bg-gray-200'}`}>
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${showFavoritesOnly ? 'translate-x-5' : ''}`} />
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-gray-600 group-hover:text-surface-900 transition-colors flex items-center gap-1.5">
                                  <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'text-rose-500 fill-current' : 'text-gray-400'}`} />
                                  Favorites Only
                                </span>
                              </label>
                            </>
                          )}

                          <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>

                          <p className="text-sm text-gray-500 font-medium">
                            Showing <span className="text-surface-900 font-bold">{filteredStations.length}</span> stations
                          </p>
                          {isOffline && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold shadow-sm border border-amber-100 ml-2">
                              <CloudOff className="w-3.5 h-3.5" />
                              Offline
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedDistrict('All');
                            setSelectedFuel('All');
                            setSelectedBrand('All');
                            setShowVerifiedOnly(false);
                            setSortBy('updated');
                            setPickedLocation(null);
                          }}
                          notificationMessage="All filters cleared"
                          variant="ghost"
                          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-95"
                        >
                          <X className="w-4 h-4" />
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 p-5 rounded-2xl shadow-sm border border-emerald-200 mb-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 text-emerald-900">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Viewing station from notification</p>
              <p className="text-xs text-emerald-700 font-medium">Showing specific results for your alert</p>
            </div>
          </div>
          <Button
            onClick={clearTargetStation}
            notificationMessage="Station filter cleared"
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 bg-white text-primary border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all text-sm font-bold shadow-sm active:scale-95"
          >
            <X className="w-4 h-4" />
            Clear Filter
          </Button>
        </div>
      )}

      {/* Floating Compare Bar */}
      {selectedStations.length > 0 && !showComparison && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10">
          <span className="font-bold">{selectedStations.length} station{selectedStations.length !== 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowComparison(true)}
              disabled={selectedStations.length < 2}
              notificationMessage="Opening comparison view"
              variant="primary"
              className="px-4 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Compare
            </Button>
            <Button
              onClick={() => setSelectedStations([])}
              notificationMessage="Selection cleared"
              variant="ghost"
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {showComparison ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-surface-900">Station Comparison</h2>
            <Button
              onClick={() => setShowComparison(false)}
              showNotification={false}
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-surface-900 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </Button>
          </div>
          
          <div className="overflow-x-auto pb-8">
            <div className="flex gap-6 min-w-max">
              {selectedStations.map(id => {
                const station = stations.find(s => s.id === id);
                if (!station) return null;
                return (
                  <div key={station.id} className="w-96 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col relative">
                    <Button 
                      onClick={() => setSelectedStations(prev => prev.filter(sId => sId !== id))}
                      notificationMessage="Removed from comparison"
                      variant="ghost"
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <h3 className="text-xl font-bold text-surface-900 mb-1 pr-8 leading-tight">{station.name}</h3>
                    <p className="text-sm text-gray-500 mb-6 font-medium">{station.brand} • {station.district}</p>
                    
                    <div className="space-y-4 flex-1">
                      {fuelTypes.filter(f => f !== 'All').map(fuel => {
                        const price = (station.prices || {})[fuel];
                        const isCheapest = isCheapestPrice(fuel, price);
                        return (
                          <div key={fuel} className={`p-4 rounded-xl border-2 transition-all ${isCheapest ? 'bg-emerald-50 border-emerald-400 shadow-sm shadow-emerald-100/50 scale-[1.02] z-10 relative' : 'bg-gray-50 border-transparent'}`}>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isCheapest ? 'text-emerald-600' : 'text-gray-500'}`}>{fuel}</p>
                            {price ? (
                              <div className="flex items-end justify-between">
                                <p className={`text-xl font-bold ${isCheapest ? 'text-emerald-700' : 'text-surface-900'}`}>
                                  {price.toLocaleString()} <span className={`text-sm font-normal ${isCheapest ? 'text-emerald-600/70' : 'text-gray-500'}`}>SLL/L</span>
                                </p>
                                {isCheapest && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                    <Trophy className="w-3 h-3" />
                                    Cheapest
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-gray-400">Not available</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-100 w-full flex-shrink-0">
                      <StationComparisonChart stationId={station.id} stationName={station.name} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Content */}
          <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          {viewMode === 'list' ? <LayoutList className="w-5 h-5 text-primary" /> : <MapPin className="w-5 h-5 text-primary" />}
          {viewMode === 'list' ? 'Station List' : 'Map View'}
        </h2>
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <Button
            onClick={() => setViewMode('list')}
            showNotification={false}
            variant="unstyled"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            List
          </Button>
          <Button
            onClick={() => setViewMode('map')}
            showNotification={false}
            variant="unstyled"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Map
          </Button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="animate-in fade-in zoom-in-95 duration-500 relative">
          <AdminStationMap 
            stations={filteredStations} 
            showTitle={false} 
            onLocationSelect={(lat, lng) => {
              setPickedLocation({ lat, lng });
              setSortBy('proximity');
            }}
            selectedLocation={pickedLocation}
            onStationSelect={setViewingStation}
          />
          
          {pickedLocation && (
            <div className="absolute top-4 left-4 z-[1000] animate-in slide-in-from-left-4 duration-300">
              <div className="bg-white/90 backdrop-blur-md border border-primary/20 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filtering by Proximity</p>
                  <p className="text-sm font-bold text-surface-900">Custom location picked on map</p>
                </div>
                <Button
                  onClick={() => setPickedLocation(null)}
                  notificationMessage="Proximity filter cleared"
                  variant="ghost"
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-surface-900/80 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Click anywhere on the map to pick a reference location
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStations.map(station => {
          const recentlyUpdated = isRecentlyUpdated(station);
          const brandColors = getBrandColors(station.brand || 'Unknown');
          const distance = (pickedLocation || userLocation) && station.latitude && station.longitude 
            ? calculateDistance((pickedLocation || userLocation)!.lat, (pickedLocation || userLocation)!.lng, station.latitude, station.longitude)
            : null;
          const activePromos = getActivePromosForStation(station.id);
          
          return (
          <div 
            key={station.id} 
            className={`bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative flex flex-col ${
              recentlyUpdated ? 'border-emerald-400 ring-1 ring-emerald-400/20' : 'border-gray-100'
            } ${station.isSuspended ? 'opacity-75 grayscale-[0.5]' : ''}`}
            onClick={() => setViewingStation(station)}
          >
            {/* Suspended Badge */}
            {station.isSuspended && (
              <div className="absolute top-4 left-4 z-20 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 animate-in zoom-in-95">
                <Slash className="w-3 h-3" />
                Suspended
              </div>
            )}
            {/* Brand Accent Bar */}
            <div className={`h-1.5 w-full ${brandColors.bg.replace('50', '500')}`} />
                        {/* Quick Actions Overlay (Hover) */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 md:opacity-0 md:group-hover:opacity-100 md:translate-x-4 md:group-hover:translate-x-0 transition-all duration-300">
              {user && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(station.id);
                  }}
                  showNotification={false}
                  variant="unstyled"
                  className={`w-12 h-12 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all ${
                    isFavorite(station.id)
                      ? 'bg-rose-500 text-white border-rose-500 shadow-lg'
                      : 'bg-white/90 text-gray-400 border-gray-200 hover:text-rose-500 hover:border-rose-500'
                  }`}
                  title={isFavorite(station.id) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-6 h-6 ${isFavorite(station.id) ? 'fill-current' : ''}`} />
                </Button>
              )}

              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStations(prev => 
                    prev.includes(station.id) ? prev.filter(id => id !== station.id) : [...prev, station.id]
                  );
                }}
                showNotification={false}
                variant="unstyled"
                className={`w-10 h-10 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all ${
                  selectedStations.includes(station.id)
                    ? 'bg-primary text-white border-primary shadow-lg'
                    : 'bg-white/90 text-gray-400 border-gray-200 hover:text-primary hover:border-primary'
                }`}
              >
                {selectedStations.includes(station.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </Button>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`, '_blank');
                }}
                showNotification={false}
                variant="unstyled"
                className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200 text-gray-400 hover:text-emerald-500 hover:border-emerald-500 flex items-center justify-center transition-all"
              >
                <Navigation className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl ${brandColors.bg} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                      <Building2 className={`w-6 h-6 ${brandColors.icon}`} />
                    </div>
                    {station.isVerified && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-surface-900 group-hover:text-primary transition-colors leading-tight break-words">
                      {station.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <MapPin className="w-3 h-3" />
                        <span className="break-words">{station.location}</span>
                      </div>
                      {distance !== null && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-1.5 py-0.5 rounded-md">
                          <Navigation className="w-2.5 h-2.5" />
                          {distance.toFixed(1)} km
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${brandColors.bg} ${brandColors.text} border ${brandColors.border}`}>
                    {station.brand}
                  </span>
                  {isStationOutOfStock(station) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-rose-100 text-rose-700 border border-rose-200">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white shadow-sm duration-300">
                      Available
                    </span>
                  )}
                  {recentlyUpdated && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-emerald-600 text-white shadow-sm animate-in fade-in zoom-in duration-300">
                      <Activity className="w-3 h-3" />
                      Live
                    </span>
                  )}
                  {activePromos.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500 text-white shadow-sm animate-in bounce-in duration-500">
                      <Percent className="w-3 h-3" />
                      Promo
                    </span>
                  )}
                  {isOffline && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 shadow-sm border border-amber-200">
                      <CloudOff className="w-3 h-3" />
                      Offline
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {targetStationId || selectedFuel === 'All' ? (
                  <div className="grid grid-cols-1 gap-3">
                    {(station.fuelTypes || []).map(fuel => {
                      const price = (station.prices || {})[fuel];
                      const promo = activePromos.find(p => p.fuelTypes && p.fuelTypes.includes(fuel));
                      const discountedPrice = price ? getDiscountedPrice(price, promo) : null;
                      const isCheapestInDistrict = price && price === cheapestPricesByDistrict[station.district]?.[fuel];
                      return (
                        <div key={fuel} className={`flex justify-between items-center p-3.5 rounded-2xl border-2 transition-all duration-300 ${
                          isCheapestInDistrict 
                            ? 'bg-emerald-50 border-emerald-400 shadow-sm shadow-emerald-100/50' 
                            : 'bg-surface-50 border-transparent hover:border-gray-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCheapestInDistrict ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                              <Fuel className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isCheapestInDistrict ? 'text-emerald-600' : 'text-gray-400'}`}>{fuel}</p>
                                {isCheapestInDistrict && (
                                  <span className="flex items-center gap-1 text-[8px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    <Trophy className="w-2 h-2" />
                                    Best
                                  </span>
                                )}
                                {promo && (
                                  <span className="flex items-center gap-1 text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    -{promo.discountAmount}{promo.discountType === 'percentage' ? '%' : ' SLL'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <p className={`text-base font-bold flex items-baseline gap-1 ${isCheapestInDistrict ? 'text-emerald-700' : 'text-surface-900'}`}>
                                  {discountedPrice?.toLocaleString() || 'N/A'}
                                  <span className={`text-[10px] font-bold ${isCheapestInDistrict ? 'text-emerald-600/70' : 'text-gray-400'}`}>SLL/L</span>
                                </p>
                                {promo && price && (
                                  <p className="text-[10px] font-bold text-gray-400 line-through">
                                    {price.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {getPriceIndicator(discountedPrice || price, govPrices[fuel])}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  (() => {
                    const price = (station.prices || {})[selectedFuel];
                    const promo = activePromos.find(p => p.fuelTypes && p.fuelTypes.includes(selectedFuel));
                    const discountedPrice = price ? getDiscountedPrice(price, promo) : null;
                    const isCheapestInDistrict = price && price === cheapestPricesByDistrict[station.district]?.[selectedFuel];
                    return (
                      <div className="space-y-4">
                        {/* Main Price Display */}
                        <div className={`relative p-5 rounded-3xl border-2 transition-all duration-300 ${
                          isCheapestInDistrict 
                            ? 'bg-amber-50/50 border-amber-400 shadow-sm shadow-amber-100/50' 
                            : 'bg-surface-50 border-transparent hover:border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${isCheapestInDistrict ? 'bg-amber-500' : 'bg-primary'} animate-pulse`} />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedFuel}</span>
                            </div>
                            {isCheapestInDistrict && (
                              <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                <Trophy className="w-2.5 h-2.5" />
                                Best in {station.district}
                              </div>
                            )}
                            {promo && (
                              <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                <Percent className="w-2.5 h-2.5" />
                                Promo Active
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-3xl font-black tracking-tight ${isCheapestInDistrict ? 'text-amber-700' : 'text-surface-900'}`}>
                                {discountedPrice?.toLocaleString() || 'N/A'}
                              </span>
                              <div className="flex flex-col">
                                <span className={`text-xs font-bold uppercase ${isCheapestInDistrict ? 'text-amber-600/70' : 'text-gray-400'}`}>SLL/L</span>
                                {promo && price && (
                                  <span className="text-[10px] font-bold text-gray-400 line-through">
                                    {price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            {getPriceIndicator(discountedPrice || price, govPrices[selectedFuel])}
                          </div>
                        </div>
                        
                        {/* Secondary Fuel Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {(station.fuelTypes || []).filter(f => f !== selectedFuel).map(fuel => {
                            const p = station.prices?.[fuel];
                            const pr = activePromos.find(promo => promo.fuelTypes && promo.fuelTypes.includes(fuel));
                            const dp = p ? getDiscountedPrice(p, pr) : null;
                            return (
                            <div key={fuel} className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col gap-1.5 hover:border-primary/20 transition-all hover:shadow-md">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{fuel}</span>
                                  {pr && <Percent className="w-2 h-2 text-amber-500" />}
                                </div>
                                {p && getPriceIndicator(dp || p, govPrices[fuel])}
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-surface-800">
                                  {dp?.toLocaleString() || '—'}
                                </span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">SLL</span>
                                {pr && p && (
                                  <span className="text-[8px] text-gray-400 line-through ml-1">{p.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                          )})}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="bg-surface-50/50 px-6 py-4 border-t border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <History className="w-3 h-3" />
                  <span>{station.lastUpdated?.toDate?.()?.toLocaleDateString() || 'Just now'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  <span>
                    {Array.isArray(station.operatingHours) 
                      ? (station.operatingHours[0] || 'N/A') 
                      : (station.operatingHours || 'N/A')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {user && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      const sub = subscriptions.find(s => s.type === 'station' && s.targetId === station.id);
                      if (sub) {
                        unsubscribe(sub.id);
                      } else {
                        subscribe('station', station.id, station.name);
                      }
                    }}
                    notificationMessage={isSubscribed('station', station.id) ? "Unsubscribed from station alerts" : "Subscribed to station alerts"}
                    variant="unstyled"
                    className={`p-2 rounded-xl transition-all active:scale-90 ${
                      isSubscribed('station', station.id)
                        ? 'bg-primary/10 text-primary'
                        : 'bg-white text-gray-400 hover:text-gray-600 shadow-sm border border-gray-100'
                    }`}
                  >
                    {isSubscribed('station', station.id) ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </Button>
                )}
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
              </div>
            </div>
            
          </div>
          );
        })}

        {filteredStations.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Fuel className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-surface-900">No stations found</h3>
            <p className="text-gray-500 mt-2 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
      )}
    </>
    )}
            {/* Station Details Modal */}
      {viewingStation && (
        <div className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setViewingStation(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100 text-primary flex items-center justify-center shadow-inner">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-surface-900 leading-tight break-words">{viewingStation.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">{viewingStation.brand}</p>
                    {isStationOutOfStock(viewingStation) ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                        Out Of Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        In Stock
                      </span>
                    )}
                    {isOffline && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                        <CloudOff className="w-2.5 h-2.5" />
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <Button
                    onClick={() => toggleFavorite(viewingStation.id)}
                    showNotification={false}
                    variant="unstyled"
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg sm:rounded-xl transition-all shadow-sm border ${
                      isFavorite(viewingStation.id)
                        ? 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100'
                        : 'bg-white text-gray-400 hover:text-rose-500 hover:bg-rose-50 border-gray-100'
                    }`}
                    title={isFavorite(viewingStation.id) ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Heart className={`w-6 h-6 sm:w-7 sm:h-7 ${isFavorite(viewingStation.id) ? 'fill-current' : ''}`} />
                  </Button>
                )}
                <Button
                  onClick={() => setViewingStation(null)}
                  showNotification={false}
                  variant="unstyled"
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-100 text-gray-600 hover:text-surface-900 hover:bg-gray-200 rounded-lg sm:rounded-xl transition-all shadow-sm"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
              {getActivePromosForStation(viewingStation.id).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                      <Percent className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-amber-900">Active Promotions</h4>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Limited time offers available now</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getActivePromosForStation(viewingStation.id).map(promo => (
                      <div key={promo.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{promo.fuelTypes?.join(', ')}</span>
                          <span className="text-sm font-black text-emerald-600">-{promo.discountAmount}{promo.discountType === 'percentage' ? '%' : ' SLL'}</span>
                        </div>
                        {promo.description && <p className="text-xs text-gray-600 font-medium leading-relaxed">{promo.description}</p>}
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                          <Clock className="w-3 h-3" />
                          Ends {promo.endTime?.seconds ? new Date(promo.endTime.seconds * 1000).toLocaleString() : new Date(promo.endTime).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Station Information</h4>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Location</span>
                          <span className="text-sm font-bold text-surface-900">{viewingStation.location}, {viewingStation.district}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Operating Hours</span>
                          <div className="text-sm font-bold text-surface-900">
                            {Array.isArray(viewingStation.operatingHours) ? (
                              <div className="space-y-1">
                                {viewingStation.operatingHours.map((h, i) => (
                                  <div key={i}>{h}</div>
                                ))}
                              </div>
                            ) : (
                              viewingStation.operatingHours || 'N/A'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Verification Status</h4>
                    <div className={`p-4 sm:p-6 rounded-3xl border-2 flex flex-col items-center text-center gap-3 transition-all ${
                      viewingStation.isVerified 
                        ? 'bg-emerald-50 border-primary/20 text-primary' 
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm ${
                        viewingStation.isVerified ? 'bg-white text-primary' : 'bg-white text-amber-500'
                      }`}>
                        {viewingStation.isVerified ? <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" /> : <Shield className="w-6 h-6 sm:w-7 sm:h-7" />}
                      </div>
                      <div>
                        <p className="text-base sm:text-lg font-bold">{viewingStation.isVerified ? 'Verified Station' : 'Pending Verification'}</p>
                        <p className="text-[10px] sm:text-xs opacity-80 font-medium">
                          {viewingStation.isVerified 
                            ? 'This station is officially verified by Salone Fuel Monitor.' 
                            : 'This station is awaiting official verification.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Current Fuel Prices</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {fuelTypes.filter(f => f !== 'All').map((fuel) => {
                    const price = viewingStation.prices?.[fuel];
                    const promo = getActivePromosForStation(viewingStation.id).find(p => p.fuelTypes && p.fuelTypes.includes(fuel));
                    const discountedPrice = price ? getDiscountedPrice(price, promo) : null;
                    return (
                    <div key={fuel} className="bg-surface-50 p-3 sm:p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{fuel}</span>
                          {promo && <Percent className="w-2.5 h-2.5 text-amber-500" />}
                        </div>
                        {price && getPriceIndicator(discountedPrice || price, govPrices[fuel])}
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-surface-900 flex items-baseline gap-2">
                        {discountedPrice ? (
                          <>
                            {discountedPrice.toLocaleString()}
                            <span className="text-[10px] font-bold text-gray-400">SLL/L</span>
                            {promo && price && (
                              <span className="text-[10px] font-bold text-gray-400 line-through ml-1">
                                {price.toLocaleString()}
                              </span>
                            )}
                          </>
                        ) : 'Not set'}
                      </div>
                      {price > 0 && (() => {
                        const rStatus = reportStatus[`${viewingStation.id}-${fuel}`] || 'idle';
                        return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (rStatus === 'idle') {
                              handleReportDiscrepancy(viewingStation, fuel, price);
                            }
                          }}
                          disabled={rStatus !== 'idle'}
                          className={`mt-2 relative z-10 pointer-events-auto cursor-pointer flex items-center justify-center gap-1.5 w-full text-[10px] font-bold py-1.5 px-2 rounded-lg transition-colors border disabled:opacity-80 ${
                            rStatus === 'success' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                              : rStatus === 'error'
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-amber-50 text-amber-600 hover:text-amber-700 hover:bg-amber-100 border-amber-100'
                          }`}
                          title="Report price discrepancy"
                        >
                          {rStatus === 'success' ? (
                            <>
                              <Check className="w-3 h-3" />
                              Reported!
                            </>
                          ) : rStatus === 'error' ? (
                            <>
                              <X className="w-3 h-3" />
                              {user ? 'Error submitting' : 'Login required'}
                            </>
                          ) : rStatus === 'reporting' ? (
                            <>
                              <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                              Reporting...
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3" />
                              Report Discrepancy
                            </>
                          )}
                        </button>
                        );
                      })()}
                    </div>
                  )})}
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price History</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setHistoryViewMode('line')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${historyViewMode === 'line' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Line
                      </button>
                      <button
                        onClick={() => setHistoryViewMode('bar')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${historyViewMode === 'bar' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Bar
                      </button>
                      <button
                        onClick={() => setHistoryViewMode('table')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${historyViewMode === 'table' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Table
                      </button>
                    </div>
                    <button
                      onClick={exportHistoryToPDF}
                      className="ml-2 flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                      title="Export as PDF"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </button>
                  </div>
                </div>

                  <div className="mb-4 flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search date..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="text-xs font-bold bg-white border-none rounded-lg shadow-sm focus:ring-0 py-1 px-3 w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <select
                        value={historyTimeframe}
                        onChange={(e) => setHistoryTimeframe(e.target.value)}
                        className="text-xs font-bold bg-white border-none rounded-lg shadow-sm focus:ring-0 py-1"
                      >
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 3 Months</option>
                        <option value="180">Last 6 Months</option>
                        <option value="365">Last 1 Year</option>
                        <option value="all">All Time</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <input 
                        type="date"
                        value={historyDateFrom}
                        onChange={(e) => setHistoryDateFrom(e.target.value)}
                        className="text-xs font-bold bg-white border-none rounded-lg shadow-sm focus:ring-0 py-1"
                      />
                      <span className="text-gray-400 text-xs">-</span>
                      <input 
                        type="date"
                        value={historyDateTo}
                        onChange={(e) => setHistoryDateTo(e.target.value)}
                        className="text-xs font-bold bg-white border-none rounded-lg shadow-sm focus:ring-0 py-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fuel:</span>
                      <select 
                        value={historyFuelFilter}
                        onChange={(e) => setHistoryFuelFilter(e.target.value)}
                        className="text-xs font-bold bg-white border-none rounded-lg shadow-sm focus:ring-0 py-1"
                      >
                        <option value="All">All Fuels</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Kerosene">Kerosene</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sort:</span>
                      <select 
                        value={historySortOrder}
                        onChange={(e) => setHistorySortOrder(e.target.value as 'desc' | 'asc')}
                        className="text-xs font-bold bg-white border-none rounded-lg shadow-sm focus:ring-0 py-1"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>
                  </div>

                <div ref={historyChartRef} className={`bg-white rounded-3xl border border-gray-100 shadow-inner ${historyViewMode !== 'table' ? 'p-4 sm:p-6 h-64 sm:h-72' : 'overflow-hidden max-h-96 overflow-y-auto'}`}>
                  {historyLoading ? (
                    <div className="flex flex-col justify-center items-center h-full gap-3 py-12">
                      <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-primary/20 border-t-primary"></div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading History...</p>
                    </div>
                  ) : rawPriceHistory.length > 0 ? (
                    historyViewMode === 'line' || historyViewMode === 'bar' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        {historyViewMode === 'line' ? (
                          <LineChart data={filteredPriceHistory} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                              tickFormatter={(value) => value >= 1000 ? `Le ${(value / 1000).toFixed(0)}k` : `NLe ${value.toFixed(0)}`}
                              dx={-10}
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
                              formatter={(value: number) => [`${value.toLocaleString()} SLL`, '']}
                            />
                            <Legend 
                              verticalAlign="top" 
                              align="right" 
                              iconType="circle"
                              wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                            />
                            {(historyFuelFilter === 'All' || historyFuelFilter === 'Diesel') && (
                              <Line name="Diesel" type="monotone" dataKey="Diesel" stroke="var(--color-surface-900)" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                            )}
                            {(historyFuelFilter === 'All' || historyFuelFilter === 'Kerosene') && (
                              <Line name="Kerosene" type="monotone" dataKey="Kerosene" stroke="#2563EB" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                            )}
                            {(historyFuelFilter === 'All' || historyFuelFilter === 'Petrol') && (
                              <Line name="Petrol" type="monotone" dataKey="Petrol" stroke="var(--color-primary)" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                            )}
                          </LineChart>
                        ) : (
                          <BarChart data={filteredPriceHistory} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                              tickFormatter={(value) => value >= 1000 ? `Le ${(value / 1000).toFixed(0)}k` : `NLe ${value.toFixed(0)}`}
                              dx={-10}
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
                              formatter={(value: number) => [`${value.toLocaleString()} SLL`, '']}
                            />
                            <Legend 
                              verticalAlign="top" 
                              align="right" 
                              iconType="circle"
                              wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                            />
                            {(historyFuelFilter === 'All' || historyFuelFilter === 'Diesel') && (
                              <Bar name="Diesel" dataKey="Diesel" fill="var(--color-surface-900)" radius={[4, 4, 0, 0]} maxBarSize={8} />
                            )}
                            {(historyFuelFilter === 'All' || historyFuelFilter === 'Kerosene') && (
                              <Bar name="Kerosene" dataKey="Kerosene" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={8} />
                            )}
                            {(historyFuelFilter === 'All' || historyFuelFilter === 'Petrol') && (
                              <Bar name="Petrol" dataKey="Petrol" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={8} />
                            )}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date / Period</th>
                            {(historyFuelFilter === 'All' || historyFuelFilter === 'Petrol') && (
                              <th scope="col" className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Petrol</th>
                            )}
                            {(historyFuelFilter === 'All' || historyFuelFilter === 'Diesel') && (
                              <th scope="col" className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diesel</th>
                            )}
                            {(historyFuelFilter === 'All' || historyFuelFilter === 'Kerosene') && (
                              <th scope="col" className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kerosene</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {sortedTableHistory.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 whitespace-nowrap text-sm font-semibold text-gray-900">{row.date}</td>
                              {(historyFuelFilter === 'All' || historyFuelFilter === 'Petrol') && (
                                <td className="p-4 whitespace-nowrap text-sm font-bold text-primary">
                                  {formatPrice(row.Petrol)}
                                  {renderTrend(row.Petrol, row.prevPetrol)}
                                </td>
                              )}
                              {(historyFuelFilter === 'All' || historyFuelFilter === 'Diesel') && (
                                <td className="p-4 whitespace-nowrap text-sm font-bold text-surface-900">
                                  {formatPrice(row.Diesel)}
                                  {renderTrend(row.Diesel, row.prevDiesel)}
                                </td>
                              )}
                              {(historyFuelFilter === 'All' || historyFuelFilter === 'Kerosene') && (
                                <td className="p-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                  {formatPrice(row.Kerosene)}
                                  {renderTrend(row.Kerosene, row.prevKerosene)}
                                </td>
                              )}
                            </tr>
                          ))}
                          {sortedTableHistory.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-sm font-medium text-gray-500">
                                No history matches the selected filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )
                  ) : (
                    <div className="flex flex-col justify-center items-center h-full text-gray-400 gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-2">
                        <History className="w-5 h-5 sm:w-6 sm:h-6 text-gray-200" />
                      </div>
                      <p className="text-sm font-bold">No price history available</p>
                      <p className="text-xs font-medium opacity-60">History will appear as prices are updated</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 p-4 sm:p-6 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-emerald-900 leading-tight">Price Alerts</p>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">Get notified when prices change here.</p>
                  </div>
                </div>
                {user && (
                  <Button
                    onClick={() => handleSubscribeStation(viewingStation)}
                    notificationMessage={isSubscribed('station', viewingStation.id) ? "Unsubscribed from station alerts" : "Subscribed to station alerts"}
                    variant="unstyled"
                    className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 ${
                      isSubscribed('station', viewingStation.id)
                        ? 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300 shadow-emerald-900/5'
                        : 'bg-primary text-white hover:bg-primary-hover shadow-emerald-500/20'
                    }`}
                  >
                    {isSubscribed('station', viewingStation.id) ? 'Unsubscribe' : 'Subscribe Now'}
                  </Button>
                )}
              </div>
              
              <div className="border-t border-gray-100 pt-6 sm:pt-8">
                <StationReviews stationId={viewingStation.id} />
              </div>

              <div className="pt-4 flex justify-center">
                <Button
                  onClick={() => setViewingStation(null)}
                  showNotification={false}
                  variant="secondary"
                  className="w-full sm:w-auto px-12 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-surface-900/20 active:scale-95"
                >
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
