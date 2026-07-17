import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, onSnapshot, doc, setDoc, updateDoc, addDoc, deleteDoc, serverTimestamp, handleFirestoreError, OperationType, orderBy, where, limit } from '../firebase';
import { Shield, Save, Users, Building2, TrendingUp, Database, Eye, X, Plus, ArrowUpDown, ChevronUp, ChevronDown, LayoutDashboard, Search, MapPin, Filter, Tag, Bus, History, LogOut, CheckCircle, Clock, XCircle, Fuel, MessageSquare, Star, Menu, Settings, Trash2, Slash, Edit2, AlertTriangle, RotateCcw, Check, MoreVertical, Globe, Key, CheckSquare, Square } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminTransportPrices from '../components/AdminTransportPrices';
import AdminMessages from '../components/AdminMessages';
import AdminStationMap from '../components/AdminStationMap';
import AdminReviews from './AdminReviews';
import AdminSettings from '../components/AdminSettings';
import { Button } from '../components/ui/Button';
import { NotificationService } from '../services/NotificationService';
import { SIERRA_LEONE_DISTRICTS } from '../lib/constants';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [govPrices, setGovPrices] = useState<Record<string, number>>({ Petrol: 0, Diesel: 0, Kerosene: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [isGoogleMapsConfigured, setIsGoogleMapsConfigured] = useState(false);
  const [isSavingGoogleMaps, setIsSavingGoogleMaps] = useState(false);
  const [googleMapsMessage, setGoogleMapsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [rawPriceHistory, setRawPriceHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(30);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyViewMode, setHistoryViewMode] = useState<'chart' | 'table'>('chart');
  const [historySortField, setHistorySortField] = useState<'timestamp' | 'price' | 'fuelType'>('timestamp');
  const [historySortDirection, setHistorySortDirection] = useState<'asc' | 'desc'>('desc');
  const [historyFuelFilter, setHistoryFuelFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'name' | 'district' | 'isVerified'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stations' | 'submitted_stations' | 'map' | 'prices' | 'transport' | 'messages' | 'reviews' | 'settings'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('Petrol');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [visibleStationsCount, setVisibleStationsCount] = useState(8);
  const [visibleUsersCount, setVisibleUsersCount] = useState(8);
  const [isEditingStation, setIsEditingStation] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isDeletingStation, setIsDeletingStation] = useState(false);
  const [isSuspendingStation, setIsSuspendingStation] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isUpdatingGovPrice, setIsUpdatingGovPrice] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const cancelEditStation = () => {
    setIsEditingStation(false);
    setEditFormData(null);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const unsubscribeGov = onSnapshot(
      doc(db, 'government_prices', 'current'),
      (docSnap) => {
        if (docSnap.exists()) {
          setGovPrices(docSnap.data().prices || { Petrol: 0, Diesel: 0, Kerosene: 0 });
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'government_prices/current')
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    const unsubscribeStations = onSnapshot(
      collection(db, 'stations'),
      (snapshot) => {
        setStations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'stations');
      }
    );

    return () => {
      unsubscribeGov();
      unsubscribeUsers();
      unsubscribeStations();
    };
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'map') {
      fetchGoogleMapsSettings();
    }
  }, [activeTab]);

  const fetchGoogleMapsSettings = async () => {
    try {
      const response = await fetch('/api/settings/google-maps');
      if (response.ok) {
        const data = await response.json();
        setGoogleMapsApiKey(data.apiKey || '');
        setIsGoogleMapsConfigured(data.isConfigured);
      }
    } catch (error) {
      console.error('Failed to fetch Google Maps settings:', error);
    }
  };

  const handleSaveGoogleMaps = async () => {
    setIsSavingGoogleMaps(true);
    setGoogleMapsMessage(null);
    try {
      const response = await fetch('/api/settings/google-maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: googleMapsApiKey }),
      });
      if (response.ok) {
        setGoogleMapsMessage({ type: 'success', text: 'Google Maps API key saved successfully.' });
        setIsGoogleMapsConfigured(true);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setGoogleMapsMessage({ type: 'error', text: 'Failed to save Google Maps API key.' });
    } finally {
      setIsSavingGoogleMaps(false);
    }
  };

  useEffect(() => {
    setVisibleStationsCount(8);
  }, [searchTerm, selectedFuel, selectedDistrict, selectedBrand, showVerifiedOnly, sortField, sortDirection]);

  useEffect(() => {
    if (!selectedStation) {
      setPriceHistory([]);
      return;
    }

    setHistoryLoading(true);
    const unsubscribeHistory = onSnapshot(
      query(
        collection(db, 'price_history'),
        where('stationId', '==', selectedStation.id),
        orderBy('timestamp', 'desc'),
        limit(historyLimit)
      ),
      (snapshot) => {
        const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHasMoreHistory(snapshot.docs.length === historyLimit);
        
        setRawPriceHistory(historyData);
        // Group by date to format for chart
        const groupedData: Record<string, any> = {};
        
        // Process from oldest to newest for the chart
        [...historyData].reverse().forEach((entry: any) => {
          if (!entry.timestamp) return;
          const date = entry.timestamp.toDate().toLocaleDateString();
          if (!groupedData[date]) {
            groupedData[date] = { date };
          }
          groupedData[date][entry.fuelType] = entry.price;
        });

        // Convert grouped object to array
        const chartData = Object.values(groupedData);
        setPriceHistory(chartData);
        setHistoryLoading(false);
      },
      (error) => {
        setHistoryLoading(false);
        // If index is missing, fallback to unfiltered query (common in dev)
        if (error instanceof Error && error.message.includes('index')) {
          console.warn('Price history index missing, falling back to client-side filtering');
          const unsubFallback = onSnapshot(
            query(collection(db, 'price_history'), orderBy('timestamp', 'desc'), limit(historyLimit)),
            (snapshot) => {
              const historyData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((doc: any) => doc.stationId === selectedStation.id);
              
              setHasMoreHistory(snapshot.docs.length === historyLimit);
              setRawPriceHistory(historyData);
              const groupedData: Record<string, any> = {};
              [...historyData].reverse().forEach((entry: any) => {
                if (!entry.timestamp) return;
                const date = entry.timestamp.toDate().toLocaleDateString();
                if (!groupedData[date]) groupedData[date] = { date };
                groupedData[date][entry.fuelType] = entry.price;
              });
              setPriceHistory(Object.values(groupedData));
              setHistoryLoading(false);
            }
          );
          return unsubFallback;
        }
        handleFirestoreError(error, OperationType.LIST, 'price_history');
      }
    );

    return () => unsubscribeHistory();
  }, [selectedStation, historyLimit]);

  const handleUpdateGovPrice = async () => {
    if (!user || isUpdatingGovPrice) return;
    setIsUpdatingGovPrice(true);
    try {
      await setDoc(doc(db, 'government_prices', 'current'), {
        prices: govPrices,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      setSuccessMessage('Official prices updated successfully');
      await NotificationService.notifyGovPriceUpdate(govPrices);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'government_prices/current');
    } finally {
      setIsUpdatingGovPrice(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Protect default admins
    const isDefaultAdmin = user.email?.toLowerCase() === 'kharifakumara16@gmail.com' || user.email?.toLowerCase() === 'kharifaabdulaikumara1@gmail.com';
    if (isDefaultAdmin) {
      alert("This administrator account cannot be deleted.");
      return;
    }
    
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeletingUser(true);
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      setSuccessMessage('Member deleted successfully');
      setUserToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userToDelete.id}`);
    } finally {
      setIsDeletingUser(false);
    }
  };

    const handleUpdateStationVerification = async (stationId: string, isVerified: boolean) => {
      try {
        await updateDoc(doc(db, 'stations', stationId), { 
          isVerified,
          lastUpdated: serverTimestamp()
        });
        setSuccessMessage(`Station ${isVerified ? 'verified' : 'unverified'} successfully`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `stations/${stationId}`);
      }
    };

    const handleUpdateStationPublished = async (stationId: string, isPublished: boolean) => {
      try {
        await updateDoc(doc(db, 'stations', stationId), { 
          isPublished,
          lastUpdated: serverTimestamp()
        });
        setSuccessMessage(`Station ${isPublished ? 'published' : 'unpublished'} successfully`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `stations/${stationId}`);
      }
    };

    const handleDeleteStation = async (stationId: string) => {
      if (!window.confirm('Are you sure you want to permanently delete this station? This action cannot be undone.')) return;
      
      setIsDeletingStation(true);
      try {
        await deleteDoc(doc(db, 'stations', stationId));
        setSuccessMessage('Station deleted successfully');
        setSelectedStation(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `stations/${stationId}`);
      } finally {
        setIsDeletingStation(false);
      }
    };

    const handleToggleSuspend = async (stationId: string, currentStatus: boolean) => {
      const action = currentStatus ? 'unsuspend' : 'suspend';
      if (!window.confirm(`Are you sure you want to ${action} this station?`)) return;
      
      setIsSuspendingStation(true);
      try {
        await updateDoc(doc(db, 'stations', stationId), {
          isSuspended: !currentStatus,
          lastUpdated: serverTimestamp()
        });
        setSuccessMessage(`Station ${action}ed successfully`);
        if (selectedStation?.id === stationId) {
          setSelectedStation({ ...selectedStation, isSuspended: !currentStatus });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `stations/${stationId}`);
      } finally {
        setIsSuspendingStation(false);
      }
    };

    const startEditStation = (station: any) => {
      setEditFormData({ ...station });
      setIsEditingStation(true);
    };

    const handleBulkVerify = async () => {
      if (selectedStationIds.length === 0 || isBulkActionLoading) return;
      if (!window.confirm(`Are you sure you want to verify ${selectedStationIds.length} stations?`)) return;
      
      setIsBulkActionLoading(true);
      try {
        const promises = selectedStationIds.map(id => 
          updateDoc(doc(db, 'stations', id), { isVerified: true, lastUpdated: serverTimestamp() })
        );
        await Promise.all(promises);
        setSuccessMessage(`${selectedStationIds.length} stations verified successfully`);
        setSelectedStationIds([]);
      } catch (error) {
        setErrorMessage(`Failed to verify stations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        handleFirestoreError(error, OperationType.UPDATE, 'stations/bulk');
      } finally {
        setIsBulkActionLoading(false);
      }
    };

    const handleBulkSuspend = async (suspend: boolean) => {
      if (selectedStationIds.length === 0 || isBulkActionLoading) return;
      const action = suspend ? 'suspend' : 'unsuspend';
      if (!window.confirm(`Are you sure you want to ${action} ${selectedStationIds.length} stations?`)) return;
      
      setIsBulkActionLoading(true);
      try {
        const promises = selectedStationIds.map(id => 
          updateDoc(doc(db, 'stations', id), { isSuspended: suspend, lastUpdated: serverTimestamp() })
        );
        await Promise.all(promises);
        setSuccessMessage(`${selectedStationIds.length} stations ${action}ed successfully`);
        setSelectedStationIds([]);
      } catch (error) {
        setErrorMessage(`Failed to ${action} stations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        handleFirestoreError(error, OperationType.UPDATE, 'stations/bulk');
      } finally {
        setIsBulkActionLoading(false);
      }
    };

    const handleBulkDelete = async () => {
      if (selectedStationIds.length === 0 || isBulkActionLoading) return;
      if (!window.confirm(`Are you sure you want to permanently delete ${selectedStationIds.length} stations? This action cannot be undone.`)) return;
      
      setIsBulkActionLoading(true);
      try {
        const promises = selectedStationIds.map(id => 
          deleteDoc(doc(db, 'stations', id))
        );
        await Promise.all(promises);
        setSuccessMessage(`${selectedStationIds.length} stations deleted successfully`);
        setSelectedStationIds([]);
      } catch (error) {
        setErrorMessage(`Failed to delete stations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        handleFirestoreError(error, OperationType.DELETE, 'stations/bulk');
      } finally {
        setIsBulkActionLoading(false);
      }
    };

    const toggleStationSelection = (stationId: string) => {
      setSelectedStationIds(prev => 
        prev.includes(stationId) 
          ? prev.filter(id => id !== stationId)
          : [...prev, stationId]
      );
    };

    const toggleAllStationsSelection = () => {
      const currentVisibleIds = sortedStations.slice(0, visibleStationsCount).map(s => s.id);
      const allSelected = currentVisibleIds.every(id => selectedStationIds.includes(id));
      
      if (allSelected) {
        setSelectedStationIds(prev => prev.filter(id => !currentVisibleIds.includes(id)));
      } else {
        setSelectedStationIds(prev => [...new Set([...prev, ...currentVisibleIds])]);
      }
    };

    const handleSaveEdit = async () => {
      if (!editFormData) return;
      
      try {
        const { id, ...data } = editFormData;
        await updateDoc(doc(db, 'stations', id), {
          ...data,
          lastUpdated: serverTimestamp()
        });
        setSuccessMessage('Station details updated successfully');
        setIsEditingStation(false);
        setEditFormData(null);
        if (selectedStation?.id === id) {
          setSelectedStation(editFormData);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `stations/${editFormData.id}`);
      }
    };

    const seedStationHistory = async (stationId: string) => {
      if (!user) return;
      if (!window.confirm('Add 7 days of demo price history for this station?')) return;

      setHistoryLoading(true);
      const fuelTypes = ['Petrol', 'Diesel', 'Kerosene'];
      const basePrices = { Petrol: 25000, Diesel: 24500, Kerosene: 21000 };
      
      try {
        const promises = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          for (const fuel of fuelTypes) {
            const randomVariation = Math.floor(Math.random() * 1000) - 500;
            const price = basePrices[fuel as keyof typeof basePrices] + randomVariation;
            
            promises.push(addDoc(collection(db, 'price_history'), {
              stationId,
              fuelType: fuel,
              price,
              timestamp: date
            }));
          }
        }
        await Promise.all(promises);
        alert('Demo history seeded successfully!');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'price_history');
      } finally {
        setHistoryLoading(false);
      }
    };

    const seedDemoData = async () => {
      if (!user) return;
      
      setIsSeeding(true);
      setShowConfirmModal(false);
      try {
        const brands = ['NP', 'Leonco', 'Total', 'Conex'];
        const demoStations = SIERRA_LEONE_DISTRICTS.map((district, index) => {
          const brand = brands[index % brands.length];
          return {
            name: `${brand} - ${district} Central`,
            district: district,
            location: `${district} Main Road`,
            brand: brand,
            contact: `076${Math.floor(100000 + Math.random() * 900000)}`,
            operatingHours: index % 3 === 0 ? "24/7" : "6:00 AM - 10:00 PM",
            fuelTypes: ["Petrol", "Diesel", "Kerosene"],
            prices: { 
              Petrol: 30000 + (Math.floor(Math.random() * 5) * 500), 
              Diesel: 30000 + (Math.floor(Math.random() * 5) * 500), 
              Kerosene: 25000 + (Math.floor(Math.random() * 5) * 500) 
            },
            isVerified: index % 2 === 0,
            status: 'approved',
            latitude: 7.5 + (Math.random() * 2), // 7.5 to 9.5
            longitude: -13.0 + (Math.random() * 2.5), // -13.0 to -10.5
            ownerId: user.uid,
          };
        });

        for (const station of demoStations) {
          await addDoc(collection(db, 'stations'), {
            ...station,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          });
        }

        const demoTransportPrices = [
          {
            route: "Freetown - Bo",
            vehicleType: "Bus (Government)",
            price: 150000,
            date: new Date().toISOString().split('T')[0],
            updatedBy: user.uid
          },
          {
            route: "Freetown - Kenema",
            vehicleType: "Bus (Government)",
            price: 180000,
            date: new Date().toISOString().split('T')[0],
            updatedBy: user.uid
          },
          {
            route: "Freetown - Makeni",
            vehicleType: "Poda Poda",
            price: 120000,
            date: new Date().toISOString().split('T')[0],
            updatedBy: user.uid
          },
          {
            route: "Lungi - Freetown",
            vehicleType: "Ferry",
            price: 100000,
            date: new Date().toISOString().split('T')[0],
            updatedBy: user.uid
          }
        ];

        for (const tp of demoTransportPrices) {
          await addDoc(collection(db, 'transport_prices'), {
            ...tp,
            lastUpdated: serverTimestamp()
          });
        }

        setSuccessMessage('Demo data seeded successfully!');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'stations');
      } finally {
        setIsSeeding(false);
      }
    };

    const handleApproveStation = async (stationId: string) => {
      try {
        await updateDoc(doc(db, 'stations', stationId), {
          status: 'approved',
          lastUpdated: serverTimestamp()
        });
        setSuccessMessage('Station approved successfully!');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `stations/${stationId}`);
      }
    };

    const handleDisapproveStation = async (stationId: string) => {
      try {
        await updateDoc(doc(db, 'stations', stationId), {
          status: 'disapproved',
          lastUpdated: serverTimestamp()
        });
        setSuccessMessage('Station disapproved.');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `stations/${stationId}`);
      }
    };

    const handleSort = (field: 'name' | 'district' | 'isVerified') => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    };

    const sortedStations = [...stations].filter(station => {
      const matchesSearch = (station.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (station.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (station.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = selectedDistrict === 'All' || station.district === selectedDistrict;
      const matchesBrand = selectedBrand === 'All' || station.brand === selectedBrand;
      const matchesVerified = !showVerifiedOnly || station.isVerified;
      const hasFuelType = (station.fuelTypes || []).includes(selectedFuel);
      
      // Filter by status based on active tab
      const matchesStatus = activeTab === 'stations' 
        ? (station.status === 'approved' || !station.status)
        : activeTab === 'submitted_stations'
          ? (station.status === 'pending' || station.status === 'disapproved')
          : true;
      
      return matchesSearch && matchesDistrict && matchesBrand && matchesVerified && hasFuelType && matchesStatus;
    }).sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'name') {
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
      } else if (sortField === 'district') {
        aValue = a.district?.toLowerCase() || '';
        bValue = b.district?.toLowerCase() || '';
      } else if (sortField === 'isVerified') {
        aValue = a.isVerified ? 1 : 0;
        bValue = b.isVerified ? 1 : 0;
      } else if (sortField === 'price' as any) {
        aValue = (a.prices || {})[selectedFuel] || Infinity;
        bValue = (b.prices || {})[selectedFuel] || Infinity;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const filteredAndSortedHistory = React.useMemo(() => {
    let result = [...rawPriceHistory];
    if (historyFuelFilter !== 'All') {
      result = result.filter(h => h.fuelType === historyFuelFilter);
    }
    result.sort((a, b) => {
      let comparison = 0;
      if (historySortField === 'timestamp') {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        comparison = timeA - timeB;
      } else if (historySortField === 'price') {
        comparison = (a.price || 0) - (b.price || 0);
      } else if (historySortField === 'fuelType') {
        comparison = (a.fuelType || '').localeCompare(b.fuelType || '');
      }
      return historySortDirection === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [rawPriceHistory, historyFuelFilter, historySortField, historySortDirection]);

  if (profile?.role !== 'admin') {
      return <div className="p-8 text-center text-red-600">Access Denied. Admin privileges required.</div>;
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const districts = ['All', ...SIERRA_LEONE_DISTRICTS];
    const brands = ['All', ...Array.from(new Set(stations.map(s => s.brand || 'Unknown')))].sort();
    const fuelTypes = ['Petrol', 'Diesel', 'Kerosene'];

    return (
      <div className="flex min-h-screen bg-surface-50">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`bg-surface-900 text-gray-400 transition-all duration-300 flex flex-col fixed md:sticky top-0 h-screen z-50 md:z-40 w-64 ${
            isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
          } ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded-lg">
                  <Fuel className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg tracking-tight">SL Fuel Monitor</span>
              </div>
            )}
            <Button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              showNotification={false}
              variant="ghost"
              className="hidden md:flex p-1.5 rounded-full bg-surface-800 hover:bg-surface-700 text-white transition-colors items-center justify-center"
            >
              {isSidebarCollapsed ? <ChevronDown className="w-4 h-4 rotate-270" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
            </Button>
            <Button 
              onClick={() => setIsMobileMenuOpen(false)}
              showNotification={false}
              variant="ghost"
              className="md:hidden p-1.5 rounded-full bg-surface-800 hover:bg-surface-700 text-white transition-colors items-center justify-center"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="mb-4 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {(!isSidebarCollapsed || isMobileMenuOpen) && 'Main Menu'}
            </div>
            
            <Button 
              onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'overview' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'overview' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <LayoutDashboard className={`w-5 h-5 shrink-0 ${activeTab === 'overview' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Overview</span>}
            </Button>

            <Button 
              onClick={() => { setActiveTab('stations'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'stations' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'stations' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Building2 className={`w-5 h-5 shrink-0 ${activeTab === 'stations' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Stations</span>}
            </Button>

            <Button 
              onClick={() => { setActiveTab('submitted_stations'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'submitted_stations' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'submitted_stations' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Clock className={`w-5 h-5 shrink-0 ${activeTab === 'submitted_stations' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Submitted Stations</span>}
            </Button>

            <Button 
              onClick={() => { setActiveTab('map'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'map' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'map' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <MapPin className={`w-5 h-5 shrink-0 ${activeTab === 'map' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Map View</span>}
            </Button>

            <Button 
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'users' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'users' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Users className={`w-5 h-5 shrink-0 ${activeTab === 'users' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Members</span>}
            </Button>

            <Button 
              onClick={() => { setActiveTab('prices'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'prices' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'prices' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <TrendingUp className={`w-5 h-5 shrink-0 ${activeTab === 'prices' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Official Prices</span>}
            </Button>

            <Button 
              onClick={() => { setActiveTab('transport'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'transport' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'transport' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Bus className={`w-5 h-5 shrink-0 ${activeTab === 'transport' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Transport</span>}
            </Button>

            <Button 
              onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'messages' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'messages' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <MessageSquare className={`w-5 h-5 shrink-0 ${activeTab === 'messages' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Messages</span>}
            </Button>

            <Button 
              onClick={() => { setActiveTab('reviews'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'reviews' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'reviews' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Star className={`w-5 h-5 shrink-0 ${activeTab === 'reviews' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Review Moderation</span>}
            </Button>

            <Button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              showNotification={false}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                activeTab === 'settings' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {activeTab === 'settings' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              <Settings className={`w-5 h-5 shrink-0 ${activeTab === 'settings' ? 'text-primary' : 'group-hover:text-white'}`} />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm">Settings</span>}
            </Button>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-surface-800">
            <Button 
              onClick={() => window.location.href = '#/'}
              showNotification={false}
              variant="ghost"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-medium text-sm">Sign Out</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setIsMobileMenuOpen(true)}
                showNotification={false}
                className="md:hidden p-2 -ml-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center gap-6">
              <Button 
                showNotification={false}
                className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
              >
                <Shield className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-8">
            {activeTab === 'transport' && (
              <AdminTransportPrices />
            )}

            {activeTab === 'messages' && (
              <AdminMessages />
            )}

            {activeTab === 'reviews' && (
              <AdminReviews />
            )}

            {activeTab === 'settings' && (
              <AdminSettings />
            )}

            {activeTab === 'map' && (
              <div className="space-y-6">
                <AdminStationMap stations={stations} />
                
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-surface-900">Google Maps API Environment</h3>
                      <p className="text-sm text-gray-500">Configure Google Maps integration for advanced mapping features.</p>
                    </div>
                    {isGoogleMapsConfigured && (
                      <div className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <CheckCircle className="w-3 h-3" /> Configured
                      </div>
                    )}
                  </div>
                  
                  <div className="p-8 space-y-6">
                    {googleMapsMessage && (
                      <div className={`p-4 rounded-2xl flex items-start gap-3 ${
                        googleMapsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {googleMapsMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                        <p className="text-sm font-medium">{googleMapsMessage.text}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Google Maps API Key
                        </label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="password"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                            placeholder="Enter your Google Maps API Key"
                            value={googleMapsApiKey}
                            onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                          This key is used for Google Maps services. Keep it secret and restricted to your domain.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveGoogleMaps}
                        loading={isSavingGoogleMaps}
                        variant="primary"
                        notificationMessage="Google Maps configuration saved successfully"
                        className="px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Save Configuration
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prices' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-surface-900">Official Fuel Prices</h2>
                    <p className="text-gray-500 mt-1">Set the government regulated fuel prices for the country</p>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {['Petrol', 'Diesel', 'Kerosene'].map(fuel => (
                        <div key={fuel} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary/30 transition-all group">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-primary flex items-center justify-center">
                              <Fuel className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-lg">Official</span>
                          </div>
                          <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{fuel}</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Le</span>
                            <input
                              type="number"
                              className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-xl font-bold text-surface-900 shadow-sm"
                              value={govPrices[fuel] || ''}
                              onChange={e => setGovPrices({...govPrices, [fuel]: Number(e.target.value)})}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex justify-end">
                      <Button
                        onClick={handleUpdateGovPrice}
                        loading={isUpdatingGovPrice}
                        variant="primary"
                        notificationMessage="Official fuel prices updated successfully"
                        className="px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-5 h-5" />
                        <span>Save Official Prices</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-surface-900 to-surface-800 rounded-3xl p-8 text-white shadow-2xl shadow-slate-200">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome back, {profile?.name?.split(' ')[0]}! 👋</h2>
                      <p className="text-slate-400 max-w-md leading-relaxed">
                        Here's what's happening with the SL Fuel Monitor platform today. You have {stations.filter(s => !s.isVerified).length} stations waiting for verification.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                        <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">System Status</div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          <span className="text-sm font-bold">All Systems Operational</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">+12%</span>
                    </div>
                    <div className="text-3xl font-bold text-surface-900 mb-1">{stations.filter(s => s.isVerified).length}</div>
                    <div className="text-sm font-medium text-gray-500">Verified Stations</div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Clock className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">Priority</span>
                    </div>
                    <div className="text-3xl font-bold text-surface-900 mb-1">{stations.filter(s => !s.isVerified).length}</div>
                    <div className="text-sm font-medium text-gray-500">Pending Verifications</div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Active</span>
                    </div>
                    <div className="text-3xl font-bold text-surface-900 mb-1">{users.length}</div>
                    <div className="text-sm font-medium text-gray-500">Total Members</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pending Verifications List */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-bold text-surface-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-500" />
                        Station Verifications
                      </h3>
                      <Button
                        onClick={() => setActiveTab('stations')}
                        showNotification={false}
                        variant="ghost"
                        className="text-xs font-bold text-primary hover:underline uppercase tracking-wider p-0 h-auto min-w-0"
                      >
                        View All
                      </Button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {stations.filter(s => !s.isVerified).length > 0 ? (
                        stations.filter(s => !s.isVerified).slice(0, 5).map(station => (
                          <div 
                            key={station.id} 
                            className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer"
                            onClick={() => setSelectedStation(station)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-surface-900">{station.name}</h4>
                                <p className="text-xs text-gray-500">{station.district} • {station.brand}</p>
                              </div>
                            </div>
                            <div className="p-2 text-gray-400 group-hover:text-primary group-hover:bg-emerald-50 rounded-lg transition-all">
                              <Eye className="w-5 h-5" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-emerald-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8" />
                          </div>
                          <p className="text-sm font-medium text-gray-500">All stations are verified!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Maintenance Card */}
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                      <Database className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 mb-2">Maintenance</h3>
                    <p className="text-sm text-gray-500 mb-8 max-w-xs">
                      Need to test the platform with sample data? Seed the database with demo stations and members.
                    </p>
                    <Button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isSeeding}
                      variant="primary"
                      className="w-full py-4 bg-surface-900 text-white rounded-2xl font-bold hover:bg-surface-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                      notificationMessage="Preparing to seed demo data..."
                    >
                      {isSeeding ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Seeding...</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-5 h-5" />
                          <span>Seed Demo Data</span>
                        </>
                      )}
                    </Button>
                    
                    {successMessage && (
                      <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-sm font-medium w-full animate-in zoom-in-95 duration-300">
                        {successMessage}
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirm Modal */}
                {showConfirmModal && (
                  <div className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setShowConfirmModal(false)}>
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                        <Clock className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-surface-900 mb-2">Confirm Seeding</h3>
                      <p className="text-gray-600 mb-8 leading-relaxed">
                        This action will populate the database with demo stations and members. This is intended for testing purposes. Do you want to continue?
                      </p>
                      <div className="flex gap-4">
                        <Button
                          onClick={() => setShowConfirmModal(false)}
                          variant="ghost"
                          className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                          disableAfterClick={false}
                          showNotification={false}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={seedDemoData}
                          variant="primary"
                          className="flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                          notificationMessage="Seeding demo data..."
                        >
                          Yes, Seed Data
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-surface-900">User Management</h2>
                      <p className="text-gray-500 mt-1">Manage user roles and platform access</p>
                    </div>
                    <div className="bg-emerald-50 text-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {users.length} Total Users
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User Information</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Joined Date</th>
                          <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.slice(0, visibleUsersCount).map(u => (
                          <tr 
                            key={u.id} 
                            className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                            onClick={() => setSelectedUser(u)}
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary font-bold overflow-hidden">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    u.name?.charAt(0) || 'U'
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-surface-900">{u.name}</div>
                                  <div className="text-xs text-gray-500 font-medium">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                u.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                                u.role === 'station_owner' ? 'bg-emerald-50 text-primary' :
                                'bg-gray-50 text-gray-600'
                              }`}>
                                {u.role?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-sm font-medium text-gray-500">
                              {u.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  onClick={() => setSelectedUser(u)}
                                  showNotification={false}
                                  variant="ghost"
                                  className="p-2 rounded-xl transition-all"
                                  title="View Details"
                                >
                                  <Eye className="w-5 h-5 text-emerald-600" />
                                </Button>
                                <select
                                  className="bg-gray-50 border-none rounded-xl text-xs font-bold uppercase tracking-wider px-4 py-2 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                  value={u.role}
                                  onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                  disabled={u.email?.toLowerCase() === 'kharifakumara16@gmail.com' || u.email?.toLowerCase() === 'kharifaabdulaikumara1@gmail.com'}
                                >
                                  <option value="user">User</option>
                                  <option value="station_owner">Station Owner</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <Button
                                  onClick={() => handleDeleteUser(u.id)}
                                  notificationMessage="User deleted successfully"
                                  variant="ghost"
                                  className="p-2 rounded-xl transition-all disabled:opacity-30"
                                  title="Delete Member"
                                  disabled={u.email?.toLowerCase() === 'kharifakumara16@gmail.com' || u.email?.toLowerCase() === 'kharifaabdulaikumara1@gmail.com'}
                                >
                                  <Trash2 className="w-5 h-5 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {users.length > visibleUsersCount && (
                    <div className="p-6 border-t border-gray-100 flex justify-center">
                      <Button
                        onClick={() => setVisibleUsersCount(prev => prev + 8)}
                        variant="secondary"
                        className="px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm flex items-center gap-2 text-sm"
                        disableAfterClick={false}
                        showNotification={false}
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        Show More Members
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(activeTab === 'stations' || activeTab === 'submitted_stations') && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-8 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h2 className="text-2xl font-bold text-surface-900">
                          {activeTab === 'stations' ? 'Station Verification' : 'Submitted Stations'}
                        </h2>
                        <p className="text-gray-500 mt-1">
                          {activeTab === 'stations' 
                            ? 'Manage and verify fuel stations across the country' 
                            : 'Review and approve newly submitted fuel stations'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {activeTab === 'stations' ? (
                          <>
                            <div className="bg-emerald-50 text-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {stations.filter(s => (s.status === 'approved' || !s.status) && s.isVerified).length} Verified
                            </div>
                            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {stations.filter(s => (s.status === 'approved' || !s.status) && !s.isVerified).length} Pending Verification
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {stations.filter(s => s.status === 'pending').length} Pending Review
                            </div>
                            <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              {stations.filter(s => s.status === 'disapproved').length} Disapproved
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedStationIds.length > 0 && (
                      <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
                            {selectedStationIds.length}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-surface-900">Stations Selected</p>
                            <p className="text-xs text-gray-500 font-medium">Choose an action to apply to all selected stations</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            onClick={handleBulkVerify}
                            disabled={isBulkActionLoading}
                            variant="primary"
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            notificationMessage="Verifying selected stations..."
                          >
                            <CheckCircle className="w-4 h-4" /> Verify
                          </Button>
                          <Button
                            onClick={() => handleBulkSuspend(true)}
                            disabled={isBulkActionLoading}
                            variant="secondary"
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            notificationMessage="Suspending selected stations..."
                          >
                            <Slash className="w-4 h-4" /> Suspend
                          </Button>
                          <Button
                            onClick={() => handleBulkSuspend(false)}
                            disabled={isBulkActionLoading}
                            variant="secondary"
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            notificationMessage="Unsuspending selected stations..."
                          >
                            <RotateCcw className="w-4 h-4" /> Unsuspend
                          </Button>
                          <Button
                            onClick={handleBulkDelete}
                            disabled={isBulkActionLoading}
                            variant="danger"
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            notificationMessage="Deleting selected stations..."
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </Button>
                          <Button
                            onClick={() => setSelectedStationIds([])}
                            showNotification={false}
                            variant="ghost"
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all h-auto min-w-0"
                            title="Clear Selection"
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          placeholder="Search stations..."
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <select
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium appearance-none cursor-pointer"
                          value={selectedFuel}
                          onChange={(e) => setSelectedFuel(e.target.value)}
                        >
                          {fuelTypes.map(f => <option key={f} value={f}>{f === 'All' ? 'All Fuel Types' : f}</option>)}
                        </select>
                      </div>

                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <select
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium appearance-none cursor-pointer"
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                        >
                          {districts.map(d => <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>)}
                        </select>
                      </div>

                      <div className="relative group">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <select
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium appearance-none cursor-pointer"
                          value={selectedBrand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                        >
                          {brands.map(b => <option key={b} value={b}>{b === 'All' ? 'All Brands' : b}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center cursor-pointer group gap-3">
                          <div className={`w-10 h-6 rounded-full transition-all duration-300 relative ${showVerifiedOnly ? 'bg-primary' : 'bg-gray-200'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${showVerifiedOnly ? 'translate-x-4' : ''}`} />
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={showVerifiedOnly}
                            onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                          />
                          <span className="text-sm font-semibold text-gray-600 group-hover:text-surface-900 transition-colors">Verified Only</span>
                        </label>
                        <Button
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedFuel('Petrol');
                            setSelectedDistrict('All');
                            setSelectedBrand('All');
                            setShowVerifiedOnly(false);
                          }}
                          showNotification={false}
                          variant="unstyled"
                          className="text-sm font-bold text-primary hover:text-primary-hover transition-colors p-0 h-auto min-w-0"
                        >
                          Clear Filters
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        Showing <span className="text-surface-900 font-bold">{sortedStations.length}</span> stations
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-8 py-5 text-left w-10">
                            <Button 
                              onClick={toggleAllStationsSelection}
                              disabled={isBulkActionLoading}
                              showNotification={false}
                              variant="unstyled"
                              className="p-1 text-gray-400 hover:text-primary transition-colors disabled:opacity-50 h-auto min-w-0"
                            >
                              {sortedStations.slice(0, visibleStationsCount).every(s => selectedStationIds.includes(s.id)) ? (
                                <CheckSquare className="w-5 h-5 text-primary" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </Button>
                          </th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                            <div className="flex items-center gap-2">
                              Station Name
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Brand</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedStations.slice(0, visibleStationsCount).map((s, index) => (
                          <tr 
                            key={s.id} 
                            className={`hover:bg-gray-50/50 transition-colors group cursor-pointer ${selectedStationIds.includes(s.id) ? 'bg-primary/5' : ''}`}
                            onClick={() => setSelectedStation(s)}
                          >
                            <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                              <Button 
                                onClick={() => toggleStationSelection(s.id)}
                                disabled={isBulkActionLoading}
                                showNotification={false}
                                variant="unstyled"
                                className="p-1 text-gray-400 hover:text-primary transition-colors disabled:opacity-50 h-auto min-w-0"
                              >
                                {selectedStationIds.includes(s.id) ? (
                                  <CheckSquare className="w-5 h-5 text-primary" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </Button>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary font-bold">
                                  {s.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-surface-900">{s.name}</div>
                                  <div className="text-xs text-gray-500 font-medium">{s.fuelTypes?.join(', ')}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                                {s.brand}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {s.district}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col gap-1.5">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                                  (s.status === 'approved' || !s.status)
                                    ? s.isVerified 
                                      ? 'bg-emerald-50 text-primary' 
                                      : 'bg-amber-50 text-amber-700'
                                    : s.status === 'pending'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    (s.status === 'approved' || !s.status)
                                      ? s.isVerified ? 'bg-primary' : 'bg-amber-500 animate-pulse'
                                      : s.status === 'pending' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                  }`} />
                                  {(s.status === 'approved' || !s.status) 
                                    ? (s.isVerified ? 'Verified' : 'Pending Verification')
                                    : s.status === 'pending' ? 'Pending Review' : 'Disapproved'}
                                </div>
                                {s.isSuspended && (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
                                    <Slash className="w-3 h-3" />
                                    Suspended
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right relative">
                              <div className="flex justify-end">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownId(activeDropdownId === s.id ? null : s.id);
                                  }}
                                  showNotification={false}
                                  variant="ghost"
                                  className="p-2 rounded-xl transition-all"
                                >
                                  <MoreVertical className="w-5 h-5 text-gray-400" />
                                </Button>

                                {activeDropdownId === s.id && (
                                  <div className={`absolute right-8 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in-95 duration-200 ${
                                    index > sortedStations.slice(0, visibleStationsCount).length - 3 && sortedStations.slice(0, visibleStationsCount).length > 3
                                      ? 'bottom-full mb-2' 
                                      : 'top-12'
                                  }`}>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStation(s);
                                        setActiveDropdownId(null);
                                      }}
                                      variant="ghost"
                                      className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-none"
                                      disableAfterClick={false}
                                      showNotification={false}
                                    >
                                      <Eye className="w-4 h-4 text-emerald-500" /> View Details
                                    </Button>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditStation(s);
                                        setActiveDropdownId(null);
                                      }}
                                      variant="ghost"
                                      className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-none"
                                      disableAfterClick={false}
                                      showNotification={false}
                                    >
                                      <Edit2 className="w-4 h-4 text-amber-500" /> Edit Station
                                    </Button>

                                    {activeTab === 'submitted_stations' && (
                                      <>
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApproveStation(s.id);
                                            setActiveDropdownId(null);
                                          }}
                                          variant="ghost"
                                          className="w-full px-4 py-2.5 text-left text-sm font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors rounded-none"
                                          notificationMessage="Approving station..."
                                        >
                                          <CheckCircle className="w-4 h-4" /> Approve Station
                                        </Button>
                                        {s.status === 'pending' && (
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDisapproveStation(s.id);
                                              setActiveDropdownId(null);
                                            }}
                                            variant="ghost"
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors rounded-none"
                                            notificationMessage="Disapproving station..."
                                          >
                                            <XCircle className="w-4 h-4" /> Disapprove Station
                                          </Button>
                                        )}
                                      </>
                                    )}

                                    {activeTab === 'stations' && (
                                      <>
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpdateStationVerification(s.id, !s.isVerified);
                                            setActiveDropdownId(null);
                                          }}
                                          variant="ghost"
                                          className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-3 transition-colors hover:bg-gray-50 rounded-none ${
                                            s.isVerified ? 'text-rose-600' : 'text-emerald-600'
                                          }`}
                                          notificationMessage={s.isVerified ? "Revoking verification..." : "Verifying station..."}
                                        >
                                          {s.isVerified ? (
                                            <><XCircle className="w-4 h-4" /> Revoke Verification</>
                                          ) : (
                                            <><CheckCircle className="w-4 h-4" /> Verify Station</>
                                          )}
                                        </Button>

                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpdateStationPublished(s.id, s.isPublished === false);
                                            setActiveDropdownId(null);
                                          }}
                                          variant="ghost"
                                          className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-3 transition-colors hover:bg-gray-50 rounded-none ${
                                            s.isPublished === false ? 'text-emerald-600' : 'text-amber-600'
                                          }`}
                                          notificationMessage={s.isPublished === false ? "Publishing station..." : "Unpublishing station..."}
                                        >
                                          {s.isPublished === false ? (
                                            <><Globe className="w-4 h-4" /> Publish Station</>
                                          ) : (
                                            <><XCircle className="w-4 h-4" /> Unpublish Station</>
                                          )}
                                        </Button>

                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleSuspend(s.id, s.isSuspended);
                                            setActiveDropdownId(null);
                                          }}
                                          variant="ghost"
                                          className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-3 transition-colors hover:bg-gray-50 rounded-none ${
                                            s.isSuspended ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-600 hover:text-amber-700'
                                          }`}
                                          notificationMessage={s.isSuspended ? "Unsuspending station..." : "Suspending station..."}
                                        >
                                          {s.isSuspended ? (
                                            <><RotateCcw className="w-4 h-4" /> Unsuspend</>
                                          ) : (
                                            <><Slash className="w-4 h-4" /> Suspend Station</>
                                          )}
                                        </Button>

                                        {s.status === 'approved' && (
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDisapproveStation(s.id);
                                              setActiveDropdownId(null);
                                            }}
                                            variant="ghost"
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors rounded-none"
                                            notificationMessage="Revoking approval..."
                                          >
                                            <XCircle className="w-4 h-4" /> Revoke Approval
                                          </Button>
                                        )}
                                      </>
                                    )}

                                    <div className="my-1 border-t border-gray-50"></div>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteStation(s.id);
                                        setActiveDropdownId(null);
                                      }}
                                      variant="ghost"
                                      className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors rounded-none"
                                      notificationMessage="Deleting station..."
                                    >
                                      <Trash2 className="w-4 h-4" /> Delete Station
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {sortedStations.length > visibleStationsCount && (
                    <div className="p-6 border-t border-gray-100 flex justify-center">
                      <Button
                        onClick={() => setVisibleStationsCount(prev => prev + 8)}
                        variant="secondary"
                        className="px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm flex items-center gap-2 text-sm"
                        disableAfterClick={false}
                        showNotification={false}
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        Show More Stations
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

      {/* Station Details Modal */}
      {selectedStation && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setSelectedStation(null)}>
          <div className="bg-white rounded-[2.5rem] max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-primary flex-shrink-0 flex items-center justify-center">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-surface-900 break-words">{selectedStation.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider truncate max-w-[80px] sm:max-w-none">{selectedStation.brand}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      selectedStation.isVerified ? 'bg-emerald-100 text-primary' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedStation.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedStation(null);
                  setHistoryLimit(30);
                }}
                showNotification={false}
                className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400 flex-shrink-0 bg-transparent border-none shadow-none h-auto min-w-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <span className="text-sm text-gray-500 font-medium">Added On</span>
                        <span className="text-sm font-bold text-surface-900">
                          {selectedStation.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <span className="text-sm text-gray-500 font-medium">Last Updated</span>
                        <span className="text-sm font-bold text-surface-900">
                          {selectedStation.lastUpdated?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Location & Contact</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                          <MapPin className="w-3 h-3" /> District
                        </div>
                        <div className="text-sm font-bold text-surface-900">{selectedStation.district}</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Address</div>
                        <div className="text-sm font-bold text-surface-900">{selectedStation.location}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Contact</div>
                          <div className="text-sm font-bold text-surface-900">{selectedStation.contact || 'N/A'}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Hours</div>
                          <div className="text-sm font-bold text-surface-900">
                            {Array.isArray(selectedStation.operatingHours) ? (
                              <div className="space-y-1">
                                {selectedStation.operatingHours.map((h: string, i: number) => (
                                  <div key={i}>{h}</div>
                                ))}
                              </div>
                            ) : (
                              selectedStation.operatingHours || 'N/A'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Current Fuel Prices</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {['Petrol', 'Diesel', 'Kerosene'].map((fuel) => (
                        <div key={fuel} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              selectedStation.fuelTypes?.includes(fuel) ? 'bg-emerald-50 text-primary' : 'bg-gray-50 text-gray-300'
                            }`}>
                              <Fuel className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">{fuel}</span>
                          </div>
                          <div className="text-lg font-bold text-surface-900">
                            {selectedStation.prices?.[fuel] ? `Le ${selectedStation.prices[fuel].toLocaleString()}` : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price History</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setHistoryViewMode('chart')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${historyViewMode === 'chart' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Chart
                          </button>
                          <button
                            onClick={() => setHistoryViewMode('table')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${historyViewMode === 'table' ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Table
                          </button>
                        </div>
                        <Button
                          onClick={() => seedStationHistory(selectedStation.id)}
                          notificationMessage="Seeding station history data..."
                          variant="unstyled"
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest flex items-center gap-1 p-0 h-auto min-w-0"
                        >
                          <Database className="w-3 h-3" /> Seed Data
                        </Button>
                      </div>
                    </div>

                    {historyViewMode === 'table' && (
                      <div className="mb-4 flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-2xl">
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
                      </div>
                    )}

                    <div className={`bg-gray-50 rounded-3xl border border-gray-100 ${historyViewMode === 'chart' ? 'p-6 h-80' : 'overflow-hidden max-h-96 overflow-y-auto'}`}>
                      {historyLoading && rawPriceHistory.length === 0 ? (
                        <div className="flex justify-center items-center h-full p-12">
                          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                      ) : rawPriceHistory.length > 0 ? (
                        historyViewMode === 'chart' ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={priceHistory}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis 
                                dataKey="date" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                dx={-10}
                              />
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                labelStyle={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}
                              />
                              <Legend 
                                verticalAlign="top" 
                                align="right" 
                                iconType="circle"
                                wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                              />
                              <Line name="Petrol" type="monotone" dataKey="Petrol" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                              <Line name="Diesel" type="monotone" dataKey="Diesel" stroke="var(--color-surface-900)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                              <Line name="Kerosene" type="monotone" dataKey="Kerosene" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                              <tr>
                                <th 
                                  className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-200 transition-colors"
                                  onClick={() => {
                                    setHistorySortField('timestamp');
                                    setHistorySortDirection(prev => historySortField === 'timestamp' && prev === 'desc' ? 'asc' : 'desc');
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    Date
                                    {historySortField === 'timestamp' && (historySortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                  </div>
                                </th>
                                <th 
                                  className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-200 transition-colors"
                                  onClick={() => {
                                    setHistorySortField('fuelType');
                                    setHistorySortDirection(prev => historySortField === 'fuelType' && prev === 'asc' ? 'desc' : 'asc');
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    Fuel Type
                                    {historySortField === 'fuelType' && (historySortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                  </div>
                                </th>
                                <th 
                                  className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-200 transition-colors"
                                  onClick={() => {
                                    setHistorySortField('price');
                                    setHistorySortDirection(prev => historySortField === 'price' && prev === 'desc' ? 'asc' : 'desc');
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    Price (SLL)
                                    {historySortField === 'price' && (historySortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {filteredAndSortedHistory.map((item, index) => (
                                <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                                  <td className="p-4 text-sm font-medium text-gray-900">
                                    {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown Date'}
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                                      item.fuelType === 'Petrol' ? 'bg-primary/10 text-primary' : 
                                      item.fuelType === 'Diesel' ? 'bg-surface-900/10 text-surface-900' : 
                                      'bg-fuchsia-100 text-fuchsia-700'
                                    }`}>
                                      {item.fuelType}
                                    </span>
                                  </td>
                                  <td className="p-4 text-sm font-bold text-gray-900">
                                    Le {item.price?.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                              {filteredAndSortedHistory.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="p-8 text-center text-sm font-medium text-gray-500">
                                    No history matches the selected filters.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        )
                      ) : (
                        <div className="flex flex-col justify-center items-center h-full text-gray-400 p-12">
                          <History className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-widest">No history available</p>
                          <p className="text-[10px] mt-1">Click "Seed Data" to generate history</p>
                        </div>
                      )}
                    </div>
                    {hasMoreHistory && rawPriceHistory.length > 0 && (
                      <div className="mt-4 flex justify-center">
                        <Button
                          onClick={() => setHistoryLimit(prev => prev + 30)}
                          loading={historyLoading}
                          showNotification={false}
                          variant="unstyled"
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest flex items-center gap-1 p-0 h-auto min-w-0"
                        >
                          {!historyLoading && <History className="w-3 h-3" />}
                          {historyLoading ? 'Loading...' : 'Load More History'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-between gap-4 bg-gray-50/50">
              <div className="flex gap-2 sm:gap-3">
                <Button
                  onClick={() => handleDeleteStation(selectedStation.id)}
                  variant="danger"
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  notificationMessage="Deleting station..."
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
                <Button
                  onClick={() => handleToggleSuspend(selectedStation.id, selectedStation.isSuspended)}
                  variant="secondary"
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  notificationMessage={selectedStation.isSuspended ? "Unsuspending station..." : "Suspending station..."}
                >
                  {selectedStation.isSuspended ? (
                    <><RotateCcw className="w-4 h-4" /> Unsuspend</>
                  ) : (
                    <><Slash className="w-4 h-4" /> Suspend</>
                  )}
                </Button>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button
                  onClick={() => {
                    handleUpdateStationPublished(selectedStation.id, selectedStation.isPublished === false ? true : false);
                    setSelectedStation(null);
                  }}
                  variant={selectedStation.isPublished === false ? "primary" : "secondary"}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  notificationMessage={selectedStation.isPublished === false ? "Publishing station..." : "Unpublishing station..."}
                >
                  {selectedStation.isPublished === false ? (
                    <><Eye className="w-4 h-4" /> Publish</>
                  ) : (
                    <><Eye className="w-4 h-4" /> Unpublish</>
                  )}
                </Button>
                <Button
                  onClick={() => startEditStation(selectedStation)}
                  variant="secondary"
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  disableAfterClick={false}
                  showNotification={false}
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </Button>
                <Button
                  onClick={() => {
                    handleUpdateStationVerification(selectedStation.id, !selectedStation.isVerified);
                    setSelectedStation(null);
                  }}
                  variant={selectedStation.isVerified ? "danger" : "primary"}
                  className="flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold transition-all shadow-lg text-sm sm:text-base"
                  notificationMessage={selectedStation.isVerified ? "Revoking verification..." : "Verifying station..."}
                >
                  {selectedStation.isVerified ? 'Revoke' : 'Verify'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Station Modal */}
      {isEditingStation && editFormData && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300" onClick={cancelEditStation}>
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-surface-900">Edit Station</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Update station details and information</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setIsEditingStation(false);
                  setEditFormData(null);
                }}
                showNotification={false}
                className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400 bg-transparent border-none shadow-none h-auto min-w-0"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Station Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-surface-900"
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Brand</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-surface-900 appearance-none"
                    value={editFormData.brand}
                    onChange={e => setEditFormData({ ...editFormData, brand: e.target.value })}
                  >
                    <option value="NP">NP</option>
                    <option value="Leonco">Leonco</option>
                    <option value="Total">Total</option>
                    <option value="Conex">Conex</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">District</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-surface-900 appearance-none"
                    value={editFormData.district}
                    onChange={e => setEditFormData({ ...editFormData, district: e.target.value })}
                  >
                    {SIERRA_LEONE_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Location Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-surface-900"
                    value={editFormData.location}
                    onChange={e => setEditFormData({ ...editFormData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Contact Phone</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-surface-900"
                    value={editFormData.contact}
                    onChange={e => setEditFormData({ ...editFormData, contact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Operating Hours</label>
                  <div className="space-y-2 mt-1">
                    {(Array.isArray(editFormData.operatingHours) ? editFormData.operatingHours : [editFormData.operatingHours || '']).map((hour: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-surface-900"
                          value={hour}
                          onChange={e => {
                            const hours = Array.isArray(editFormData.operatingHours) ? [...editFormData.operatingHours] : [editFormData.operatingHours || ''];
                            hours[index] = e.target.value;
                            setEditFormData({ ...editFormData, operatingHours: hours });
                          }}
                          placeholder="e.g. Mon-Fri: 6:00 AM - 10:00 PM"
                        />
                        {(Array.isArray(editFormData.operatingHours) ? editFormData.operatingHours : []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const hours = (editFormData.operatingHours as string[]).filter((_, i) => i !== index);
                              setEditFormData({ ...editFormData, operatingHours: hours });
                            }}
                            className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const hours = Array.isArray(editFormData.operatingHours) ? [...editFormData.operatingHours] : [editFormData.operatingHours || ''];
                        setEditFormData({ ...editFormData, operatingHours: [...hours, ''] });
                      }}
                      className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline ml-1"
                    >
                      <Plus className="w-3 h-3" /> Add another schedule
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-surface-900"
                    value={editFormData.latitude || ''}
                    onChange={e => setEditFormData({ ...editFormData, latitude: Number(e.target.value) })}
                    placeholder="e.g. 8.481"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-surface-900"
                    value={editFormData.longitude || ''}
                    onChange={e => setEditFormData({ ...editFormData, longitude: Number(e.target.value) })}
                    placeholder="e.g. -13.248"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-surface-900 border-b border-gray-100 pb-2">Fuel Types & Prices</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['Petrol', 'Diesel', 'Kerosene'].map(fuel => (
                    <div key={fuel} className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id={`edit-${fuel}`}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          checked={editFormData.fuelTypes?.includes(fuel)}
                          onChange={e => {
                            const types = [...(editFormData.fuelTypes || [])];
                            if (e.target.checked) {
                              types.push(fuel);
                            } else {
                              const index = types.indexOf(fuel);
                              if (index > -1) types.splice(index, 1);
                            }
                            setEditFormData({ ...editFormData, fuelTypes: types });
                          }}
                        />
                        <label htmlFor={`edit-${fuel}`} className="text-xs font-bold text-gray-600 uppercase tracking-wider">{fuel}</label>
                      </div>
                      {editFormData.fuelTypes?.includes(fuel) && (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Le</span>
                          <input
                            type="number"
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-bold text-surface-900 text-sm"
                            value={editFormData.prices?.[fuel] || ''}
                            onChange={e => setEditFormData({
                              ...editFormData,
                              prices: { ...editFormData.prices, [fuel]: Number(e.target.value) }
                            })}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 flex justify-end gap-4 bg-gray-50/50">
              <Button
                onClick={() => {
                  setIsEditingStation(false);
                  setEditFormData(null);
                }}
                showNotification={false}
                variant="secondary"
                className="px-8 py-4 rounded-2xl font-bold transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                variant="primary"
                notificationMessage="Station details updated successfully"
                className="px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Check className="w-5 h-5" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* View User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 flex-shrink-0 flex items-center justify-center text-primary font-bold text-xl sm:text-2xl overflow-hidden">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    selectedUser.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-lg sm:text-2xl font-black text-surface-900 leading-tight truncate">{selectedUser.name}</h3>
                  <p className="text-gray-500 font-bold uppercase tracking-wider text-[10px] sm:text-xs truncate">{selectedUser.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <Button
                onClick={() => setSelectedUser(null)}
                showNotification={false}
                className="p-2 sm:p-3 hover:bg-white rounded-2xl transition-all shadow-sm group flex-shrink-0 bg-transparent border-none h-auto min-w-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-gray-600" />
              </Button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <p className="font-bold text-surface-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{selectedUser.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                  <p className="font-bold text-surface-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{selectedUser.phoneNumber || 'Not provided'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Joined Date</label>
                  <p className="font-bold text-surface-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedUser.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">User ID</label>
                  <p className="font-mono text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 break-all">{selectedUser.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-surface-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> Notification Preferences
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-600">Email Alerts</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedUser.optInAlerts ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                      {selectedUser.optInAlerts ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-600">SMS Alerts</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedUser.optInSms ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                      {selectedUser.optInSms ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {(selectedUser.alertDistricts?.length > 0 || selectedUser.alertFuelTypes?.length > 0) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-surface-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" /> Alert Subscriptions
                  </h4>
                  <div className="space-y-4">
                    {selectedUser.alertDistricts?.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Districts</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.alertDistricts.map((d: string) => (
                            <span key={d} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedUser.alertFuelTypes?.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fuel Types</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.alertFuelTypes.map((f: string) => (
                            <span key={f} className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-primary shadow-sm">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/50">
              <Button
                onClick={() => {
                  const user = selectedUser;
                  setSelectedUser(null);
                  handleDeleteUser(user.id);
                }}
                disabled={selectedUser.email?.toLowerCase() === 'kharifakumara16@gmail.com' || selectedUser.email?.toLowerCase() === 'kharifaabdulaikumara1@gmail.com'}
                variant="danger"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all disabled:opacity-30 w-full sm:w-auto"
              >
                <Trash2 className="w-5 h-5" />
                Delete Member
              </Button>
              <Button
                onClick={() => setSelectedUser(null)}
                showNotification={false}
                variant="secondary"
                className="px-8 py-4 rounded-2xl font-bold transition-all shadow-sm w-full sm:w-auto"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setUserToDelete(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-surface-900 mb-2">Delete Member?</h3>
              <p className="text-gray-500 font-medium mb-8">
                Are you sure you want to delete <span className="font-bold text-surface-900">{userToDelete.name}</span>? This action cannot be undone and will remove all their profile data.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={confirmDeleteUser}
                  loading={isDeletingUser}
                  variant="danger"
                  notificationMessage="Member deleted successfully"
                  className="w-full py-4 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  Yes, Delete Member
                </Button>
                <Button
                  onClick={() => setUserToDelete(null)}
                  showNotification={false}
                  variant="secondary"
                  className="w-full py-4 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[120] animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-8 right-8 bg-rose-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[120] animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="font-bold">{errorMessage}</span>
          </div>
          <Button 
            onClick={() => setErrorMessage('')} 
            showNotification={false}
            variant="unstyled"
            className="ml-2 hover:bg-white/20 rounded-lg p-1 shrink-0 h-auto min-w-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
