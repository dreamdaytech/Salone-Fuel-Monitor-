import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, MapPin, LogOut, Loader2, Phone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

export default function Register() {
  const { user, completeRegistration, logOut } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [role, setRole] = useState<'user' | 'station_owner'>('user');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await completeRegistration(name, role, phoneNumber);
      toast.success('Profile completed successfully!');
    } catch (error: any) {
      console.error('Registration failed:', error);
      let errorMessage = 'Failed to complete profile. Please try again.';
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

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="w-24 h-24 mb-2 hover:scale-105 transition-transform duration-200">
            <img src="/logo.png" alt="Salone Fuel Monitor" className="w-full h-full object-contain drop-shadow-md" />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-surface-900 tracking-tight">
          Basic Information
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Tell us a little bit about yourself
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 sm:rounded-[2rem] sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                  placeholder="+232 00 000 000"
                />
              </div>
              <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Optional: For SMS alerts and account recovery</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() => setRole('user')}
                  showNotification={false}
                  disableAfterClick={false}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    role === 'user'
                      ? 'border-primary bg-emerald-50 text-primary'
                      : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <User className={`h-6 w-6 mb-2 ${role === 'user' ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="text-sm font-bold">Regular User</span>
                </Button>
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() => setRole('station_owner')}
                  showNotification={false}
                  disableAfterClick={false}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    role === 'station_owner'
                      ? 'border-primary bg-emerald-50 text-primary'
                      : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <MapPin className={`h-6 w-6 mb-2 ${role === 'station_owner' ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="text-sm font-bold">Station Owner</span>
                </Button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                loading={isSubmitting}
                showNotification={false}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-xl shadow-emerald-500/20 text-sm font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Registration
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-6 leading-relaxed">
              By completing registration, you agree to our{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Terms of Service</Link>,{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Privacy Policy</Link>, and{' '}
              <Link to="/cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Cookie Policy</Link>.
            </p>
          </form>
          
          <div className="mt-8 text-center">
            <Button
              onClick={logOut}
              variant="unstyled"
              notificationMessage="Logging out..."
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-surface-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out and return later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
