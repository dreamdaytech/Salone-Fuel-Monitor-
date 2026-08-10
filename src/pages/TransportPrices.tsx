import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, db, handleFirestoreError, OperationType } from '../firebase';
import { Search, MapPin, Car, Bus, Bike, ArrowUpDown, ChevronUp, ChevronDown, LayoutGrid, List, Calendar, Clock, Banknote, TrendingUp, TrendingDown, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine } from 'recharts';

interface TransportPrice {
  id: string;
  route: string;
  vehicleType: string;
  categoryId: string;
  price: number;
  isNegotiable?: boolean;
  date: string;
  lastUpdated: any;
  updatedBy: string;
}

interface TransportCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}

interface FuelStation {
  id: string;
  name: string;
  prices: {
    Petrol?: number;
    Diesel?: number;
    Kerosene?: number;
  };
}

export default function TransportPrices() {
  const navigate = useNavigate();
  const location = useLocation();
  const [prices, setPrices] = useState<TransportPrice[]>([]);
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<TransportCategory[]>([]);
  const [globalPriceHistory, setGlobalPriceHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'analytics'>((location.state as any)?.viewMode || (window.innerWidth >= 1024 ? 'list' : 'cards'));
  const [sortField, setSortField] = useState<'route' | 'price' | 'date' | 'lastUpdated'>('route');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Advanced filter states
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const unsubscribeHistory = onSnapshot(collection(db, 'transport_price_history'), (snapshot) => {
      setGlobalPriceHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeTransport = onSnapshot(
      query(collection(db, 'transport_prices'), orderBy('route')),
      (snapshot) => {
        const priceData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TransportPrice[];
        setPrices(priceData);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'transport_prices');
      }
    );

    const unsubscribeStations = onSnapshot(
      collection(db, 'stations'),
      (snapshot) => {
        const stationData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FuelStation[];
        setStations(stationData);
      }
    );

    return () => {
      unsubscribeTransport();
      unsubscribeStations();
      unsubscribeHistory();
    };
  }, []);

  // Load categories
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'transport_categories'), orderBy('order')),
      (snapshot) => {
        setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as TransportCategory[]);
      }
    );
    return () => unsubscribe();
  }, []);

  const getPriceChange = (priceId: string, currentPrice: number) => {
    if (globalPriceHistory.length === 0) return null;
    
    const history = globalPriceHistory
      .filter(h => h.priceId === priceId)
      .sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp || 0);
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp || 0);
        return tB - tA;
      });
      
    const prev = history.find(h => h.price !== currentPrice);
    if (!prev || prev.price === 0) return null;
    
    const diff = currentPrice - prev.price;
    const pct = Math.abs((diff / prev.price) * 100);
    
    return {
      diff: Math.abs(diff),
      pct: pct.toFixed(1),
      isIncrease: diff > 0
    };
  };

  const handleSort = (field: 'route' | 'price' | 'date' | 'lastUpdated') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    setSortField('route');
    setSortDirection('asc');
  };

  const filteredPrices = prices.filter(price => {
    const matchesCategory = activeCategory === 'all' || price.categoryId === activeCategory;
    const matchesSearch = price.route.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Price Range filter
    const matchesMinPrice = minPrice === '' || price.price >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || price.price <= parseFloat(maxPrice);

    // Date Range filter
    let matchesDate = true;
    if (startDate || endDate) {
      const recordDate = price.date;
      if (recordDate) {
        if (startDate && recordDate < startDate) matchesDate = false;
        if (endDate && recordDate > endDate) matchesDate = false;
      } else {
        matchesDate = false;
      }
    }

    return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice && matchesDate;
  }).sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'route') {
      aValue = a.route.toLowerCase();
      bValue = b.route.toLowerCase();
    } else if (sortField === 'date') {
      aValue = a.date || '';
      bValue = b.date || '';
    } else if (sortField === 'lastUpdated') {
      aValue = a.lastUpdated?.toDate?.()?.getTime() || 0;
      bValue = b.lastUpdated?.toDate?.()?.getTime() || 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getVehicleIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('bus') || lowerType.includes('poda')) return <Bus className="w-5 h-5 text-primary" />;
    if (lowerType.includes('bike') || lowerType.includes('okada')) return <Bike className="w-5 h-5 text-emerald-600" />;
    return <Car className="w-5 h-5 text-surface-900" />;
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
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2 tracking-tight">Transport Fare List</h1>
          <p className="text-gray-500 font-medium">Official transport fares across different routes and vehicle types</p>
        </div>

        <div className="flex items-center bg-gray-100/50 p-1 rounded-xl self-start md:self-auto">
          <Button
            onClick={() => setViewMode('cards')}
            variant="unstyled"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'cards'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            showNotification={false}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant="unstyled"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            showNotification={false}
          >
            <List className="w-4 h-4" />
            List
          </Button>
          <Button
            onClick={() => navigate('/transport-trends')}
            variant="unstyled"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700"
            showNotification={false}
          >
            <TrendingUp className="w-4 h-4" />
            Transport Trends
          </Button>
        </div>
      </div>



      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by route (e.g., Lumley to PZ)..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:w-[600px]">
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors pointer-events-none" />
              <select
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold text-surface-900 appearance-none cursor-pointer"
                value={activeCategory}
                onChange={(e) => {
                  setActiveCategory(e.target.value);
                  setSearchTerm('');
                }}
              >
                <option value="all">All Categories ({new Set(prices.map(p => p.route)).size})</option>
                {categories.map(cat => {
                  const count = new Set(prices.filter(p => p.categoryId === cat.id).map(p => p.route)).size;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="relative group">
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors pointer-events-none" />
              <select
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold text-surface-900 appearance-none cursor-pointer"
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-') as [any, any];
                  setSortField(field);
                  setSortDirection(direction);
                }}
              >
                <option value="route-asc">Route (A-Z)</option>
                <option value="route-desc">Route (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant="secondary"
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${showAdvanced ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
                showNotification={false}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>

              {(searchTerm || minPrice || maxPrice || startDate || endDate) && (
                <Button
                  onClick={handleResetFilters}
                  variant="ghost"
                  className="px-3 rounded-xl border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
                  showNotification={false}
                  title="Reset Filters"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-200">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min Price (SLL)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Max Price (SLL)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From Date</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium text-gray-600"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium text-gray-600"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results View */}
      {viewMode === 'analytics' ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-1">Fuel vs Transport Fare Analysis</h2>
              <p className="text-sm text-gray-500 font-medium">Comparing average transport fares by vehicle type against the current average fuel price.</p>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-gray-600">Transport Fare</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-600">Average Fuel Price</span>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            {prices.length > 0 ? (() => {
              // Calculate average transport fares by vehicle type
              const vehicleTypesSet = Array.from(new Set(prices.map(p => p.vehicleType)));
              const chartData = vehicleTypesSet.map(vt => {
                const vtPrices = prices.filter(p => p.vehicleType === vt);
                const avgPrice = vtPrices.length > 0 
                  ? Math.round(vtPrices.reduce((sum, p) => sum + p.price, 0) / vtPrices.length) 
                  : 0;
                
                return {
                  name: vt,
                  'Avg Transport Fare': avgPrice
                };
              });

              // Calculate average fuel price across all stations
              let totalFuelPrice = 0;
              let fuelPriceCount = 0;
              stations.forEach(s => {
                if (s.prices.Petrol) { totalFuelPrice += s.prices.Petrol; fuelPriceCount++; }
                if (s.prices.Diesel) { totalFuelPrice += s.prices.Diesel; fuelPriceCount++; }
              });
              const avgFuelPrice = fuelPriceCount > 0 ? Math.round(totalFuelPrice / fuelPriceCount) : 30000;

              return (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} dx={-10} tickFormatter={(value) => `Le ${value.toLocaleString()}`} />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                      formatter={(value: number) => [`Le ${value.toLocaleString()}`, 'Price']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Avg Transport Fare" fill="#0EA5E9" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    <ReferenceLine y={avgFuelPrice} stroke="#10B981" strokeDasharray="3 3" label={{ position: 'top', value: `Avg Fuel: Le ${avgFuelPrice.toLocaleString()}`, fill: '#10B981', fontSize: 12, fontWeight: 'bold' }} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })() : (
              <div className="flex h-full items-center justify-center text-gray-400 font-bold">Not enough data to display</div>
            )}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-surface-50">
                <tr>
                  <th 
                    className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort('route')}
                  >
                    <div className="flex items-center gap-2">
                      Route
                      {sortField === 'route' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Vehicle Type
                  </th>
                  <th 
                    className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-2">
                      Price (SLL)
                      {sortField === 'price' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredPrices.length > 0 ? (
                  filteredPrices.map(price => (
                    <tr 
                      key={price.id} 
                      className="hover:bg-surface-50/50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/transport-prices/${price.id}`)}
                    >
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-surface-900">{price.route}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                            {getVehicleIcon(price.vehicleType)}
                          </div>
                          <span className="text-sm font-medium text-gray-600">{price.vehicleType}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        {price.isNegotiable ? (
                          <span className="text-base font-bold text-emerald-600">Negotiable</span>
                        ) : (
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-bold text-surface-900">
                                {price.price.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SLL</span>
                            </div>
                            {(() => {
                              const change = getPriceChange(price.id, price.price);
                              if (!change) return null;
                              return (
                                <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${change.isIncrease ? 'text-red-500' : 'text-emerald-500'}`}>
                                  {change.isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  <span>{change.isIncrease ? '+' : '-'}{change.pct}%</span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                        {price.date || 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-2">
                          <Search className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-surface-900 font-bold">No transport fares found</p>
                        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrices.length > 0 ? (
            filteredPrices.map(price => (
              <div 
                key={price.id} 
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer"
                onClick={() => navigate(`/transport-prices/${price.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                    {getVehicleIcon(price.vehicleType)}
                    <span className="text-xs font-bold text-gray-600">{price.vehicleType}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-surface-900 mb-4 line-clamp-2 min-h-[3.5rem]">{price.route}</h3>

                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Banknote className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Price</span>
                    </div>
                    {price.isNegotiable ? (
                      <span className="text-lg font-bold text-emerald-600">Negotiable</span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-surface-900">{price.price.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SLL</span>
                        </div>
                        {(() => {
                          const change = getPriceChange(price.id, price.price);
                          if (!change) return null;
                          return (
                            <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${change.isIncrease ? 'text-red-500' : 'text-emerald-500'}`}>
                              {change.isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              <span>{change.isIncrease ? '+' : '-'}{change.pct}%</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                    </div>
                    <span className="text-sm font-bold text-gray-600">{price.date || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-2xl p-16 shadow-sm border border-gray-100 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-2">
                  <Search className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-surface-900 font-bold">No transport fares found</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
