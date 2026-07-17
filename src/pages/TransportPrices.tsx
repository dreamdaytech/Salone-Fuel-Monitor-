import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, db, handleFirestoreError, OperationType } from '../firebase';
import { Search, MapPin, Car, Bus, Bike, ArrowUpDown, ChevronUp, ChevronDown, LayoutGrid, List, Calendar, Clock, Banknote } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface TransportPrice {
  id: string;
  route: string;
  vehicleType: string;
  price: number;
  date: string;
  lastUpdated: any;
  updatedBy: string;
}

export default function TransportPrices() {
  const [prices, setPrices] = useState<TransportPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [sortField, setSortField] = useState<'route' | 'price' | 'date' | 'lastUpdated'>('route');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const unsubscribe = onSnapshot(
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

    return () => unsubscribe();
  }, []);

  const vehicleTypes = ['All', ...Array.from(new Set(prices.map(p => p.vehicleType)))].sort();

  const handleSort = (field: 'route' | 'price' | 'date' | 'lastUpdated') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredPrices = prices.filter(price => {
    const matchesSearch = price.route.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicleType = selectedVehicleType === 'All' || price.vehicleType === selectedVehicleType;
    return matchesSearch && matchesVehicleType;
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
          <h1 className="text-3xl font-bold text-surface-900 mb-2 tracking-tight">Transport Price List</h1>
          <p className="text-gray-500 font-medium">Official transport prices across different routes and vehicle types</p>
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
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by route (e.g., Lumley to PZ)..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative group">
            <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
            <select
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold text-surface-900 appearance-none cursor-pointer"
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
            >
              {vehicleTypes.map(v => <option key={v} value={v}>{v === 'All' ? 'All Vehicle Types' : v}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results View */}
      {viewMode === 'list' ? (
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
                  <th 
                    className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort('lastUpdated')}
                  >
                    <div className="flex items-center gap-2">
                      Last Updated
                      {sortField === 'lastUpdated' ? (
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
                    <tr key={price.id} className="hover:bg-surface-50/50 transition-colors group">
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
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-surface-900">
                            {price.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SLL</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                        {price.date || 'N/A'}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                        {price.lastUpdated?.toDate?.()?.toLocaleDateString() || 'N/A'}
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
                        <p className="text-surface-900 font-bold">No transport prices found</p>
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
              <div key={price.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
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
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-surface-900">{price.price.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SLL</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                    </div>
                    <span className="text-sm font-bold text-gray-600">{price.date || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Updated</span>
                    </div>
                    <span className="text-sm font-bold text-gray-600">
                      {price.lastUpdated?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </span>
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
                <p className="text-surface-900 font-bold">No transport prices found</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
