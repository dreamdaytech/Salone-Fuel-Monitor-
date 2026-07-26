import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoriteContext';
import { User, Mail, Shield, Save, CheckCircle, AlertCircle, Upload, Bell, Phone, ShieldCheck, Heart, Building2, ExternalLink } from 'lucide-react';
import { SIERRA_LEONE_DISTRICTS } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { ConfirmationResult } from 'firebase/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { db, collection, query, onSnapshot } from '../firebase';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Kerosene'];

export default function Profile() {
  const { profile, updateProfile, linkPhone, verifyAndLinkPhone, setupRecaptcha, recaptchaSolved, authError } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [stations, setStations] = useState<any[]>([]);
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [optInAlerts, setOptInAlerts] = useState(profile?.optInAlerts ?? true);
  const [optInEmail, setOptInEmail] = useState(profile?.optInEmail ?? true);
  const [optInFavoriteAlerts, setOptInFavoriteAlerts] = useState(profile?.optInFavoriteAlerts ?? true);
  const [optInSms, setOptInSms] = useState(profile?.optInSms || false);
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [alertDistricts, setAlertDistricts] = useState<string[]>(profile?.alertDistricts || []);
  const [alertFuelTypes, setAlertFuelTypes] = useState<string[]>(profile?.alertFuelTypes || []);
  const [priceThresholds, setPriceThresholds] = useState<Record<string, number>>(profile?.priceThresholds || {});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'stations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStations(list);
    });
    return () => unsubscribe();
  }, []);

  const favoriteStations = stations.filter(station => isFavorite(station.id));

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarUrl(profile.avatarUrl || '');
      setOptInAlerts(profile.optInAlerts ?? true);
      setOptInEmail(profile.optInEmail ?? true);
      setOptInFavoriteAlerts(profile.optInFavoriteAlerts ?? true);
      setOptInSms(profile.optInSms || false);
      setPhoneNumber(profile.phoneNumber || '');
      setAlertDistricts(profile.alertDistricts || []);
      setAlertFuelTypes(profile.alertFuelTypes || []);
      setPriceThresholds(profile.priceThresholds || {});
    }
  }, [profile]);

  useEffect(() => {
    if (phoneNumber !== profile?.phoneNumber && !confirmationResult) {
      const timer = setTimeout(() => {
        setupRecaptcha('recaptcha-container-profile');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phoneNumber, profile?.phoneNumber, confirmationResult]);

  if (!profile) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          if (dataUrl.length > 90000) {
            setMessage({ type: 'error', text: 'Image is too large even after compression. Please choose a smaller image.' });
            return;
          }
          
          setAvatarUrl(dataUrl);
          setMessage(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) return;
    setIsVerifying(true);
    const toastId = toast.loading('Sending verification code...');
    try {
      const result = await linkPhone(phoneNumber, 'recaptcha-container-profile');
      if (result) {
        setConfirmationResult(result);
        toast.success('Verification code sent!', { id: toastId });
      }
    } catch (error: any) {
      toast.error(authError || 'Failed to send verification code', { id: toastId });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) return;
    setIsVerifying(true);
    const toastId = toast.loading('Verifying code...');
    try {
      await verifyAndLinkPhone(confirmationResult, otp);
      setConfirmationResult(null);
      setOtp('');
      toast.success('Phone number verified and linked!', { id: toastId });
    } catch (error: any) {
      toast.error('Invalid verification code', { id: toastId });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await updateProfile({ 
        name, 
        avatarUrl,
        optInAlerts,
        optInEmail,
        optInFavoriteAlerts,
        optInSms,
        phoneNumber,
        alertDistricts,
        alertFuelTypes,
        priceThresholds
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          My Profile
        </h1>
        <p className="text-gray-600">Manage your personal information and account settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div 
              className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden cursor-pointer group relative border-2 border-transparent hover:border-primary transition-all"
              onClick={() => fileInputRef.current?.click()}
              title="Click to change avatar"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
              <div className="absolute inset-0 bg-surface-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>
            {avatarUrl && (
              <Button
                type="button"
                onClick={() => setAvatarUrl('')}
                variant="unstyled"
                className="text-xs text-red-600 hover:text-red-700 font-bold mb-4 uppercase tracking-wider"
                showNotification={false}
              >
                Remove Profile Picture
              </Button>
            )}
            <h2 className="text-xl font-bold text-surface-900">{profile.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{profile.email}</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-primary uppercase tracking-wider border border-emerald-100">
              {profile.role.replace('_', ' ')}
            </div>
          </div>

          {/* Favorite Stations Box */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="font-bold text-surface-900 text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-current" />
              Favorite Stations
            </h3>
            
            {favoriteStations.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-500 mb-1">No favorite stations yet</p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Find stations to save
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {favoriteStations.map(station => (
                  <div 
                    key={station.id} 
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 hover:bg-gray-100/70 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-surface-900 truncate leading-tight">{station.name || 'Station'}</h4>
                        <p className="text-[10px] text-gray-500 truncate">{station.brand || 'Fuel Station'} · {station.district || 'Sierra Leone'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate(`/?station=${station.id}`)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all cursor-pointer"
                        title="View details on map"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(station.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all cursor-pointer"
                        title="Remove from favorites"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-surface-900">Personal Information</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="block w-full pl-10 pr-3 py-3 bg-gray-100 text-gray-400 rounded-xl sm:text-sm cursor-not-allowed font-medium"
                  />
                </div>
                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email cannot be changed as it is linked to your Google account.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Account Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={profile.role.replace('_', ' ').toUpperCase()}
                    className="block w-full pl-10 pr-3 py-3 bg-gray-100 text-gray-400 rounded-xl sm:text-sm cursor-not-allowed font-bold"
                  />
                </div>
                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact an administrator to change your role.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                      placeholder="+232 00 000 000"
                    />
                    {phoneNumber === profile.phoneNumber && profile.phoneNumber && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                    )}
                  </div>
                  {phoneNumber !== profile.phoneNumber && !confirmationResult && (
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isVerifying || !phoneNumber}
                      variant="primary"
                      className="px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap"
                      showNotification={false}
                    >
                      Verify
                    </Button>
                  )}
                </div>
                
                {confirmationResult && (
                  <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Enter the 6-digit code sent to your phone</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="block w-full pl-10 pr-3 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-bold tracking-[0.5em] text-center"
                          placeholder="000000"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifying || otp.length !== 6}
                        variant="primary"
                        className="px-6 py-3 rounded-xl text-xs font-bold"
                        showNotification={false}
                      >
                        Confirm
                      </Button>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setConfirmationResult(null)}
                      variant="unstyled"
                      className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600"
                      showNotification={false}
                    >
                      Cancel Verification
                    </Button>
                  </div>
                )}

                <div id="recaptcha-container-profile" className="mt-4 flex justify-center"></div>
                
                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Include country code (e.g., +232). Verifying your phone number allows you to use it for login.</p>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-6">
                <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-primary" />
                  Notification Settings
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={optInFavoriteAlerts}
                        onChange={(e) => setOptInFavoriteAlerts(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        ⭐ Favorite Stations Price Alerts
                      </span>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Get instant alerts via app and email whenever fuel prices change at your favorited stations.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={optInEmail}
                        onChange={(e) => setOptInEmail(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        📧 Email Alerts
                      </span>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Receive email summaries when prices change at favorite stations or tracked districts.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={optInAlerts}
                        onChange={(e) => setOptInAlerts(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-800">Receive In-App Price Update Alerts</span>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">In-app popups and notification bell badges</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={optInSms}
                        onChange={(e) => setOptInSms(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-800">Receive SMS Alerts</span>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Direct SMS notifications to your verified phone number</p>
                    </div>
                  </label>

                  {(optInAlerts || optInSms) && (
                    <div className="pl-14 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Alert Districts
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {SIERRA_LEONE_DISTRICTS.map(district => (
                            <Button
                              key={district}
                              type="button"
                              onClick={() => {
                                setAlertDistricts(prev => 
                                  prev.includes(district) 
                                    ? prev.filter(d => d !== district)
                                    : [...prev, district]
                                );
                              }}
                              variant="unstyled"
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                alertDistricts.includes(district)
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              showNotification={false}
                            >
                              {district}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Alert Fuel Types
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {FUEL_TYPES.map(fuel => (
                            <Button
                              key={fuel}
                              type="button"
                              onClick={() => {
                                setAlertFuelTypes(prev => 
                                  prev.includes(fuel) 
                                    ? prev.filter(f => f !== fuel)
                                    : [...prev, fuel]
                                );
                              }}
                              variant="unstyled"
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                alertFuelTypes.includes(fuel)
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              showNotification={false}
                            >
                              {fuel}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Price Threshold Alerts (SLL)
                        </label>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Get notified when prices drop below these values</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {FUEL_TYPES.map(fuel => (
                            <div key={fuel} className="relative group">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{fuel}</span>
                              <input
                                type="number"
                                value={priceThresholds[fuel] || ''}
                                onChange={(e) => setPriceThresholds(prev => ({
                                  ...prev,
                                  [fuel]: e.target.value ? Number(e.target.value) : 0
                                }))}
                                className="w-full pl-16 pr-3 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-bold text-sm transition-all"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300 ${
                  message.type === 'success' ? 'bg-emerald-50 text-primary border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="text-sm font-bold">{message.text}</span>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSaving || (
                    name === profile.name && 
                    avatarUrl === (profile.avatarUrl || '') &&
                    optInAlerts === (profile.optInAlerts ?? true) &&
                    optInEmail === (profile.optInEmail ?? true) &&
                    optInFavoriteAlerts === (profile.optInFavoriteAlerts ?? true) &&
                    optInSms === (profile.optInSms || false) &&
                    phoneNumber === (profile.phoneNumber || '') &&
                    JSON.stringify(alertDistricts) === JSON.stringify(profile.alertDistricts || []) &&
                    JSON.stringify(alertFuelTypes) === JSON.stringify(profile.alertFuelTypes || []) &&
                    JSON.stringify(priceThresholds) === JSON.stringify(profile.priceThresholds || {})
                  )}
                  variant="primary"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                  notificationMessage="Profile updated successfully"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
