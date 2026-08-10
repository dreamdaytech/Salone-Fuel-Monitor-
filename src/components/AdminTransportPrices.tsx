import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp, db, handleFirestoreError, OperationType, where, limit, getDocs, addDoc, updateDoc, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bus, Plus, Edit2, Trash2, Search, X, Save, Database, Clock, CheckCircle, TrendingUp, TrendingDown, History, Car, Bike, Ship, Truck, Zap, Info, ChevronDown, ChevronUp, ArrowUpDown, RotateCcw, SlidersHorizontal, MapPin, ClipboardPaste, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Button } from './ui/Button';

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
  routes?: string[];
  vehicleTypes?: string[];
  createdAt: any;
  updatedAt?: any;
}

interface PriceHistory {
  id: string;
  priceId: string;
  price: number;
  date: string;
  timestamp: any;
}

interface BulkRow {
  key: string;
  categoryId: string;
  categoryName: string;
  route: string;
  vehicleType: string;
  price: string;
  isNegotiable: boolean;
  date: string;
  status: 'update' | 'new' | 'error';
  existingId?: string;
  error?: string;
}

interface VehicleType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: any;
}

const ICON_MAP: Record<string, any> = {
  Car, Bus, Bike, Ship, Truck, Zap, Info
};

const VehicleIcon = ({ name, className }: { name?: string, className?: string }) => {
  const Icon = (name && ICON_MAP[name]) || Info;
  return <Icon className={className} />;
};

export default function AdminTransportPrices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'prices' | 'vehicles' | 'categories'>('prices');
  const [prices, setPrices] = useState<TransportPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('All');
  const [sortField, setSortField] = useState<'route' | 'vehicleType' | 'price' | 'date' | 'lastUpdated'>('route');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Advanced filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [showNegotiableOnly, setShowNegotiableOnly] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<TransportPrice | null>(null);
  const [viewingPrice, setViewingPrice] = useState<TransportPrice | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [globalPriceHistory, setGlobalPriceHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyUnsubscribe, setHistoryUnsubscribe] = useState<(() => void) | null>(null);
  const [isManageHistoryOpen, setIsManageHistoryOpen] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [historyFormData, setHistoryFormData] = useState({ price: '', date: '' });
  const [priceToDelete, setPriceToDelete] = useState<string | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleType | null>(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    name: '',
    description: '',
    icon: 'Car'
  });

  const [categories, setCategories] = useState<TransportCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TransportCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<{name: string, description: string, icon: string, routes: string[], vehicleTypes: string[]}>({
    name: '',
    description: '',
    icon: 'Bus',
    routes: [],
    vehicleTypes: []
  });
  const [newCategoryRoute, setNewCategoryRoute] = useState('');
  const [editingCategoryRouteIdx, setEditingCategoryRouteIdx] = useState<number | null>(null);
  const [editingCategoryRouteValue, setEditingCategoryRouteValue] = useState('');

  const [formData, setFormData] = useState({
    route: '',
    vehicleType: 'Car',
    categoryId: '',
    price: '',
    isNegotiable: false,
    date: new Date().toISOString().split('T')[0]
  });

  const [isNewRoute, setIsNewRoute] = useState(false);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const routeDropdownRef = useRef<HTMLDivElement>(null);

  // Bulk Import state
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkParsedRows, setBulkParsedRows] = useState<BulkRow[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  
  const uniqueRoutes = Array.from(new Set(prices.map(p => p.route))).sort();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (routeDropdownRef.current && !routeDropdownRef.current.contains(event.target as Node)) {
        setIsRouteDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const unsubscribeHistory = onSnapshot(collection(db, 'transport_price_history'), (snapshot) => {
      setGlobalPriceHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribeHistory();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'vehicle_types'), orderBy('name')),
      (snapshot) => {
        const typeData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VehicleType[];
        setVehicleTypes(typeData);
        
        // Update default vehicleType if none selected and types exist
        if (typeData.length > 0 && !formData.vehicleType) {
          setFormData(prev => ({ ...prev, vehicleType: typeData[0].name }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'vehicle_types');
      }
    );

    return () => unsubscribe();
  }, []);

  // Load transport categories
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'transport_categories'), orderBy('order')),
      (snapshot) => {
        const catData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TransportCategory[];
        setCategories(catData);
        if (catData.length > 0 && !formData.categoryId) {
          const firstCat = catData[0];
          setFormData(prev => ({ 
            ...prev, 
            categoryId: firstCat.id,
            vehicleType: firstCat.vehicleTypes?.length > 0 ? firstCat.vehicleTypes.join(', ') : prev.vehicleType
          }));
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'transport_categories')
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (historyUnsubscribe) {
        historyUnsubscribe();
      }
    };
  }, [historyUnsubscribe]);

  const handleOpenModal = (price?: TransportPrice) => {
    if (price) {
      setEditingPrice(price);
      setFormData({
        route: price.route,
        vehicleType: price.vehicleType,
        categoryId: price.categoryId || (categories[0]?.id ?? ''),
        price: price.isNegotiable ? '' : price.price.toString(),
        isNegotiable: price.isNegotiable || false,
        date: price.date || new Date().toISOString().split('T')[0]
      });
      setIsNewRoute(false);
    } else {
      setEditingPrice(null);
      const initialCatId = categories[0]?.id ?? '';
      const initialCat = categories.find(c => c.id === initialCatId);
      const initialVehicleType = initialCat?.vehicleTypes?.length > 0 ? initialCat.vehicleTypes.join(', ') : (vehicleTypes.length > 0 ? vehicleTypes[0].name : 'Car');
      
      setFormData({
        route: uniqueRoutes.length > 0 ? uniqueRoutes[0] : '',
        vehicleType: initialVehicleType,
        categoryId: initialCatId,
        price: '',
        isNegotiable: false,
        date: new Date().toISOString().split('T')[0]
      });
      setIsNewRoute(uniqueRoutes.length === 0);
    }
    setIsModalOpen(true);
  };

  // Category CRUD
  const handleOpenCategoryModal = (cat?: TransportCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryFormData({ name: cat.name, description: cat.description || '', icon: cat.icon || 'Bus', routes: cat.routes || [], vehicleTypes: cat.vehicleTypes || [] });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: '', description: '', icon: 'Bus', routes: [], vehicleTypes: [] });
    }
    setNewCategoryRoute('');
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryFormData({ name: '', description: '', icon: 'Bus', routes: [], vehicleTypes: [] });
    setNewCategoryRoute('');
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const docRef = editingCategory
        ? doc(db, 'transport_categories', editingCategory.id)
        : doc(collection(db, 'transport_categories'));
      await setDoc(docRef, {
        name: categoryFormData.name,
        description: categoryFormData.description,
        icon: categoryFormData.icon,
        routes: categoryFormData.routes,
        vehicleTypes: categoryFormData.vehicleTypes,
        order: editingCategory ? (editingCategory.order ?? categories.length) : categories.length,
        updatedAt: serverTimestamp(),
        ...(editingCategory ? {} : { createdAt: serverTimestamp() })
      }, { merge: true });
      setSuccessMessage(`Category ${editingCategory ? 'updated' : 'created'} successfully!`);
      handleCloseCategoryModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transport_categories');
    }
  };

  const confirmCategoryDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteDoc(doc(db, 'transport_categories', categoryToDelete));
      setSuccessMessage('Category deleted.');
      setCategoryToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transport_categories/${categoryToDelete}`);
    }
  };

  const handleOpenViewModal = (price: TransportPrice) => {
    setViewingPrice(price);
    const unsubscribe = fetchPriceHistory(price.id);
    setHistoryUnsubscribe(() => unsubscribe);
  };

  const fetchPriceHistory = (priceId: string) => {
    setHistoryLoading(true);
    const q = query(
      collection(db, 'transport_price_history'),
      where('priceId', '==', priceId),
      orderBy('timestamp', 'asc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PriceHistory[];
      setPriceHistory(history);
      setHistoryLoading(false);
    }, (error) => {
      console.error("Error fetching price history:", error);
      setHistoryLoading(false);
    });

    return unsubscribe;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrice(null);
  };

  const handleCloseViewModal = () => {
    if (historyUnsubscribe) {
      historyUnsubscribe();
      setHistoryUnsubscribe(null);
    }
    setViewingPrice(null);
    setPriceHistory([]);
    setIsManageHistoryOpen(false);
    setEditingHistoryId(null);
  };

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

  const handleDeleteHistory = async (historyId: string) => {
    if (window.confirm('Are you sure you want to delete this price history record?')) {
      try {
        await deleteDoc(doc(db, 'transport_price_history', historyId));
        setSuccessMessage('Price history deleted successfully');
      } catch (error) {
        console.error("Error deleting history:", error);
      }
    }
  };

  const handleSaveHistory = async (historyId: string) => {
    try {
      await setDoc(doc(db, 'transport_price_history', historyId), {
        price: parseFloat(historyFormData.price),
        date: historyFormData.date
      }, { merge: true });
      setEditingHistoryId(null);
      setSuccessMessage('Price history updated successfully');
    } catch (error) {
      console.error("Error updating history:", error);
    }
  };

  // ─── Bulk Import Logic ─────────────────────────────────────────────────────

  const parseBulkText = (rawText: string): BulkRow[] => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const rows: BulkRow[] = [];

    let effectiveDate = new Date().toISOString().split('T')[0];
    let currentCategoryId = '';
    let currentCategoryName = '';
    let currentVehicleType = '';
    let rowIndex = 0;

    // Helper to parse the date from lines like "Effective: Thursday, 29th January, 2026"
    const parseDateLine = (line: string): string => {
      const raw = line.replace(/^effective:\s*/i, '').trim();
      const d = new Date(raw.replace(/(\d+)(st|nd|rd|th)/i, '$1'));
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      return new Date().toISOString().split('T')[0];
    };

    for (const line of lines) {
      // 1. Detect effective date
      if (/^effective:/i.test(line)) {
        effectiveDate = parseDateLine(line);
        continue;
      }

      // 2. Check if line is a category header (fuzzy match against known categories)
      // A category header has no price-like number pattern at the end
      const hasPricePattern = /[-–]\s*[\d.]*\s*$/.test(line);
      if (!hasPricePattern) {
        const trimmed = line.toLowerCase().replace(/[^a-z0-9 ]/g, '');
        let bestMatch: TransportCategory | null = null;
        let bestScore = 0;
        for (const cat of categories) {
          const catName = cat.name.toLowerCase().replace(/[^a-z0-9 ]/g, '');
          // Simple scoring: count matching words
          const catWords = catName.split(' ');
          const lineWords = trimmed.split(' ');
          const score = catWords.filter(w => lineWords.includes(w)).length;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = cat;
          }
        }
        if (bestMatch && bestScore > 0) {
          currentCategoryId = bestMatch.id;
          currentCategoryName = bestMatch.name;
          currentVehicleType = bestMatch.vehicleTypes?.length > 0 ? bestMatch.vehicleTypes.join(', ') : 'Car';
          continue;
        }
        // Not a category and no price — skip
        continue;
      }

      // 3. Parse a route line: "From - To - Price" or "Route Name - Price"
      const parts = line.split('-').map(p => p.trim());
      if (parts.length < 2) continue;

      const priceRaw = parts[parts.length - 1];
      const routeParts = parts.slice(0, parts.length - 1);
      const routeName = routeParts.join(' - ').trim();
      const priceNum = parseFloat(priceRaw);
      const isNegotiable = priceRaw === '' || isNaN(priceNum);

      // Match against existing prices
      const existingPrice = prices.find(
        p => p.route.toLowerCase().trim() === routeName.toLowerCase().trim() &&
             (currentCategoryId === '' || p.categoryId === currentCategoryId)
      );

      let status: BulkRow['status'] = 'new';
      let existingId: string | undefined;
      let error: string | undefined;

      if (!currentCategoryId) {
        status = 'error';
        error = 'No matching category found';
      } else if (existingPrice) {
        status = 'update';
        existingId = existingPrice.id;
      }

      rows.push({
        key: `bulk-${rowIndex++}`,
        categoryId: currentCategoryId,
        categoryName: currentCategoryName,
        route: routeName,
        vehicleType: currentVehicleType,
        price: isNegotiable ? '' : priceNum.toString(),
        isNegotiable,
        date: effectiveDate,
        status,
        existingId,
        error
      });
    }
    return rows;
  };

  const handleBulkParse = () => {
    setBulkParseError(null);
    if (!bulkRawText.trim()) {
      setBulkParseError('Please paste some transport fare data first.');
      return;
    }
    const rows = parseBulkText(bulkRawText);
    if (rows.length === 0) {
      setBulkParseError('No valid rows found. Make sure the text includes route lines with prices (e.g. Lumley - Regent Road - 6.1).');
      return;
    }
    setBulkParsedRows(rows);
    setBulkStep(2);
  };

  const handleBulkConfirm = async () => {
    if (!user) return;
    setBulkImporting(true);
    const validRows = bulkParsedRows.filter(r => r.status !== 'error');

    // Check for duplicate effective dates per route
    const duplicateDates = validRows.filter(row => {
      if (row.status === 'update' && row.existingId) {
        const oldPrice = prices.find(p => p.id === row.existingId);
        return oldPrice && oldPrice.date === row.date;
      }
      return false;
    });

    if (duplicateDates.length > 0) {
      const proceed = window.confirm(
        `${duplicateDates.length} route(s) already have prices recorded for this effective date.\n\nDo you want to overwrite the existing records?`
      );
      if (!proceed) {
        setBulkImporting(false);
        return;
      }
    }

    try {
      await Promise.all(validRows.map(async (row) => {
        const priceVal = row.isNegotiable ? 0 : parseFloat(row.price);
        const priceData = {
          route: row.route,
          vehicleType: row.vehicleType,
          categoryId: row.categoryId,
          price: priceVal,
          isNegotiable: row.isNegotiable,
          date: row.date,
          updatedBy: user.uid,
          lastUpdated: serverTimestamp(),
        };

        if (row.status === 'update' && row.existingId) {
          const oldPrice = prices.find(p => p.id === row.existingId);
          await setDoc(doc(db, 'transport_prices', row.existingId), priceData, { merge: true });
          // Log history if price or date actually changed
          if (oldPrice && (oldPrice.price !== priceVal || oldPrice.date !== row.date)) {
            await setDoc(doc(collection(db, 'transport_price_history')), {
              priceId: row.existingId,
              price: priceVal,
              date: row.date,
              timestamp: serverTimestamp()
            });
          }
        } else if (row.status === 'new') {
          const newDocRef = doc(collection(db, 'transport_prices'));
          await setDoc(newDocRef, priceData);
          await setDoc(doc(collection(db, 'transport_price_history')), {
            priceId: newDocRef.id,
            price: priceVal,
            date: row.date,
            timestamp: serverTimestamp()
          });
        }
      }));
      setSuccessMessage(`✅ ${validRows.length} price${validRows.length > 1 ? 's' : ''} saved successfully!`);
      setIsBulkImportOpen(false);
      setBulkRawText('');
      setBulkParsedRows([]);
      setBulkStep(1);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transport_prices');
    } finally {
      setBulkImporting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const priceData = {
        route: formData.route,
        vehicleType: formData.vehicleType,
        categoryId: formData.categoryId,
        price: formData.isNegotiable ? 0 : Number(formData.price),
        isNegotiable: formData.isNegotiable,
        date: formData.date,
        updatedBy: user.uid,
        lastUpdated: serverTimestamp(),
      };

      // Check for duplicate effective date
      const duplicateExists = prices.some(p => 
        p.route === priceData.route && 
        p.vehicleType === priceData.vehicleType && 
        p.date === priceData.date && 
        p.id !== editingPrice?.id
      );

      if (duplicateExists) {
        alert('A fare entry with this effective date already exists for this route and vehicle type. Please choose a different date.');
        return;
      }

      if (editingPrice) {
        await setDoc(doc(db, 'transport_prices', editingPrice.id), priceData, { merge: true });
        
        // Record history if price or date changed
        if (editingPrice.price !== priceData.price || editingPrice.date !== priceData.date) {
          await setDoc(doc(collection(db, 'transport_price_history')), {
            priceId: editingPrice.id,
            price: priceData.price,
            date: priceData.date,
            timestamp: serverTimestamp()
          });
        }
      } else {
        const newDocRef = doc(collection(db, 'transport_prices'));
        await setDoc(newDocRef, priceData);
        
        // Record initial history
        await setDoc(doc(collection(db, 'transport_price_history')), {
          priceId: newDocRef.id,
          price: priceData.price,
          date: priceData.date,
          timestamp: serverTimestamp()
        });
      }
      handleCloseModal();
    } catch (error) {
      handleFirestoreError(error, editingPrice ? OperationType.UPDATE : OperationType.CREATE, 'transport_prices');
    }
  };

  const handleDelete = async (id: string) => {
    setPriceToDelete(id);
  };

  const confirmDelete = async () => {
    if (!priceToDelete) return;
    try {
      await deleteDoc(doc(db, 'transport_prices', priceToDelete));
      setPriceToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transport_prices/${priceToDelete}`);
    }
  };

  const handleVehicleDelete = (id: string) => {
    setVehicleToDelete(id);
  };

  const confirmVehicleDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      await deleteDoc(doc(db, 'vehicle_types', vehicleToDelete));
      setSuccessMessage('Vehicle type deleted successfully!');
      setVehicleToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vehicle_types/${vehicleToDelete}`);
    }
  };

  const handleOpenVehicleModal = (vehicle?: VehicleType) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleFormData({
        name: vehicle.name,
        description: vehicle.description || '',
        icon: vehicle.icon || 'Car'
      });
    } else {
      setEditingVehicle(null);
      setVehicleFormData({
        name: '',
        description: '',
        icon: 'Car'
      });
    }
    setIsVehicleModalOpen(true);
  };

  const handleCloseVehicleModal = () => {
    setIsVehicleModalOpen(false);
    setEditingVehicle(null);
    setVehicleFormData({ name: '', description: '', icon: 'Car' });
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const docRef = editingVehicle 
        ? doc(db, 'vehicle_types', editingVehicle.id)
        : doc(collection(db, 'vehicle_types'));

      await setDoc(docRef, {
        ...vehicleFormData,
        createdAt: editingVehicle ? editingVehicle.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      }, { merge: true });

      setSuccessMessage(`Vehicle type ${editingVehicle ? 'updated' : 'added'} successfully!`);
      handleCloseVehicleModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'vehicle_types');
    }
  };


  const handleSort = (field: 'route' | 'vehicleType' | 'price' | 'date' | 'lastUpdated') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedVehicleType('All');
    setSelectedCategoryFilter('All');
    setShowNegotiableOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    setSortField('route');
    setSortDirection('asc');
  };

  const filteredPrices = prices.filter(price => {
    const matchesSearch = price.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          price.vehicleType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVehicleType = selectedVehicleType === 'All' || price.vehicleType === selectedVehicleType;
    const matchesCategory = selectedCategoryFilter === 'All' || price.categoryId === selectedCategoryFilter;
    const matchesNegotiable = !showNegotiableOnly || price.isNegotiable;
    
    // Price Range filter
    const matchesMinPrice = minPrice === '' || (price.isNegotiable ? true : price.price >= parseFloat(minPrice));
    const matchesMaxPrice = maxPrice === '' || (price.isNegotiable ? true : price.price <= parseFloat(maxPrice));

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

    return matchesSearch && matchesVehicleType && matchesCategory && matchesNegotiable && matchesMinPrice && matchesMaxPrice && matchesDate;
  }).sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'route') {
      aValue = a.route.toLowerCase();
      bValue = b.route.toLowerCase();
    } else if (sortField === 'vehicleType') {
      aValue = a.vehicleType.toLowerCase();
      bValue = b.vehicleType.toLowerCase();
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

  useEffect(() => {
    setVisibleCount(8);
  }, [searchTerm, selectedVehicleType, selectedCategoryFilter, showNegotiableOnly, minPrice, maxPrice, startDate, endDate]);

  if (loading) {
    return <div className="p-8 text-center">Loading transport fares...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {successMessage && (
        <div className="fixed top-8 right-8 z-[60] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 w-fit flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('prices')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'prices'
              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Bus className="w-4 h-4" />
          Transport Fares
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-blue-50 text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Categories
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'vehicles'
              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Car className="w-4 h-4" />
          Vehicle Types
        </button>
      </div>

      {activeTab === 'prices' && (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Bus className="w-6 h-6" />
              </div>
              Transport Fares
            </h2>
            <p className="text-gray-500 mt-1">Manage public transportation fares across different routes</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={() => { setIsBulkImportOpen(true); setBulkStep(1); setBulkRawText(''); setBulkParsedRows([]); setBulkParseError(null); }}
              variant="secondary"
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold border border-emerald-200 text-white hover:bg-emerald-50 hover:text-emerald-700"
              showNotification={false}
            >
              <ClipboardPaste className="w-4 h-4" />
              Bulk Import
            </Button>
            <Button
              onClick={() => handleOpenModal()}
              variant="primary"
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-emerald-500/20"
              showNotification={false}
            >
              <Plus className="w-4 h-4" /> 
              Add Price
            </Button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-50 bg-gray-50/50 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search routes or vehicle types..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
              <div className="relative min-w-[160px] flex-1 sm:flex-none">
                <select
                  className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>

              <div className="relative min-w-[160px] flex-1 sm:flex-none">
                <select
                  className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
                  value={selectedVehicleType}
                  onChange={(e) => setSelectedVehicleType(e.target.value)}
                >
                  <option value="All">All Vehicles</option>
                  {vehicleTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>

              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant="secondary"
                className={`px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-all border ${showAdvanced ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'border-gray-200'}`}
                showNotification={false}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>

              {(searchTerm || selectedVehicleType !== 'All' || selectedCategoryFilter !== 'All' || showNegotiableOnly || minPrice || maxPrice || startDate || endDate) && (
                <Button
                  onClick={handleResetFilters}
                  variant="ghost"
                  className="px-4 py-3 rounded-2xl border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                  showNotification={false}
                  title="Reset Filters"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          {showAdvanced && (
            <div className="pt-4 border-t border-gray-200/50 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 animate-in slide-in-from-top-4 duration-200">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min Price (SLL)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium shadow-sm"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Max Price (SLL)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium shadow-sm"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-gray-600 shadow-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-gray-600 shadow-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex items-center h-full pt-5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all peer cursor-pointer"
                      checked={showNegotiableOnly}
                      onChange={(e) => setShowNegotiableOnly(e.target.checked)}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">Negotiable Only</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  Category
                </th>
                <th 
                  className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={() => handleSort('route')}
                >
                  <div className="flex items-center gap-2">
                    Route
                    {sortField === 'route' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={() => handleSort('vehicleType')}
                >
                  <div className="flex items-center gap-2">
                    Vehicle Type
                    {sortField === 'vehicleType' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-2">
                    Price (SLL)
                    {sortField === 'price' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Date
                    {sortField === 'date' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={() => handleSort('lastUpdated')}
                >
                  <div className="flex items-center gap-2">
                    Last Updated
                    {sortField === 'lastUpdated' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>
                <th className="px-8 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPrices.length > 0 ? (
                filteredPrices.slice(0, visibleCount).map(price => (
                  <tr 
                    key={price.id} 
                    className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSearchParams({ tab: 'transport', id: price.id })}
                  >
                    <td className="px-8 py-5">
                      {(() => {
                        const cat = categories.find(c => c.id === price.categoryId);
                        return cat ? (
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Uncategorised</span>
                        );
                      })()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900">{price.route}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <VehicleIcon 
                            name={vehicleTypes.find(t => t.name === price.vehicleType)?.icon} 
                            className="w-4 h-4" 
                          />
                        </div>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {price.vehicleType}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {price.isNegotiable ? (
                        <div className="text-lg font-bold text-emerald-600">Negotiable</div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="text-lg font-bold text-gray-900">Le {price.price.toLocaleString()}</div>
                          {(() => {
                            const change = getPriceChange(price.id, price.price);
                            if (!change) return null;
                            return (
                              <div className={`flex items-center gap-1 text-[10px] font-bold mt-0.5 ${change.isIncrease ? 'text-red-500' : 'text-emerald-500'}`}>
                                {change.isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span>{change.isIncrease ? '+' : '-'}{change.pct}%</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-500 font-medium">{price.date || 'N/A'}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {price.lastUpdated?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2 ">
                        <Button
                          onClick={() => handleOpenModal(price)}
                          variant="ghost"
                          className="p-2 rounded-xl transition-all"
                          title="Edit Fare"
                          showNotification={false}
                        >
                          <Edit2 className="w-5 h-5 text-emerald-600" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(price.id)}
                          variant="ghost"
                          className="p-2 rounded-xl transition-all"
                          title="Delete Fare"
                          notificationMessage="Fare deleted successfully"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bus className="w-10 h-10" />
                    </div>
                    <p className="text-gray-500 font-medium">No transport fares found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredPrices.length > visibleCount && (
          <div className="flex justify-center mt-8 mb-8">
            <Button
              onClick={() => setVisibleCount(prev => prev + 8)}
              variant="secondary"
              className="px-8 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
              showNotification={false}
            >
              Show More Fares
            </Button>
          </div>
        )}
      </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
              Transport Categories
            </h2>
            <p className="text-gray-500 mt-1">Organise routes into groups: Freetown Routes, Provincial, Ferries, etc.</p>
          </div>
          <Button
            onClick={() => handleOpenCategoryModal()}
            variant="primary"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            showNotification={false}
          >
            <Plus className="w-5 h-5" /> Add Category
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Icon</th>
                <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Routes</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit">
                        <VehicleIcon name={cat.icon} className="w-5 h-5" />
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-gray-900">{cat.name}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm text-gray-500">{cat.description || '—'}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">
                        {prices.filter(p => p.categoryId === cat.id).length} routes
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleOpenCategoryModal(cat)}
                          variant="ghost"
                          className="p-2 rounded-xl transition-all"
                          title="Edit Category"
                          showNotification={false}
                        >
                          <Edit2 className="w-5 h-5 text-blue-600" />
                        </Button>
                        <Button
                          onClick={() => setCategoryToDelete(cat.id)}
                          variant="ghost"
                          className="p-2 rounded-xl transition-all"
                          title="Delete Category"
                          showNotification={false}
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <p className="text-gray-500 font-medium">No categories yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Create your first category (e.g. "Freetown Routes") to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Vehicle Types Section */}
      {activeTab === 'vehicles' && (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Plus className="w-6 h-6" />
              </div>
              Vehicle Types
            </h2>
            <p className="text-gray-500 mt-1">Manage available vehicle categories for transport pricing</p>
          </div>
          <Button
            onClick={() => handleOpenVehicleModal()}
            variant="primary"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
            showNotification={false}
          >
            <Plus className="w-5 h-5" /> Add Vehicle Type
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Icon</th>
                <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vehicleTypes.length > 0 ? (
                vehicleTypes.map((type) => (
                  <tr key={type.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="p-2 bg-gray-100 text-gray-600 rounded-lg w-fit">
                        <VehicleIcon name={type.icon} className="w-5 h-5" />
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-gray-900">{type.name}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm text-gray-500">{type.description || 'No description'}</div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 ">
                        <Button
                          onClick={() => handleOpenVehicleModal(type)}
                          variant="ghost"
                          className="p-2 rounded-xl transition-all"
                          title="Edit Vehicle Type"
                          showNotification={false}
                        >
                          <Edit2 className="w-5 h-5 text-emerald-600" />
                        </Button>
                        <Button
                          onClick={() => handleVehicleDelete(type.id)}
                          variant="ghost"
                          className="p-2 rounded-xl transition-all"
                          title="Delete Vehicle Type"
                          notificationMessage="Vehicle type deleted successfully"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center">
                    <p className="text-gray-500 font-medium">No vehicle types defined.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-300" onClick={handleCloseModal}>
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingPrice ? 'Edit Transport Fare' : 'Add Transport Fare'}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Category · Route · Vehicle · Price · Date</p>
              </div>
              <Button onClick={handleCloseModal} variant="unstyled" className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400" showNotification={false}>
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                {/* Category selector */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category</label>
                  {categories.length > 0 ? (
                    <select
                      required
                      className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                      value={formData.categoryId}
                      onChange={(e) => {
                        const catId = e.target.value;
                        const selectedCat = categories.find(c => c.id === catId);
                        const vTypes = selectedCat?.vehicleTypes || [];
                        setFormData({ 
                          ...formData, 
                          categoryId: catId,
                          vehicleType: vTypes.length > 0 ? vTypes.join(', ') : (vehicleTypes.length > 0 ? vehicleTypes[0].name : 'Car')
                        });
                      }}
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700 font-medium">
                      ⚠️ No categories yet. Go to the <strong>Categories</strong> tab to create one first.
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Route Name</label>
                  {(() => {
                    const selectedCategory = categories.find(c => c.id === formData.categoryId);
                    const catRoutes = selectedCategory?.routes || [];
                    
                    if (!formData.categoryId) {
                       return <div className="text-sm text-gray-500 italic px-5 py-3.5 sm:py-4 bg-gray-50 rounded-2xl">Please select a category first.</div>;
                    }
                    if (catRoutes.length === 0) {
                       return <div className="text-sm text-amber-600 font-medium bg-amber-50 p-4 rounded-2xl border border-amber-200">No routes defined for this category. Go to the Categories tab to add some.</div>;
                    }

                    return (
                      <div className="relative" ref={routeDropdownRef}>
                        <div 
                          className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold flex justify-between items-center cursor-pointer focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
                          onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
                        >
                          <span className={formData.route ? 'text-gray-900' : 'text-gray-500'}>
                            {formData.route || 'Select a route'}
                          </span>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isRouteDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {isRouteDropdownOpen && (
                          <div className="absolute z-[100] top-full mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-2 border-b border-gray-100">
                              <input 
                                type="text"
                                placeholder="Search routes..."
                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={routeSearchTerm}
                                onChange={(e) => setRouteSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            </div>
                            <ul className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                              {catRoutes.filter(route => route.toLowerCase().includes(routeSearchTerm.toLowerCase())).map(route => (
                                <li 
                                  key={route}
                                  className={`px-4 py-3 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between ${formData.route === route ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'}`}
                                  onClick={() => {
                                    setFormData({ ...formData, route });
                                    setIsRouteDropdownOpen(false);
                                    setRouteSearchTerm('');
                                  }}
                                >
                                  {route}
                                  {formData.route === route && <CheckCircle className="w-4 h-4" />}
                                </li>
                              ))}
                              {catRoutes.filter(route => route.toLowerCase().includes(routeSearchTerm.toLowerCase())).length === 0 && (
                                <li className="px-4 py-4 text-sm text-gray-500 text-center font-medium">No routes found in this category</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                    {(() => {
                      const selectedCategory = categories.find(c => c.id === formData.categoryId);
                      const allowedTypes = selectedCategory?.vehicleTypes || [];
                      
                      if (!formData.categoryId) {
                         return <div className="text-sm text-gray-500 italic px-5 py-3.5 sm:py-4 bg-gray-50 rounded-2xl">Select category first.</div>;
                      }
                      
                      // For backwards compatibility or empty config, if allowedTypes is empty, show all vehicle types.
                      // But ideally they should configure it. Let's warn them if it's strictly empty.
                      if (allowedTypes.length === 0) {
                        return <div className="text-sm text-amber-600 font-medium bg-amber-50 p-4 rounded-2xl border border-amber-200">No vehicle types allowed for this category. Go to Categories tab to configure.</div>;
                      }

                      return (
                        <div className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-500 flex items-center overflow-x-auto whitespace-nowrap custom-scrollbar">
                          {allowedTypes.join(', ')}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fare (SLL)</label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20"
                          checked={formData.isNegotiable}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              isNegotiable: e.target.checked,
                              price: e.target.checked ? '' : formData.price
                            });
                          }}
                        />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Negotiable</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      required={!formData.isNegotiable}
                      disabled={formData.isNegotiable}
                      min="0"
                      className={`w-full px-5 py-3.5 sm:py-4 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                        formData.isNegotiable ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-900'
                      }`}
                      placeholder={formData.isNegotiable ? "Negotiable" : "5000"}
                      value={formData.isNegotiable ? '' : formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    type="button"
                    onClick={handleCloseModal}
                    variant="secondary"
                    className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all order-2 sm:order-1"
                    showNotification={false}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 order-1 sm:order-2"
                    notificationMessage={editingPrice ? "Updating fare..." : "Saving fare..."}
                  >
                    <Save className="w-5 h-5" /> 
                    {editingPrice ? 'Update Fare' : 'Save Fare'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Type Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-in fade-in duration-300" onClick={handleCloseVehicleModal}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingVehicle ? 'Edit Vehicle Type' : 'Add Vehicle Type'}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Category Details</p>
              </div>
              <Button onClick={handleCloseVehicleModal} variant="unstyled" className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400" showNotification={false}>
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleVehicleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="e.g., Bus, Taxi, Ferry"
                    value={vehicleFormData.name}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Icon</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {Object.keys(ICON_MAP).map((iconName) => (
                      <Button
                        key={iconName}
                        type="button"
                        onClick={() => setVehicleFormData({ ...vehicleFormData, icon: iconName })}
                        variant="unstyled"
                        className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                          vehicleFormData.icon === iconName
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                        title={iconName}
                        showNotification={false}
                      >
                        <VehicleIcon name={iconName} className="w-5 h-5" />
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[100px]"
                    placeholder="Optional description..."
                    value={vehicleFormData.description}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, description: e.target.value })}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3.5 sm:py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                  notificationMessage={editingVehicle ? "Updating vehicle type..." : "Saving vehicle type..."}
                >
                  <Save className="w-5 h-5" /> {editingVehicle ? 'Update Vehicle Type' : 'Save Vehicle Type'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewingPrice && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300" onClick={handleCloseViewModal}>
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Fare Details</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Route Information</p>
              </div>
              <Button onClick={handleCloseViewModal} variant="unstyled" className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400" showNotification={false}>
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Route</label>
                  <div className="text-base sm:text-lg font-bold text-gray-900">{viewingPrice.route}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle Type</label>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <VehicleIcon 
                          name={vehicleTypes.find(t => t.name === viewingPrice.vehicleType)?.icon} 
                          className="w-4 h-4" 
                        />
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {viewingPrice.vehicleType}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fare</label>
                    {viewingPrice.isNegotiable ? (
                      <div className="text-lg sm:text-xl font-black text-emerald-600">Negotiable</div>
                    ) : (
                      <div className="text-lg sm:text-xl font-black text-emerald-600">Le {viewingPrice.price.toLocaleString()}</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Effective Date</label>
                    <div className="text-sm font-bold text-gray-700">{viewingPrice.date || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Updated</label>
                    <div className="text-sm font-bold text-gray-700">
                      {viewingPrice.lastUpdated?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Price History Graph */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Fare History
                    </h4>
                    <div className="flex items-center gap-3">
                      {!isManageHistoryOpen && priceHistory.length > 0 && (
                        <button
                          onClick={() => setIsManageHistoryOpen(true)}
                          className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Manage
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last 20 changes</span>
                    </div>
                  </div>
                  
                  {isManageHistoryOpen ? (
                    <div className="h-40 sm:h-48 overflow-y-auto w-full bg-gray-50 rounded-2xl p-2 border border-gray-100 custom-scrollbar space-y-2">
                      {priceHistory.map((history) => (
                        <div key={history.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                          {editingHistoryId === history.id ? (
                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                              <input
                                type="date"
                                className="px-3 py-1.5 bg-gray-50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                                value={historyFormData.date}
                                onChange={(e) => setHistoryFormData({ ...historyFormData, date: e.target.value })}
                              />
                              <input
                                type="number"
                                className="px-3 py-1.5 bg-gray-50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 w-24"
                                value={historyFormData.price}
                                onChange={(e) => setHistoryFormData({ ...historyFormData, price: e.target.value })}
                                placeholder="Fare"
                              />
                              <div className="flex gap-1 ml-auto">
                                <button onClick={() => handleSaveHistory(history.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingHistoryId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs font-bold text-gray-900">SLL {history.price.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-500">{new Date(history.date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => {
                                    setEditingHistoryId(history.id);
                                    setHistoryFormData({ price: history.price.toString(), date: history.date });
                                  }} 
                                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteHistory(history.id)} 
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 sm:h-48 w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      {historyLoading ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                        Loading history...
                      </div>
                    ) : priceHistory.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={priceHistory}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            hide 
                          />
                          <YAxis 
                            hide 
                            domain={['dataMin - 1000', 'dataMax + 1000']}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                            formatter={(value: number) => [`Le ${value.toLocaleString()}`, 'Price']}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorPrice)" 
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                        <History className="w-6 h-6 sm:w-8 sm:h-8 text-gray-200" />
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium">No fare history available yet.</p>
                      </div>
                    )}
                  </div>
                  )}
                </div>
                
                <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      handleCloseViewModal();
                      handleOpenModal(viewingPrice);
                    }}
                    variant="secondary"
                    className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 order-2 sm:order-1"
                    showNotification={false}
                  >
                    <Edit2 className="w-5 h-5" /> Edit
                  </Button>
                  <Button
                    onClick={() => {
                      handleCloseViewModal();
                      handleDelete(viewingPrice.id);
                    }}
                    variant="danger"
                    className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
                    notificationMessage="Fare deleted successfully"
                  >
                    <Trash2 className="w-5 h-5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {priceToDelete && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300" onClick={() => setPriceToDelete(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Delete Transport Fare?</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-8">Are you sure you want to delete this transport fare entry? This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => setPriceToDelete(null)}
                variant="secondary"
                className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all order-2 sm:order-1"
                showNotification={false}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                variant="danger"
                className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 order-1 sm:order-2"
                notificationMessage="Deleting transport fare..."
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {vehicleToDelete && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300" onClick={() => setVehicleToDelete(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Delete Vehicle Type?</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-8">Are you sure you want to delete this vehicle type? This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => setVehicleToDelete(null)}
                variant="secondary"
                className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all order-2 sm:order-1"
                showNotification={false}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmVehicleDelete}
                variant="danger"
                className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 order-1 sm:order-2"
                notificationMessage="Deleting vehicle type..."
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirm Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300" onClick={() => setCategoryToDelete(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Delete Category?</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-2">
              Are you sure you want to delete this category?
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8">
              ⚠️ Routes assigned to this category will appear as "Uncategorised" on the public page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => setCategoryToDelete(null)}
                variant="secondary"
                className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all order-2 sm:order-1"
                showNotification={false}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmCategoryDelete}
                variant="danger"
                className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 order-1 sm:order-2"
                notificationMessage="Deleting category..."
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-in fade-in duration-300" onClick={handleCloseCategoryModal}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Transport Route Group</p>
              </div>
              <Button onClick={handleCloseCategoryModal} variant="unstyled" className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400" showNotification={false}>
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleCategorySubmit} className="p-6 sm:p-8 space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g. Freetown Routes"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g. Routes within Freetown city"
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Predefined Routes</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="e.g. Lumley - Regent Road"
                      value={newCategoryRoute}
                      onChange={(e) => setNewCategoryRoute(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCategoryRoute.trim() && !categoryFormData.routes.includes(newCategoryRoute.trim())) {
                            setCategoryFormData(prev => ({ ...prev, routes: [...prev.routes, newCategoryRoute.trim()] }));
                            setNewCategoryRoute('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newCategoryRoute.trim() && !categoryFormData.routes.includes(newCategoryRoute.trim())) {
                          setCategoryFormData(prev => ({ ...prev, routes: [...prev.routes, newCategoryRoute.trim()] }));
                          setNewCategoryRoute('');
                        }
                      }}
                      variant="secondary"
                      className="px-5 rounded-2xl font-bold transition-all bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-2"
                      showNotification={false}
                    >
                      <Plus className="w-5 h-5" /> Add
                    </Button>
                  </div>
                  {categoryFormData.routes.length > 0 ? (
                    <div className="flex flex-col gap-2 mt-3 max-h-40 overflow-y-auto custom-scrollbar p-1">
                      {categoryFormData.routes.map((route, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 group">
                          {editingCategoryRouteIdx === idx ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                                value={editingCategoryRouteValue}
                                onChange={(e) => setEditingCategoryRouteValue(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = editingCategoryRouteValue.trim();
                                    if (val && (!categoryFormData.routes.includes(val) || val === route)) {
                                      setCategoryFormData(prev => {
                                        const newRoutes = [...prev.routes];
                                        newRoutes[idx] = val;
                                        return { ...prev, routes: newRoutes };
                                      });
                                    }
                                    setEditingCategoryRouteIdx(null);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = editingCategoryRouteValue.trim();
                                  if (val && (!categoryFormData.routes.includes(val) || val === route)) {
                                    setCategoryFormData(prev => {
                                      const newRoutes = [...prev.routes];
                                      newRoutes[idx] = val;
                                      return { ...prev, routes: newRoutes };
                                    });
                                  }
                                  setEditingCategoryRouteIdx(null);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryRouteIdx(null)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-bold text-gray-700">{route}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategoryRouteIdx(idx);
                                    setEditingCategoryRouteValue(route);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to remove the route "${route}" from this category?`)) {
                                      setCategoryFormData(prev => ({ ...prev, routes: prev.routes.filter(r => r !== route) }));
                                    }
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic mt-2 ml-1">No routes defined. Add routes for this category.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Allowed Vehicle Types</label>
                  <div className="flex flex-wrap gap-2">
                    {vehicleTypes.map((type) => {
                      const isSelected = categoryFormData.vehicleTypes.includes(type.name);
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setCategoryFormData(prev => {
                              const newTypes = isSelected
                                ? prev.vehicleTypes.filter(t => t !== type.name)
                                : [...prev.vehicleTypes, type.name];
                              return { ...prev, vehicleTypes: newTypes };
                            });
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200 hover:text-emerald-600'
                          }`}
                        >
                          <VehicleIcon name={type.icon} className="w-4 h-4" />
                          {type.name}
                        </button>
                      );
                    })}
                    {vehicleTypes.length === 0 && (
                      <p className="text-xs text-gray-500 italic ml-1">No vehicle types defined in the system.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Icon</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {Object.keys(ICON_MAP).map((iconName) => (
                      <Button
                        key={iconName}
                        type="button"
                        onClick={() => setCategoryFormData({ ...categoryFormData, icon: iconName })}
                        variant="unstyled"
                        className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                          categoryFormData.icon === iconName
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                        title={iconName}
                        showNotification={false}
                      >
                        <VehicleIcon name={iconName} className="w-5 h-5" />
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    type="button"
                    onClick={handleCloseCategoryModal}
                    variant="secondary"
                    className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all order-2 sm:order-1"
                    showNotification={false}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 order-1 sm:order-2"
                    notificationMessage={editingCategory ? 'Updating category...' : 'Saving category...'}
                  >
                    <Save className="w-5 h-5" />
                    {editingCategory ? 'Update Category' : 'Save Category'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ───── Bulk Import Modal ───── */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Bulk Import Transport Fares</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {bulkStep === 1 ? 'Step 1 of 2 — Paste your raw data' : `Step 2 of 2 — Review & confirm ${bulkParsedRows.length} rows`}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsBulkImportOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Step 1 — Paste */}
            {bulkStep === 1 && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
                  <p className="font-bold mb-1">📋 Expected Format</p>
                  <pre className="text-xs whitespace-pre-wrap font-mono text-blue-600 leading-relaxed">{`Effective: Thursday, 29th January, 2026

Freetown Routes
Lumley - Regent Road - 6.1
Aberdeen - Regent Road - 6.1
Waterloo - Bombay Street - 14.7

Freetown to Provincial
Freetown - Bo - 159.7
Freetown - Makeni - 147.4`}</pre>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Paste Transport Fare Data</label>
                  <textarea
                    className="w-full h-72 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                    placeholder="Paste your transport fare text here..."
                    value={bulkRawText}
                    onChange={e => setBulkRawText(e.target.value)}
                  />
                </div>

                {bulkParseError && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bulkParseError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Preview Table */}
            {bulkStep === 2 && (
              <div className="flex-1 overflow-y-auto">
                {/* Summary bar */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-center text-xs font-bold shrink-0">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    {bulkParsedRows.filter(r => r.status === 'update').length} Updates
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    {bulkParsedRows.filter(r => r.status === 'new').length} New Routes
                  </span>
                  <span className="flex items-center gap-1.5 text-red-600">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    {bulkParsedRows.filter(r => r.status === 'error').length} Errors
                  </span>
                  <span className="ml-auto text-gray-500 font-medium">{bulkParsedRows.length} total rows</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Route</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Fare (Le)</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Negotiable</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bulkParsedRows.map((row, idx) => (
                        <tr key={row.key} className={`transition-colors ${
                          row.status === 'error' ? 'bg-red-50/60' : 
                          row.status === 'new' ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'
                        }`}>
                          {/* Status Badge */}
                          <td className="px-4 py-2.5">
                            {row.status === 'update' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">
                                <CheckCircle className="w-3 h-3" /> UPDATE
                              </span>
                            )}
                            {row.status === 'new' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                                <Plus className="w-3 h-3" /> NEW
                              </span>
                            )}
                            {row.status === 'error' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg" title={row.error}>
                                <AlertTriangle className="w-3 h-3" /> ERROR
                              </span>
                            )}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-2.5">
                            <select
                              className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                              value={row.categoryId}
                              onChange={e => {
                                const cat = categories.find(c => c.id === e.target.value);
                                setBulkParsedRows(prev => prev.map((r, i) => i === idx ? {
                                  ...r,
                                  categoryId: e.target.value,
                                  categoryName: cat?.name || '',
                                  vehicleType: cat?.vehicleTypes?.length > 0 ? cat.vehicleTypes.join(', ') : r.vehicleType,
                                  status: r.status === 'error' && e.target.value ? 'new' : r.status
                                } : r));
                              }}
                            >
                              <option value="">-- Select --</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>

                          {/* Route */}
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              className="w-full min-w-[180px] px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                              value={row.route}
                              onChange={e => setBulkParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, route: e.target.value } : r))}
                            />
                          </td>

                          {/* Price */}
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              className="w-24 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 disabled:bg-gray-50 disabled:text-gray-400"
                              value={row.price}
                              disabled={row.isNegotiable}
                              onChange={e => setBulkParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, price: e.target.value } : r))}
                            />
                          </td>

                          {/* Negotiable */}
                          <td className="px-4 py-2.5">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                              checked={row.isNegotiable}
                              onChange={e => setBulkParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, isNegotiable: e.target.checked, price: e.target.checked ? '' : r.price } : r))}
                            />
                          </td>

                          {/* Date */}
                          <td className="px-4 py-2.5">
                            <input
                              type="date"
                              className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                              value={row.date}
                              onChange={e => setBulkParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, date: e.target.value } : r))}
                            />
                          </td>

                          {/* Delete row */}
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => setBulkParsedRows(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 shrink-0 flex gap-3 justify-between items-center">
              {bulkStep === 1 ? (
                <>
                  <button onClick={() => setIsBulkImportOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                  <Button
                    onClick={handleBulkParse}
                    variant="primary"
                    className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                    showNotification={false}
                  >
                    Parse Data <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setBulkStep(1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <Button
                    onClick={handleBulkConfirm}
                    variant="primary"
                    disabled={bulkImporting || bulkParsedRows.filter(r => r.status !== 'error').length === 0}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    showNotification={false}
                  >
                    {bulkImporting ? (
                      <><RotateCcw className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Confirm & Save {bulkParsedRows.filter(r => r.status !== 'error').length} Records</>
                    )}
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

