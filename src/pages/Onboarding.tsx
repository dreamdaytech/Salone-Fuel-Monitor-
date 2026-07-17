import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  MapPin, 
  Fuel, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  X,
  Smartphone,
  Zap,
  Store,
  Clock,
  Phone,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SIERRA_LEONE_DISTRICTS, FUEL_BRANDS } from '../lib/constants';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Kerosene'];

export default function Onboarding() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common state
  const [optInAlerts, setOptInAlerts] = useState<boolean>(profile?.optInAlerts ?? true);
  const [optInSms, setOptInSms] = useState<boolean>(profile?.optInSms ?? false);

  // User specific state
  const [alertDistricts, setAlertDistricts] = useState<string[]>(profile?.alertDistricts || []);
  const [alertFuelTypes, setAlertFuelTypes] = useState<string[]>(profile?.alertFuelTypes || ['Petrol', 'Diesel']);
  const [priceThresholds, setPriceThresholds] = useState<Record<string, number>>(profile?.priceThresholds || {});

  // Station Owner specific state
  const [stationName, setStationName] = useState('');
  const [stationBrand, setStationBrand] = useState('');
  const [stationDistrict, setStationDistrict] = useState('');
  const [stationLocation, setStationLocation] = useState('');
  const [stationContact, setStationContact] = useState('');
  const [stationOperatingHours, setStationOperatingHours] = useState<string[]>(['24/7']);
  const [stationFuelTypes, setStationFuelTypes] = useState<string[]>(['Petrol', 'Diesel']);
  const [stationPrices, setStationPrices] = useState<Record<string, number>>({});

  const role = profile?.role || 'user';

  const getSteps = () => {
    switch (role) {
      case 'station_owner':
        return [
          { id: 1, title: 'Notifications', icon: Bell },
          { id: 2, title: 'Station Info', icon: Store },
          { id: 3, title: 'Operations', icon: Clock },
          { id: 4, title: 'Initial Prices', icon: Zap }
        ];
      case 'admin':
        return [
          { id: 1, title: 'Notifications', icon: Bell },
          { id: 2, title: 'Admin Setup', icon: ShieldCheck }
        ];
      default: // user
        return [
          { id: 1, title: 'Notifications', icon: Bell },
          { id: 2, title: 'Districts', icon: MapPin },
          { id: 3, title: 'Fuel Types', icon: Fuel },
          { id: 4, title: 'Thresholds', icon: Zap }
        ];
    }
  };

  const steps = getSteps();
  const totalSteps = steps.length;

  const handleNext = () => {
    // Basic validation for station owner
    if (role === 'station_owner') {
      if (step === 2 && (!stationName || !stationBrand || !stationDistrict || !stationLocation)) {
        toast.error('Please fill in all station details');
        return;
      }
      if (step === 3 && (stationFuelTypes.length === 0 || !stationContact || stationOperatingHours.some(h => !h.trim()))) {
        toast.error('Please select fuel types, provide contact info, and fill in operating hours');
        return;
      }
    }

    if (role === 'user') {
      if (step === 2 && alertDistricts.length === 0) {
        toast.error('Please select at least one district to monitor');
        return;
      }
      if (step === 3 && alertFuelTypes.length === 0) {
        toast.error('Please select at least one fuel type');
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create Station if Station Owner (Do this first to avoid partial onboarding)
      if (role === 'station_owner') {
        try {
          await addDoc(collection(db, 'stations'), {
            ownerId: profile?.uid,
            name: stationName,
            brand: stationBrand,
            district: stationDistrict,
            location: stationLocation,
            contact: stationContact,
            operatingHours: stationOperatingHours,
            fuelTypes: stationFuelTypes,
            prices: stationPrices,
            isVerified: false,
            status: 'pending',
            lastUpdated: serverTimestamp(),
            createdAt: serverTimestamp()
          });
          toast.success('Station registered and pending approval!');
        } catch (err: any) {
          console.error('Failed to create station:', err);
          // Re-throw to be caught by outer catch
          handleFirestoreError(err, OperationType.CREATE, 'stations');
        }
      }

      // 2. Update Profile
      const profileUpdates: any = {
        optInAlerts,
        optInSms,
        onboardingCompleted: true
      };

      if (role === 'user') {
        profileUpdates.alertDistricts = alertDistricts;
        profileUpdates.alertFuelTypes = alertFuelTypes;
        profileUpdates.priceThresholds = priceThresholds;
      }

      await updateProfile(profileUpdates);

      toast.success('Onboarding completed! Welcome to SL Fuel Monitor.');
      navigate('/');
    } catch (error: any) {
      console.error('Onboarding failed:', error);
      let errorMessage = 'Failed to save preferences. Please try again.';
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = `Error: ${errorData.error}`;
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const renderStepContent = () => {
    // Step 1 is common for everyone
    if (step === 1) {
      return (
        <motion.div 
          key="step1"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Stay Informed
          </h2>
          <p className="text-gray-500 leading-relaxed">
            How would you like to receive fuel price updates and alerts?
          </p>

          <div className="space-y-4 pt-4">
            <div 
              onClick={() => setOptInAlerts(!optInAlerts)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                optInAlerts ? 'border-primary bg-emerald-50' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                optInAlerts ? 'bg-primary text-white' : 'bg-white text-gray-400'
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-sm ${optInAlerts ? 'text-primary' : 'text-gray-600'}`}>
                  In-App Notifications
                </h3>
                <p className="text-xs text-gray-400">Real-time alerts within the app</p>
              </div>
              {optInAlerts && <CheckCircle className="w-5 h-5 text-primary" />}
            </div>

            <div 
              onClick={() => setOptInSms(!optInSms)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                optInSms ? 'border-primary bg-emerald-50' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                optInSms ? 'bg-primary text-white' : 'bg-white text-gray-400'
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-sm ${optInSms ? 'text-primary' : 'text-gray-600'}`}>
                  SMS Alerts
                </h3>
                <p className="text-xs text-gray-400">Direct updates to your phone</p>
              </div>
              {optInSms && <CheckCircle className="w-5 h-5 text-primary" />}
            </div>
          </div>
        </motion.div>
      );
    }

    // Role-specific steps
    if (role === 'station_owner') {
      if (step === 2) {
        return (
          <motion.div key="so-step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">Station Details</h2>
            <p className="text-gray-500">Tell us about your fuel station.</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Station Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={stationName} 
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold"
                  placeholder="e.g. LeonOil Aberdeen"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={stationBrand} 
                  onChange={(e) => setStationBrand(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold"
                >
                  <option value="">Select Brand</option>
                  {FUEL_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    value={stationDistrict} 
                    onChange={(e) => setStationDistrict(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold"
                  >
                    <option value="">Select District</option>
                    {SIERRA_LEONE_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Location <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={stationLocation} 
                    onChange={(e) => setStationLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold"
                    placeholder="e.g. 123 Main St"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      }
      if (step === 3) {
        return (
          <motion.div key="so-step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">Operations</h2>
            <p className="text-gray-500">How does your station operate?</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    value={stationContact} 
                    onChange={(e) => setStationContact(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold"
                    placeholder="+232..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Operating Hours <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {stationOperatingHours.map((hour, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                            type="text" 
                            value={hour} 
                            onChange={(e) => {
                              const hours = [...stationOperatingHours];
                              hours[index] = e.target.value;
                              setStationOperatingHours(hours);
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold"
                            placeholder="e.g. 24/7 or 6am - 10pm"
                          />
                        </div>
                        {stationOperatingHours.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setStationOperatingHours(prev => prev.filter((_, i) => i !== index))}
                            className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setStationOperatingHours(prev => [...prev, ''])}
                      className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline ml-1"
                    >
                      <Plus className="w-3 h-3" /> Add another schedule
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Fuel Types Available <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {FUEL_TYPES.map(fuel => (
                    <button
                      key={fuel}
                      onClick={() => {
                        setStationFuelTypes(prev => 
                          prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]
                        );
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                        stationFuelTypes.includes(fuel) ? 'bg-primary border-primary text-white' : 'bg-gray-50 border-gray-100 text-gray-500'
                      }`}
                    >
                      {fuel}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      }
      if (step === 4) {
        return (
          <motion.div key="so-step4" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">Initial Prices</h2>
            <p className="text-gray-500">Set your current fuel prices per litre.</p>

            <div className="space-y-4">
              {stationFuelTypes.map(fuel => (
                <div key={fuel} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{fuel} Price (SLL)</label>
                  <input 
                    type="number" 
                    value={stationPrices[fuel] || ''} 
                    onChange={(e) => setStationPrices(prev => ({ ...prev, [fuel]: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold"
                    placeholder="e.g. 30000"
                  />
                </div>
              ))}
              {stationFuelTypes.length === 0 && (
                <p className="text-center text-gray-400 py-8 italic">Go back and select fuel types first.</p>
              )}
            </div>
          </motion.div>
        );
      }
    }

    if (role === 'admin') {
      if (step === 2) {
        return (
          <motion.div key="admin-step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">Admin Command</h2>
            <p className="text-gray-500 leading-relaxed">
              Welcome to the SL Fuel Monitor administration panel. As an admin, you have full control over:
            </p>
            <ul className="space-y-3 pt-4">
              {[
                { icon: Zap, text: 'Official Government Prices' },
                { icon: Store, text: 'Station Verification & Approval' },
                { icon: Bell, text: 'System-wide Notifications' },
                { icon: LayoutDashboard, text: 'Platform Analytics' }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-600">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-primary">
                    <item.icon className="w-4 h-4" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 pt-4 italic">
              Your account has been pre-configured with administrative privileges.
            </p>
          </motion.div>
        );
      }
    }

    // Default User Steps (2, 3, 4)
    if (step === 2) {
      return (
        <motion.div 
          key="step2"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Your Districts <span className="text-rose-500 text-xl">*</span>
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Select the districts you want to monitor for fuel prices.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {SIERRA_LEONE_DISTRICTS.map(district => (
              <button
                key={district}
                onClick={() => {
                  setAlertDistricts(prev => 
                    prev.includes(district) 
                      ? prev.filter(d => d !== district)
                      : [...prev, district]
                  );
                }}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-2 ${
                  alertDistricts.includes(district)
                    ? 'bg-primary border-primary text-white'
                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                }`}
              >
                {district}
              </button>
            ))}
          </div>
        </motion.div>
      );
    }

    if (step === 3) {
      return (
        <motion.div 
          key="step3"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
            <Fuel className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Fuel Types <span className="text-rose-500 text-xl">*</span>
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Which fuel types are you interested in?
          </p>

          <div className="space-y-3 pt-4">
            {FUEL_TYPES.map(fuel => (
              <div 
                key={fuel}
                onClick={() => {
                  setAlertFuelTypes(prev => 
                    prev.includes(fuel) 
                      ? prev.filter(f => f !== fuel)
                      : [...prev, fuel]
                  );
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  alertFuelTypes.includes(fuel) ? 'border-primary bg-emerald-50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <span className={`font-bold ${alertFuelTypes.includes(fuel) ? 'text-primary' : 'text-gray-600'}`}>
                  {fuel}
                </span>
                {alertFuelTypes.includes(fuel) && <CheckCircle className="w-5 h-5 text-primary" />}
              </div>
            ))}
          </div>
        </motion.div>
      );
    }

    if (step === 4) {
      return (
        <motion.div 
          key="step4"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Price Thresholds
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Optional: Set a price below which you'd like to be notified immediately.
          </p>

          <div className="space-y-4 pt-4">
            {alertFuelTypes.map(fuel => (
              <div key={fuel} className="relative">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  {fuel} Threshold (SLL)
                </label>
                <input
                  type="number"
                  value={priceThresholds[fuel] || ''}
                  onChange={(e) => setPriceThresholds(prev => ({
                    ...prev,
                    [fuel]: e.target.value ? Number(e.target.value) : 0
                  }))}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-bold"
                  placeholder="e.g. 25000"
                />
              </div>
            ))}
            {alertFuelTypes.length === 0 && (
              <p className="text-sm text-gray-400 italic text-center py-8">
                Go back and select some fuel types to set thresholds.
              </p>
            )}
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Step {step} of {totalSteps}
            </span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-500/5 border border-gray-100 p-8 sm:p-10 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center gap-4">
            {step > 1 && (
              <Button
                onClick={handleBack}
                variant="unstyled"
                className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-100 text-gray-500 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                showNotification={false}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              loading={isSubmitting}
              className={`flex-[2] py-4 px-6 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:bg-primary-hover transition-all active:scale-95 ${
                step === 1 && totalSteps > 1 ? 'w-full' : ''
              }`}
              showNotification={false}
            >
              {step === totalSteps ? 'Finish Setup' : 'Continue'}
              {step !== totalSteps && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 font-medium">
          You can always change these settings later in your profile.
        </p>
      </div>
    </div>
  );
}
