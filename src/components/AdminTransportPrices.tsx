import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp, db, handleFirestoreError, OperationType, where, limit } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bus, Plus, Edit2, Trash2, Search, X, Save, Database, Clock, CheckCircle, TrendingUp, History, Car, Bike, Ship, Truck, Zap, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Button } from './ui/Button';

interface TransportPrice {
  id: string;
  route: string;
  vehicleType: string;
  price: number;
  date: string;
  lastUpdated: any;
  updatedBy: string;
}

interface PriceHistory {
  id: string;
  priceId: string;
  price: number;
  date: string;
  timestamp: any;
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
  const [prices, setPrices] = useState<TransportPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<TransportPrice | null>(null);
  const [viewingPrice, setViewingPrice] = useState<TransportPrice | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyUnsubscribe, setHistoryUnsubscribe] = useState<(() => void) | null>(null);
  const [priceToDelete, setPriceToDelete] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmSeed, setShowConfirmSeed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleType | null>(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    name: '',
    description: '',
    icon: 'Car'
  });

  const [formData, setFormData] = useState({
    route: '',
    vehicleType: 'Car',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

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
        price: price.price.toString(),
        date: price.date || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingPrice(null);
      setFormData({
        route: '',
        vehicleType: 'Car',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const priceData = {
        route: formData.route,
        vehicleType: formData.vehicleType,
        price: Number(formData.price),
        date: formData.date,
        lastUpdated: serverTimestamp(),
        updatedBy: user.uid
      };

      if (editingPrice) {
        await setDoc(doc(db, 'transport_prices', editingPrice.id), priceData, { merge: true });
        
        // Record history if price changed
        if (editingPrice.price !== priceData.price) {
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

  const handleVehicleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle type?')) return;
    try {
      await deleteDoc(doc(db, 'vehicle_types', id));
      setSuccessMessage('Vehicle type deleted successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vehicle_types/${id}`);
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

  const seedDemoData = async () => {
    if (!user) return;
    
    setIsSeeding(true);
    setShowConfirmSeed(false);

    const initialVehicleTypes = ['Car', 'Bus', 'Poda Poda', 'Keke', 'Okada', 'Ferry'];
    
    const demoData = [
      { route: 'Lumley to PZ', vehicleType: 'Car', price: 5000 },
      { route: 'Aberdeen to Congo Cross', vehicleType: 'Keke', price: 3000 },
      { route: 'Juba to Goderich', vehicleType: 'Poda Poda', price: 4000 },
      { route: 'Waterloo to Freetown', vehicleType: 'Bus', price: 15000 },
      { route: 'Lungi to Freetown', vehicleType: 'Ferry', price: 25000 },
      { route: 'Kissy to Shell', vehicleType: 'Okada', price: 6000 },
      { route: 'Murray Town to Wilkinson Road', vehicleType: 'Car', price: 4500 },
      { route: 'Brookfields to New England', vehicleType: 'Keke', price: 2500 },
      { route: 'Hill Station to Regent', vehicleType: 'Car', price: 7000 },
      { route: 'Calaba Town to Wellington', vehicleType: 'Poda Poda', price: 3500 }
    ];

    try {
      const promises: any[] = [];
      
      demoData.forEach(item => {
        const newDocRef = doc(collection(db, 'transport_prices'));
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Add current price
        promises.push(setDoc(newDocRef, {
          ...item,
          date: currentDate,
          lastUpdated: serverTimestamp(),
          updatedBy: user.uid
        }));
        
        // Generate history from Jan 2020 to Jul 2026
        const startYear = 2020;
        const startMonth = 0; // Jan
        const endYear = 2026;
        const endMonth = 6; // Jul
        
        const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
        
        for (let m = 0; m <= totalMonths; m++) {
          const currentYear = startYear + Math.floor((startMonth + m) / 12);
          const currentM = (startMonth + m) % 12;
          
          const historyDate = new Date(currentYear, currentM, 15);
          const dateStr = historyDate.toISOString().split('T')[0];
          
          // Calculate historical price (linear interpolation from 40% to 100% of current price)
          const progress = m / totalMonths;
          let historicalPrice = item.price * (0.4 + 0.6 * progress);
          
          // Add some noise (+/- 10%)
          const noise = 1 + (Math.random() * 0.2 - 0.1);
          historicalPrice = historicalPrice * noise;
          
          // Round to nearest 500
          historicalPrice = Math.round(historicalPrice / 500) * 500;
          
          // Ensure it doesn't drop below a minimum sensible value (e.g., 1000)
          if (historicalPrice < 1000) historicalPrice = 1000;
          
          const historyDocRef = doc(collection(db, 'transport_price_history'));
          
          promises.push(setDoc(historyDocRef, {
            priceId: newDocRef.id,
            price: historicalPrice,
            date: dateStr,
            timestamp: historyDate
          }));
        }
      });

      const chunkSize = 100;
      for (let i = 0; i < promises.length; i += chunkSize) {
        await Promise.all(promises.slice(i, i + chunkSize));
      }

      // Seed vehicle types if empty
      if (vehicleTypes.length === 0) {
        const vehicleData = [
          { name: 'Car', icon: 'Car' },
          { name: 'Bus', icon: 'Bus' },
          { name: 'Poda Poda', icon: 'Bus' },
          { name: 'Keke', icon: 'Zap' },
          { name: 'Okada', icon: 'Bike' },
          { name: 'Ferry', icon: 'Ship' }
        ];
        
        const vehiclePromises = vehicleData.map(item => {
          const docRef = doc(collection(db, 'vehicle_types'));
          return setDoc(docRef, {
            ...item,
            description: `Standard ${item.name} transportation`,
            createdAt: serverTimestamp()
          });
        });
        await Promise.all(vehiclePromises);
      }

      setSuccessMessage('Demo data seeded successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transport_prices');
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredPrices = prices.filter(price => 
    price.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
    price.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setVisibleCount(8);
  }, [searchTerm]);

  if (loading) {
    return <div className="p-8 text-center">Loading transport prices...</div>;
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

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Bus className="w-6 h-6" />
              </div>
              Transport Prices
            </h2>
            <p className="text-gray-500 mt-1">Manage public transportation fares across different routes</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setShowConfirmSeed(true)}
              disabled={isSeeding}
              variant="secondary"
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm disabled:opacity-50"
              showNotification={false}
            >
              <Database className="w-4 h-4" /> 
              {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
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

        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search routes or vehicle types..."
              className="w-full pl-12 pr-4 py-3 bg-white border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Route</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Vehicle Type</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Price (SLL)</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Date</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Last Updated</th>
                <th className="px-8 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPrices.length > 0 ? (
                filteredPrices.slice(0, visibleCount).map(price => (
                  <tr 
                    key={price.id} 
                    className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/transport-prices/${price.id}`)}
                  >
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
                      <div className="text-lg font-bold text-gray-900">Le {price.price.toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-500 font-medium">{price.date || 'N/A'}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {price.lastUpdated?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => handleOpenModal(price)}
                          variant="ghost"
                          className="p-2 rounded-xl transition-all"
                          title="Edit Price"
                          showNotification={false}
                        >
                          <Edit2 className="w-5 h-5 text-emerald-600" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(price.id)}
                          variant="ghost"
                          className="p-2 rounded-xl transition-all"
                          title="Delete Price"
                          notificationMessage="Price deleted successfully"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bus className="w-10 h-10" />
                    </div>
                    <p className="text-gray-500 font-medium">No transport prices found.</p>
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
              Show More Prices
            </Button>
          </div>
        )}
      </div>

      {/* Vehicle Types Section */}
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
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <td colSpan={3} className="px-8 py-10 text-center">
                    <p className="text-gray-500 font-medium">No vehicle types defined.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-300" onClick={handleCloseModal}>
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingPrice ? 'Edit Price' : 'Add New Price'}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Transport Fare Details</p>
              </div>
              <Button onClick={handleCloseModal} variant="unstyled" className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400" showNotification={false}>
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Route Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="e.g., Lumley to PZ"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                    <select
                      required
                      className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    >
                      {vehicleTypes.length > 0 ? (
                        vehicleTypes.map(type => (
                          <option key={type.id} value={type.name}>{type.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="Car">Car</option>
                          <option value="Bus">Bus</option>
                          <option value="Poda Poda">Poda Poda</option>
                          <option value="Keke">Keke</option>
                          <option value="Okada">Okada</option>
                          <option value="Ferry">Ferry</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Price (SLL)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="5000"
                      value={formData.price}
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
                    notificationMessage={editingPrice ? "Updating price..." : "Saving price..."}
                  >
                    <Save className="w-5 h-5" /> 
                    {editingPrice ? 'Update Price' : 'Save Price'}
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
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Price Details</h3>
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
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</label>
                    <div className="text-lg sm:text-xl font-black text-emerald-600">Le {viewingPrice.price.toLocaleString()}</div>
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
                      Price History
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last 20 changes</span>
                  </div>
                  
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
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium">No price history available yet.</p>
                      </div>
                    )}
                  </div>
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
                    notificationMessage="Price deleted successfully"
                  >
                    <Trash2 className="w-5 h-5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmSeed && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300" onClick={() => setShowConfirmSeed(false)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <Database className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Seed Demo Data?</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-8">This will add 10 sample transport price entries to your database. This action is primarily for testing purposes.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => setShowConfirmSeed(false)}
                variant="secondary"
                className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all order-2 sm:order-1"
                showNotification={false}
              >
                Cancel
              </Button>
              <Button
                onClick={seedDemoData}
                variant="primary"
                className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 order-1 sm:order-2"
                notificationMessage="Seeding demo data..."
              >
                Confirm
              </Button>
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
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Delete Transport Price?</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-8">Are you sure you want to delete this transport price entry? This action cannot be undone.</p>
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
                notificationMessage="Deleting transport price..."
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
