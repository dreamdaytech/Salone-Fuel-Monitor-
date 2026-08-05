import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, handleFirestoreError, OperationType, getDocs, orderBy, limit } from '../firebase';
import { Plus, Edit2, Save, X, Building2, MapPin, Clock, Phone, Tag, ShieldCheck, Zap, ShieldAlert, Check, TrendingDown, Calendar, Percent, Trash2, Navigation, Loader2, Search, Filter, ArrowUpDown } from 'lucide-react';
import { NotificationService } from '../services/NotificationService';
import { SIERRA_LEONE_DISTRICTS } from '../lib/constants';
import { Button } from '../components/ui/Button';

interface Station {
  id: string;
  name: string;
  district: string;
  location: string;
  brand: string;
  contact: string;
  operatingHours: string | string[];
  fuelTypes: string[];
  prices: Record<string, number>;
  isVerified: boolean;
  latitude?: number;
  longitude?: number;
  isSuspended?: boolean;
  isPublished?: boolean;
  status: 'pending' | 'approved' | 'disapproved';
  isOutOfStock?: boolean;
  lastUpdated?: any;
}

function SearchableDropdown({ options, value, onChange, icon: Icon, placeholder, allowAll = true }: { options: string[], value: string, onChange: (val: string) => void, icon: any, placeholder: string, allowAll?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative min-w-[200px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between pl-9 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 text-sm font-medium transition-all"
      >
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <span className="truncate">{(allowAll && value === 'All') ? placeholder : (value || placeholder)}</span>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-gray-50 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              autoFocus
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm font-medium"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {allowAll && (
              <button
                onClick={() => { onChange('All'); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${value === 'All' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-surface-900'}`}
              >
                {placeholder}
              </button>
            )}
            {filteredOptions.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${value === opt ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-surface-900'}`}
              >
                {opt}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  createdAt: any;
  updatedAt?: any;
  ownerId: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function OperatingHoursEditor({ value, onChange }: { value: string | string[], onChange: (val: string[]) => void }) {
  const hoursArray = Array.isArray(value) ? value : [value || ''];
  const is24Hours = hoursArray.length === 1 && hoursArray[0] === '24 Hours';
  
  // Check if we are using the new structured format or legacy format
  const isStructured = hoursArray.every(h => h === '24 Hours' || h === '' || DAYS_OF_WEEK.some(day => h.startsWith(day + ':')));

  const [schedule, setSchedule] = useState<Record<string, { enabled: boolean, open: string, close: string }>>(() => {
    const defaultSchedule = DAYS_OF_WEEK.reduce((acc, day) => ({
      ...acc,
      [day]: { enabled: false, open: '08:00', close: '18:00' }
    }), {} as Record<string, { enabled: boolean, open: string, close: string }>);

    if (!is24Hours && isStructured) {
      hoursArray.forEach(item => {
        const [dayPart, timePart] = item.split(': ');
        if (dayPart && timePart && DAYS_OF_WEEK.includes(dayPart)) {
          const [open, close] = timePart.split(' - ');
          if (open && close) {
            defaultSchedule[dayPart] = { enabled: true, open, close };
          }
        }
      });
    }
    return defaultSchedule;
  });

  const handle24HoursToggle = (checked: boolean) => {
    if (checked) {
      onChange(['24 Hours']);
    } else {
      updateParentSchedule(schedule);
    }
  };

  const updateParentSchedule = (newSchedule: Record<string, { enabled: boolean, open: string, close: string }>) => {
    const newHours = DAYS_OF_WEEK
      .filter(day => newSchedule[day].enabled)
      .map(day => `${day}: ${newSchedule[day].open} - ${newSchedule[day].close}`);
    onChange(newHours.length > 0 ? newHours : ['']);
  };

  const handleDayToggle = (day: string, enabled: boolean) => {
    const newSchedule = { ...schedule, [day]: { ...schedule[day], enabled } };
    setSchedule(newSchedule);
    updateParentSchedule(newSchedule);
  };

  const handleTimeChange = (day: string, field: 'open' | 'close', time: string) => {
    const newSchedule = { ...schedule, [day]: { ...schedule[day], [field]: time } };
    setSchedule(newSchedule);
    updateParentSchedule(newSchedule);
  };

  if (!isStructured && !is24Hours && hoursArray[0] !== '') {
     // Legacy fallback UI
     return (
       <div className="space-y-2">
         <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl mb-2">
           Using legacy time format. Switch to 24 Hours to reset.
         </div>
         <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input 
            type="checkbox" 
            checked={false} 
            onChange={(e) => handle24HoursToggle(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
          />
          <span className="text-sm font-medium text-surface-900">Open 24 Hours</span>
        </label>
         {hoursArray.map((hour, index) => (
            <div key={index} className="flex gap-2">
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                  value={hour}
                  onChange={e => {
                    const newHours = [...hoursArray];
                    newHours[index] = e.target.value;
                    onChange(newHours);
                  }}
                />
              </div>
            </div>
         ))}
       </div>
     );
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={is24Hours} 
          onChange={(e) => handle24HoursToggle(e.target.checked)}
          className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
        />
        <span className="text-sm font-medium text-surface-900">Open 24 Hours</span>
      </label>

      {!is24Hours && (
        <div className="space-y-2 border border-gray-100 rounded-xl p-4 bg-gray-50">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer w-28">
                <input 
                  type="checkbox" 
                  checked={schedule[day].enabled}
                  onChange={(e) => handleDayToggle(day, e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-sm font-medium text-surface-900">{day.substring(0, 3)}</span>
              </label>
              
              <div className={`flex items-center gap-2 flex-1 ${schedule[day].enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <input 
                  type="time" 
                  value={schedule[day].open}
                  onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                  className="px-2 py-1 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input 
                  type="time" 
                  value={schedule[day].close}
                  onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                  className="px-2 py-1 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StationDashboard() {
  const { user, profile } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [globalBrands, setGlobalBrands] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [govPrices, setGovPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [quickEditStationId, setQuickEditStationId] = useState<string | null>(null);
  const [quickEditPrices, setQuickEditPrices] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState<Partial<Station>>({
    name: '', district: '', location: '', brand: '', contact: '', operatingHours: [''],
    fuelTypes: ['Petrol', 'Diesel'], prices: { Petrol: 0, Diesel: 0 }, isVerified: false,
    latitude: 8.481, longitude: -13.248, isPublished: true, isOutOfStock: false
  });
  const [promoFormData, setPromoFormData] = useState<Partial<Promotion>>({
    stationIds: [], fuelTypes: ['Petrol'], discountAmount: 0, discountType: 'fixed',
    startTime: '', endTime: '', description: '', isActive: true
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [sortBy, setSortBy] = useState<'updated' | 'name_asc' | 'name_desc'>('updated');

  const filteredAndSortedStations = useMemo(() => {
    let result = [...stations];
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.location.toLowerCase().includes(term) ||
        s.brand?.toLowerCase().includes(term)
      );
    }
    
    // Filters
    if (selectedDistrict !== 'All') {
      result = result.filter(s => s.district === selectedDistrict);
    }
    if (selectedBrand !== 'All') {
      result = result.filter(s => s.brand === selectedBrand);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'updated':
        default:
          const dateA = a.lastUpdated?.toDate?.()?.getTime() || 0;
          const dateB = b.lastUpdated?.toDate?.()?.getTime() || 0;
          return dateB - dateA;
      }
    });
    
    return result;
  }, [stations, searchTerm, selectedDistrict, selectedBrand, sortBy]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'brands'), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalBrands(docSnap.data().list || []);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'stations'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Station[];
      setStations(stationData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'stations');
    });

    const unsubGov = onSnapshot(query(collection(db, 'price_trends'), orderBy('effectiveDate', 'desc'), limit(1)), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setGovPrices({
          Petrol: data.petrolPrice || 0,
          Diesel: data.dieselPrice || 0,
          Kerosene: data.kerosenePrice || 0
        });
      }
    });

    const promoQ = query(collection(db, 'promotions'), where('ownerId', '==', user.uid));
    const unsubPromos = onSnapshot(promoQ, (snapshot) => {
      const promoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[];
      setPromotions(promoData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'promotions');
    });

    return () => {
      unsubscribe();
      unsubGov();
      unsubPromos();
    };
  }, [user, stations.length]);

  const notifyPriceChange = async (stationId: string, stationName: string, district: string, changedFuels: string[], currentPrices: Record<string, number>) => {
    // Fetch all stations in the district to calculate averages
    const districtStationsQ = query(collection(db, 'stations'), where('district', '==', district));
    const districtSnapshot = await getDocs(districtStationsQ);
    const allStationsInDistrict = districtSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    await NotificationService.notifyStationPriceUpdate(stationId, stationName, district, changedFuels, currentPrices, allStationsInDistrict);
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Check if station is suspended (if editing)
    if (editingStation?.isSuspended) {
      alert('This station is currently suspended by the administrator. You cannot update details until the suspension is lifted.');
      return;
    }
    
    // Validate against government prices
    const newPrices = formData.prices || {};
    const violations: string[] = [];
    for (const fuel of formData.fuelTypes || []) {
      if (govPrices[fuel] && newPrices[fuel] > govPrices[fuel]) {
        violations.push(`${fuel} (Max: ${govPrices[fuel].toLocaleString()})`);
      }
    }

    if (violations.length > 0) {
      alert(`Illegal Price Alert: The following prices exceed the government-mandated maximum:\n\n${violations.join('\n')}\n\nPlease adjust your prices to comply with Sierra Leone law.`);
      return;
    }

    try {
      if (isCreating) {
        const docRef = await addDoc(collection(db, 'stations'), {
          ...formData,
          ownerId: user.uid,
          status: 'pending',
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
        
        // Add initial price history
        for (const fuelType of formData.fuelTypes || []) {
          if (formData.prices?.[fuelType]) {
            await addDoc(collection(db, 'price_history'), {
              stationId: docRef.id,
              fuelType,
              price: formData.prices[fuelType],
              timestamp: serverTimestamp()
            });
          }
        }
        
        setIsCreating(false);
      } else if (editingStation) {
        const stationRef = doc(db, 'stations', editingStation.id);
        
        // Log price changes
        const oldPrices = editingStation.prices;
        const newPrices = formData.prices || {};
        
        let priceChanged = false;
        const changedFuels: string[] = [];

        for (const fuelType of formData.fuelTypes || []) {
          if (oldPrices[fuelType] !== newPrices[fuelType]) {
            priceChanged = true;
            changedFuels.push(fuelType);
            await addDoc(collection(db, 'price_history'), {
              stationId: editingStation.id,
              fuelType,
              price: newPrices[fuelType],
              timestamp: serverTimestamp()
            });
          }
        }

        if (priceChanged) {
          const updatedName = formData.name || editingStation.name;
          const updatedDistrict = formData.district || editingStation.district;
          await notifyPriceChange(editingStation.id, updatedName, updatedDistrict, changedFuels, newPrices);
        }

        const updateData = { ...formData };
        delete updateData.id;

        await updateDoc(stationRef, {
          ...updateData,
          lastUpdated: serverTimestamp()
        });
        setEditingStation(null);
      }
      setFormData({
        name: '', district: '', location: '', brand: '', contact: '', operatingHours: [''],
        fuelTypes: ['Petrol', 'Diesel'], prices: { Petrol: 0, Diesel: 0 }, isVerified: false,
        latitude: 8.481, longitude: -13.248, isPublished: true, isOutOfStock: false
      });
    } catch (error) {
      handleFirestoreError(error, isCreating ? OperationType.CREATE : OperationType.UPDATE, 'stations');
    }
  };

  const startEdit = (station: Station) => {
    setEditingStation(station);
    setFormData({
      ...station,
      operatingHours: Array.isArray(station.operatingHours) 
        ? station.operatingHours 
        : station.operatingHours ? [station.operatingHours] : ['']
    });
    setIsCreating(false);
    setQuickEditStationId(null);
  };

  const handleDeleteStation = async (stationId: string, stationName: string) => {
    if (window.confirm(`Are you sure you want to delete ${stationName}? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'stations', stationId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'stations');
      }
    }
  };

  const cancelEdit = () => {
    setEditingStation(null);
    setIsCreating(false);
    setQuickEditStationId(null);
    setFormData({
      name: '', district: '', location: '', brand: '', contact: '', operatingHours: [''],
      fuelTypes: ['Petrol', 'Diesel'], prices: { Petrol: 0, Diesel: 0 }, isVerified: false,
      latitude: 8.481, longitude: -13.248, isPublished: true, isOutOfStock: false
    });
  };

  const handleSavePromo = async () => {
    if (!user) return;
    
    // Client-side validation
    if (!promoFormData.stationIds || promoFormData.stationIds.length === 0) {
      alert("Please select at least one station.");
      return;
    }
    if (!promoFormData.fuelTypes || promoFormData.fuelTypes.length === 0) {
      alert("Please select at least one fuel type.");
      return;
    }
    if (!promoFormData.discountAmount || promoFormData.discountAmount <= 0) {
      alert("Please enter a valid discount amount greater than 0.");
      return;
    }
    if (!promoFormData.startTime || !promoFormData.endTime) {
      alert("Please select both start and end times.");
      return;
    }

    try {
      // Remove id from data to avoid firestore rules error (hasOnlyAllowedFields)
      const { id, ...rest } = promoFormData;
      
      const data = {
        ...rest,
        ownerId: editingPromo ? editingPromo.ownerId : user.uid,
        createdAt: editingPromo ? editingPromo.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (editingPromo) {
        await updateDoc(doc(db, 'promotions', editingPromo.id), data);
      } else {
        await addDoc(collection(db, 'promotions'), data);
      }
      setIsCreatingPromo(false);
      setEditingPromo(null);
      setPromoFormData({
        stationIds: [], fuelTypes: ['Petrol'], discountAmount: 0, discountType: 'fixed',
        startTime: '', endTime: '', description: '', isActive: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'promotions');
    }
  };

  const startEditPromo = (promo: Promotion) => {
    setEditingPromo(promo);
    setPromoFormData({
      ...promo,
      startTime: typeof promo.startTime === 'string' ? promo.startTime : promo.startTime?.toDate?.()?.toISOString()?.slice(0, 16) || '',
      endTime: typeof promo.endTime === 'string' ? promo.endTime : promo.endTime?.toDate?.()?.toISOString()?.slice(0, 16) || '',
    });
    setIsCreatingPromo(true);
  };

  const handleDeletePromo = async (promoId: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await updateDoc(doc(db, 'promotions', promoId), { isActive: false });
      // Or actually delete it: await deleteDoc(doc(db, 'promotions', promoId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'promotions');
    }
  };

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        alert('Failed to get location: ' + error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const startQuickEdit = (station: Station) => {
    setQuickEditStationId(station.id);
    setQuickEditPrices({ ...station.prices });
  };

  const cancelQuickEdit = () => {
    setQuickEditStationId(null);
    setQuickEditPrices({});
  };

  const handleQuickUpdate = async (station: Station) => {
    if (!user) return;
    
    if (station.isSuspended) {
      alert('This station is currently suspended by the administrator. You cannot update prices until the suspension is lifted.');
      return;
    }
    
    // Validate against government prices
    const violations: string[] = [];
    for (const fuel of station.fuelTypes || []) {
      if (govPrices[fuel] && quickEditPrices[fuel] > govPrices[fuel]) {
        violations.push(`${fuel} (Max: ${govPrices[fuel].toLocaleString()})`);
      }
    }

    if (violations.length > 0) {
      alert(`Illegal Price Alert: The following prices exceed the government-mandated maximum:\n\n${violations.join('\n')}\n\nPlease adjust your prices to comply with Sierra Leone law.`);
      return;
    }

    try {
      const stationRef = doc(db, 'stations', station.id);
      
      let priceChanged = false;
      const changedFuels: string[] = [];

      for (const fuelType of station.fuelTypes || []) {
        if (station.prices[fuelType] !== quickEditPrices[fuelType]) {
          priceChanged = true;
          changedFuels.push(fuelType);
          await addDoc(collection(db, 'price_history'), {
            stationId: station.id,
            fuelType,
            price: quickEditPrices[fuelType],
            timestamp: serverTimestamp()
          });
        }
      }

      if (priceChanged) {
        await notifyPriceChange(station.id, station.name, station.district, changedFuels, quickEditPrices);
        
        await updateDoc(stationRef, {
          prices: quickEditPrices,
          lastUpdated: serverTimestamp()
        });
      }
      
      setQuickEditStationId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'stations');
    }
  };

  if (loading) return <div className="p-8 text-center text-primary font-medium">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">My Stations</h1>
          <p className="text-gray-600">Manage your fuel stations and update prices</p>
        </div>
        {!isCreating && !editingStation && (
          <Button
            onClick={() => setIsCreating(true)}
            showNotification={false}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" />
            Add Station
          </Button>
        )}
      </div>

      {(isCreating || editingStation) && (
        <div className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={cancelEdit}>
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-20">
              <h2 className="text-lg sm:text-xl font-bold text-surface-900 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                {isCreating ? 'Add New Station' : 'Edit Station'}
              </h2>
              <Button
                variant="unstyled"
                onClick={cancelEdit}
                showNotification={false}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-100/80 hover:bg-gray-100 text-gray-500 hover:text-surface-900 rounded-lg sm:rounded-xl transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
            
            <div className="p-4 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Station Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. TotalEnergies Central"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Brand</label>
                  <div className="relative">
                    <SearchableDropdown
                      options={Array.from(new Set([...globalBrands, ...stations.map(s => s.brand)])).filter(Boolean).sort()}
                      value={formData.brand}
                      onChange={(val) => setFormData({...formData, brand: val})}
                      icon={Building2}
                      placeholder="Select Brand"
                      allowAll={false}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">District</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <select
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all appearance-none"
                      value={formData.district}
                      onChange={e => setFormData({...formData, district: e.target.value})}
                    >
                      <option value="" disabled>Select a district</option>
                      {SIERRA_LEONE_DISTRICTS.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Location/Area</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Siaka Stevens Street"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                      placeholder="e.g. +232 77 000 000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Operating Hours</label>
                  <OperatingHoursEditor 
                    value={formData.operatingHours || ['']} 
                    onChange={val => setFormData({...formData, operatingHours: val})} 
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">GPS Coordinates</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isGettingLocation}
                      className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isGettingLocation ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5" />
                      )}
                      {isGettingLocation ? 'Locating...' : 'Use Current Location'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                        value={formData.latitude || ''}
                        onChange={e => setFormData({...formData, latitude: Number(e.target.value)})}
                        placeholder="e.g. 8.481"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                        value={formData.longitude || ''}
                        onChange={e => setFormData({...formData, longitude: Number(e.target.value)})}
                        placeholder="e.g. -13.248"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 sm:pt-8 mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between bg-surface-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-surface-950 uppercase tracking-widest mb-1">Publish Station</h3>
                    <p className="text-[11px] text-gray-500">Make visible to public</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.isPublished !== false}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between bg-surface-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-surface-950 uppercase tracking-widest mb-1 text-red-600">Out of Stock</h3>
                    <p className="text-[11px] text-gray-500">Mark all fuel out of stock</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.isOutOfStock === true}
                      onChange={(e) => setFormData({ ...formData, isOutOfStock: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 sm:pt-8 mb-6 sm:mb-8">
                <h3 className="text-sm sm:text-base font-bold text-surface-900 uppercase tracking-widest mb-4 sm:mb-6">Fuel Prices (SLL per Liter)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {['Petrol', 'Diesel', 'Kerosene'].map(fuel => (
                    <div key={fuel} className="bg-surface-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                      <label className="flex items-center gap-3 text-xs font-bold text-surface-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.fuelTypes?.includes(fuel)}
                          onChange={(e) => {
                            const types = formData.fuelTypes || [];
                            if (e.target.checked) {
                              setFormData({...formData, fuelTypes: [...types, fuel]});
                            } else {
                              setFormData({...formData, fuelTypes: types.filter(t => t !== fuel)});
                            }
                          }}
                          className="w-5 h-5 rounded-lg text-primary focus:ring-primary border-gray-300 transition-all"
                        />
                        {fuel}
                      </label>
                      {formData.fuelTypes?.includes(fuel) && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="relative">
                            <input
                              type="number"
                              className={`w-full px-4 py-2.5 bg-white border-2 rounded-xl focus:ring-2 outline-none transition-all font-bold text-surface-900 ${
                                govPrices[fuel] && (formData.prices?.[fuel] || 0) > govPrices[fuel]
                                  ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                  : 'border-gray-100 focus:ring-primary/20 focus:border-primary'
                              }`}
                              value={formData.prices?.[fuel] || ''}
                              onChange={e => setFormData({
                                ...formData,
                                prices: { ...formData.prices, [fuel]: Number(e.target.value) }
                              })}
                              placeholder="0"
                            />
                          </div>
                          {govPrices[fuel] && (
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                              (formData.prices?.[fuel] || 0) > govPrices[fuel] ? 'text-red-500' : 'text-gray-400'
                            }`}>
                              <ShieldAlert className="w-3 h-3" />
                              Limit: {govPrices[fuel].toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={cancelEdit}
                  showNotification={false}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-bold text-sm active:scale-95"
                >
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  notificationMessage="Saving station details..."
                  className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  <Save className="w-4 h-4" /> Save Station
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search & Filters */}
      {!isCreating && !editingStation && stations.length > 0 && (
        <div className="mb-8 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 relative z-20">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium"
                placeholder="Search by station name, location, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4 pb-2 sm:pb-0">
              <SearchableDropdown
                options={SIERRA_LEONE_DISTRICTS}
                value={selectedDistrict}
                onChange={setSelectedDistrict}
                icon={Filter}
                placeholder="All Districts"
              />
              <SearchableDropdown
                options={Array.from(new Set([...globalBrands, ...stations.map(s => s.brand)])).filter(Boolean).sort()}
                value={selectedBrand}
                onChange={setSelectedBrand}
                icon={Building2}
                placeholder="All Brands"
              />
              <div className="relative min-w-[160px]">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  className="w-full pl-9 pr-8 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 text-sm font-medium appearance-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="updated">Recently Updated</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedStations.map(station => (
          <div key={station.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all group ${station.isSuspended ? 'border-rose-200' : 'border-gray-100'}`}>
            {station.isSuspended && (
              <div className="bg-rose-50 border-b border-rose-100 p-3 flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Station Suspended by Admin</p>
              </div>
            )}
            <div className={`p-6 ${station.isSuspended ? 'opacity-75' : ''}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2 group-hover:text-primary transition-colors">
                    {station.name}
                    {station.status === 'approved' && station.isVerified && (
                      <span title="Verified Station" className="flex items-center">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {station.isPublished === false && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Unpublished
                      </div>
                    )}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      (station.status === 'approved' || !station.status)
                        ? station.isVerified ? 'bg-emerald-50 text-primary' : 'bg-amber-50 text-amber-700'
                        : station.status === 'pending' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        (station.status === 'approved' || !station.status)
                          ? station.isVerified ? 'bg-primary' : 'bg-amber-500 animate-pulse'
                          : station.status === 'pending' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`} />
                      {(station.status === 'approved' || !station.status)
                        ? (station.isVerified ? 'Verified' : 'Pending Verification')
                        : station.status === 'pending' ? 'Pending Review' : 'Disapproved'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {station.location}, {station.district}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => startEdit(station)}
                    showNotification={false}
                    className="w-8 h-8 rounded-full p-0 flex items-center justify-center transition-all"
                    title="Edit Station Details"
                  >
                    <Edit2 className="w-4 h-4 text-white" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteStation(station.id, station.name)}
                    showNotification={false}
                    variant="danger"
                    className="w-8 h-8 rounded-full p-0 flex items-center justify-center transition-all bg-rose-500 text-white hover:bg-rose-600 border-none shadow-md shadow-rose-500/20"
                    title="Delete Station"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {(station.fuelTypes || []).map(fuel => (
                  <div key={fuel} className="flex justify-between items-center p-3 bg-surface-50 rounded-xl border border-gray-50">
                    <span className="text-sm font-bold text-gray-600">{fuel}</span>
                    {quickEditStationId === station.id ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className={`w-24 px-2 py-1 text-right border rounded focus:ring-2 outline-none font-bold text-surface-900 ${
                              govPrices[fuel] && (quickEditPrices[fuel] || 0) > govPrices[fuel]
                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                            }`}
                            value={quickEditPrices[fuel] || ''}
                            onChange={e => setQuickEditPrices({
                              ...quickEditPrices,
                              [fuel]: Number(e.target.value)
                            })}
                          />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SLL</span>
                        </div>
                        {govPrices[fuel] && (
                          <div className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            (quickEditPrices[fuel] || 0) > govPrices[fuel] ? 'text-red-500' : 'text-gray-400'
                          }`}>
                            <ShieldAlert className="w-2.5 h-2.5" />
                            Limit: {govPrices[fuel].toLocaleString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-surface-900">
                        {(station.prices || {})[fuel]?.toLocaleString()} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SLL</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                {quickEditStationId === station.id ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={cancelQuickEdit}
                      showNotification={false}
                      className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleQuickUpdate(station)}
                      notificationMessage="Updating fuel prices..."
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-100"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Prices
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => startQuickEdit(station)}
                    showNotification={false}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-100"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Quick Update Prices
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

      {stations.length > 0 && filteredAndSortedStations.length === 0 && (
        <div className="col-span-full text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100">
          <p className="text-gray-500 font-medium">No stations match your current search or filter criteria.</p>
          <Button
            variant="unstyled"
            onClick={() => {
              setSearchTerm('');
              setSelectedDistrict('All');
              setSelectedBrand('All');
            }}
            showNotification={false}
            className="mt-4 px-4 py-2 text-primary hover:bg-emerald-50 rounded-lg transition-colors text-sm font-bold"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {stations.length === 0 && !isCreating && (
        <div className="col-span-full text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-surface-900">No stations registered</h3>
            <p className="text-gray-500 mt-1 mb-6">Add your first fuel station to start managing prices.</p>
            <Button
              onClick={() => setIsCreating(true)}
              showNotification={false}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-bold shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-5 h-5" />
              Add Station
            </Button>
          </div>
        )}
      </div>

      {/* Promotions Section */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              Active Promotions & Discounts
            </h2>
            <p className="text-gray-500 mt-1">Manage special offers and discounts for your stations.</p>
          </div>
          {stations.length > 0 && (
            <Button
              onClick={() => {
                setPromoFormData({
                  stationIds: stations.length > 0 ? [stations[0].id] : [],
                  fuelTypes: ['Petrol'],
                  discountAmount: 0,
                  discountType: 'fixed',
                  startTime: new Date().toISOString().slice(0, 16),
                  endTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                  description: '',
                  isActive: true
                });
                setIsCreatingPromo(true);
              }}
              showNotification={false}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-bold shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-5 h-5" />
              Add Promotion
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.filter(p => p.isActive).map(promo => {
            const promoStations = stations.filter(s => promo.stationIds?.includes(s.id));
            return (
              <div key={promo.id} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-md transition-all p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-surface-900">{promo.fuelTypes?.join(', ')} Discount</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {promoStations.length > 0 
                          ? promoStations.map(s => s.name).join(', ') 
                          : 'No stations selected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => startEditPromo(promo)}
                      showNotification={false}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => handleDeletePromo(promo.id)}
                      showNotification={false}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 mb-4 text-center">
                  <div className="text-2xl font-black text-amber-600">
                    {promo.discountType === 'fixed' ? '-' : ''}
                    {promo.discountAmount.toLocaleString()}
                    {promo.discountType === 'percentage' ? '%' : ' SLL'} OFF
                  </div>
                  <p className="text-xs text-amber-700 font-medium mt-1">{promo.description || 'Limited time offer!'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Starts: {new Date(promo.startTime?.seconds ? promo.startTime.seconds * 1000 : promo.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Ends: {new Date(promo.endTime?.seconds ? promo.endTime.seconds * 1000 : promo.endTime).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {promotions.filter(p => p.isActive).length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Tag className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No active promotions. Boost your sales by adding a discount!</p>
            </div>
          )}
        </div>
      </div>

      {/* Promotion Modal */}
      {isCreatingPromo && (
        <div className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setIsCreatingPromo(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-20">
              <h2 className="text-xl font-bold text-surface-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Percent className="w-6 h-6" />
                </div>
                {editingPromo ? 'Edit Promotion' : 'Add New Promotion'}
              </h2>
              <Button
                variant="unstyled"
                onClick={() => setIsCreatingPromo(false)}
                showNotification={false}
                className="w-10 h-10 flex items-center justify-center bg-gray-100/80 hover:bg-gray-100 text-gray-500 hover:text-surface-900 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select Stations</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {stations.map(s => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={promoFormData.stationIds?.includes(s.id)}
                          onChange={(e) => {
                            const ids = promoFormData.stationIds || [];
                            if (e.target.checked) {
                              setPromoFormData({...promoFormData, stationIds: [...ids, s.id]});
                            } else {
                              setPromoFormData({...promoFormData, stationIds: ids.filter(id => id !== s.id)});
                            }
                          }}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-gray-300 transition-all"
                        />
                        <span className="text-sm font-medium text-surface-900 group-hover:text-amber-600 transition-colors truncate">{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fuel Types</label>
                  <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {['Petrol', 'Diesel', 'Kerosene'].map(fuel => (
                      <label key={fuel} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={promoFormData.fuelTypes?.includes(fuel)}
                          onChange={(e) => {
                            const types = promoFormData.fuelTypes || [];
                            if (e.target.checked) {
                              setPromoFormData({...promoFormData, fuelTypes: [...types, fuel]});
                            } else {
                              setPromoFormData({...promoFormData, fuelTypes: types.filter(t => t !== fuel)});
                            }
                          }}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-gray-300 transition-all"
                        />
                        <span className="text-sm font-medium text-surface-900 group-hover:text-amber-600 transition-colors">{fuel}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Discount Type</label>
                  <div className="flex p-1 bg-gray-50 rounded-xl">
                    <button
                      onClick={() => setPromoFormData({...promoFormData, discountType: 'fixed'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${promoFormData.discountType === 'fixed' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Fixed (SLL)
                    </button>
                    <button
                      onClick={() => setPromoFormData({...promoFormData, discountType: 'percentage'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${promoFormData.discountType === 'percentage' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Percentage (%)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Discount Amount</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500/20 text-surface-900 font-medium transition-all"
                    value={promoFormData.discountAmount}
                    onChange={e => setPromoFormData({...promoFormData, discountAmount: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500/20 text-surface-900 font-medium transition-all"
                    value={promoFormData.startTime}
                    onChange={e => setPromoFormData({...promoFormData, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500/20 text-surface-900 font-medium transition-all"
                    value={promoFormData.endTime}
                    onChange={e => setPromoFormData({...promoFormData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500/20 text-surface-900 font-medium transition-all resize-none"
                  rows={2}
                  placeholder="e.g. Weekend Special! Get 500 SLL off per litre."
                  value={promoFormData.description}
                  onChange={e => setPromoFormData({...promoFormData, description: e.target.value})}
                />
              </div>

              <Button
                onClick={handleSavePromo}
                notificationMessage={editingPromo ? "Updating promotion..." : "Creating promotion..."}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingPromo ? 'Update Promotion' : 'Launch Promotion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
