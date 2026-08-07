import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Fuel, LogIn, LogOut, User, Shield, MapPin, Bus, Car,
  ChevronDown, LayoutGrid, Activity, ClipboardList, 
  PenTool, ShieldCheck, Info, UserPlus, MessageSquare,
  Menu, X, TrendingUp, Calculator, Globe, BarChart3, DollarSign, FileText
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { Button } from './ui/Button';
import { toast } from 'sonner';

export default function Navbar() {
  const { user, profile, logOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const toastId = toast.loading('Logging out...');
    try {
      await logOut();
      setIsMenuOpen(false);
      toast.success('Logged out successfully', { id: toastId });
      navigate('/');
    } catch (error) {
      toast.error('Logout failed', { id: toastId });
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center">
                <img src="/logo.png" alt="Salone Fuel Monitor" className="h-20 w-20 object-contain" />
              </div>
              <span className="text-2xl font-bold text-surface-900 hidden sm:block">
                Salone Fuel Monitor
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-4 md:gap-6 mr-2 sm:mr-4">
              <Link
                to="/stations"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/stations') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
              >
                <MapPin className="h-4 w-4" />
                <span>Fuel Stations</span>
              </Link>

              <Link
                to="/transport-prices"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/transport-prices') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
              >
                <Bus className="h-4 w-4" />
                <span>Transport Prices</span>
              </Link>
              
              <Link
                to="/price-trends"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/price-trends') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
              >
                <Activity className="h-4 w-4" />
                <span>Price Trends</span>
              </Link>

              <Link
                to="/regional-comparison"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/regional-comparison') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
              >
                <Globe className="h-4 w-4" />
                <span>Regional</span>
              </Link>

              <div className="relative" ref={toolsMenuRef}>
                <button
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors py-2 ${(isActive('/calculator') || isActive('/market-intelligence') || isActive('/exchange-rates') || isActive('/my-garage')) ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>Our Tools</span>
                  <ChevronDown className={`h-3 w-3 opacity-50 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isToolsMenuOpen && (
                  <div className="absolute top-full left-0 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      <Link
                        to="/market-intelligence"
                        onClick={() => setIsToolsMenuOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isActive('/market-intelligence') ? 'bg-emerald-50 text-primary font-bold' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Market Intel</span>
                      </Link>
                      <Link
                        to="/exchange-rates"
                        onClick={() => setIsToolsMenuOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isActive('/exchange-rates') ? 'bg-emerald-50 text-primary font-bold' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>Exchange Rates</span>
                      </Link>
                      <Link
                        to="/calculator"
                        onClick={() => setIsToolsMenuOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isActive('/calculator') ? 'bg-emerald-50 text-primary font-bold' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
                      >
                        <Calculator className="h-4 w-4" />
                        <span>Calculator</span>
                      </Link>
                      {/* My Garage — only shown when logged in */}
                      {user && (
                        <>
                          <div className="mx-4 my-1.5 border-t border-gray-100" />
                          <Link
                            to="/my-garage"
                            onClick={() => setIsToolsMenuOpen(false)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isActive('/my-garage') ? 'bg-emerald-50 text-primary font-bold' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
                          >
                            <Car className="h-4 w-4" />
                            <span>My Garage</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <NotificationBell />
                
                <div className="relative" ref={menuRef}>
                  <Button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    showNotification={false}
                    variant="ghost"
                    className={`flex items-center gap-2 p-1 pr-3 rounded-full border-2 transition-all ${
                      isMenuOpen ? 'border-primary/20 bg-emerald-50/50' : 'border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                      {profile?.avatarUrl ? (
                        <img 
                          src={profile.avatarUrl} 
                          alt={profile.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="hidden sm:block text-[10px] text-gray-500 font-medium uppercase tracking-wider">Hello,</span>
                      <span className="text-xs sm:text-sm font-bold text-primary">
                        {profile?.name?.split(' ')[0] || 'User'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform origin-top-right transition-all z-50">
                      {/* Dropdown Header */}
                      <div className="p-5 bg-emerald-50/50 border-b border-emerald-100">
                        <h3 className="text-lg font-bold text-surface-900 leading-tight">
                          {profile?.name || 'User'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3 truncate">
                          {profile?.email || user.email}
                        </p>
                        {profile?.role === 'admin' && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3" />
                            ADMIN
                          </div>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="p-1.5">
                        <Link
                          to={profile?.role === 'admin' ? '/admin' : '/dashboard'}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 p-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-primary group-hover:bg-emerald-100 transition-colors">
                            <LayoutGrid className="w-4.5 h-4.5" />
                          </div>
                          <span className="font-semibold text-sm">Dashboard</span>
                        </Link>

                        {(profile?.role === 'station_owner' || profile?.role === 'admin') && (
                          <Link
                            to="/dashboard"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 p-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-primary transition-colors">
                              <MapPin className="w-4.5 h-4.5" />
                            </div>
                            <span className="font-semibold text-sm">Stations</span>
                          </Link>
                        )}

                        <Link
                          to="/my-garage"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 p-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-primary transition-colors">
                            <Car className="w-4.5 h-4.5" />
                          </div>
                          <span className="font-semibold text-sm">My Garage</span>
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 p-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-primary transition-colors">
                            <User className="w-4.5 h-4.5" />
                          </div>
                          <span className="font-semibold text-sm">My Profile</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="p-1.5 border-t border-gray-100">
                        <Button
                          onClick={handleLogout}
                          showNotification={false}
                          variant="ghost"
                          className="w-full flex items-center gap-3 p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-4.5 h-4.5" />
                          </div>
                          <span className="font-semibold text-sm">Log out</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 border border-transparent text-xs sm:text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}

            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              showNotification={false}
              variant="ghost"
              className="sm:hidden p-2 -mr-2 text-gray-600 hover:text-primary rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/stations"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive('/stations') ? 'bg-emerald-50 text-primary' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
            >
              <MapPin className="h-5 w-5" />
              <span>Fuel Stations</span>
            </Link>
            <Link
              to="/transport-prices"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive('/transport-prices') ? 'bg-emerald-50 text-primary' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
            >
              <Bus className="h-5 w-5" />
              <span>Transport Prices</span>
            </Link>
            <Link
              to="/price-trends"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive('/price-trends') ? 'bg-emerald-50 text-primary' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
            >
              <Activity className="h-5 w-5" />
              <span>Price Trends</span>
            </Link>

            <Link
              to="/regional-comparison"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive('/regional-comparison') ? 'bg-emerald-50 text-primary' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
            >
              <Globe className="h-5 w-5" />
              <span>Regional Comparison</span>
            </Link>
            
            <div className="pt-2 pb-1">
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Our Tools</p>
              <Link
                to="/market-intelligence"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive('/market-intelligence') ? 'bg-emerald-50 text-primary' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Market Intelligence</span>
              </Link>
              <Link
                to="/exchange-rates"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive('/exchange-rates') ? 'bg-emerald-50 text-primary' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
              >
                <DollarSign className="h-5 w-5" />
                <span>Exchange Rates</span>
              </Link>
              <Link
                to="/calculator"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive('/calculator') ? 'bg-emerald-50 text-primary' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
              >
                <Calculator className="h-5 w-5" />
                <span>Fuel Calculator</span>
              </Link>
              {/* My Garage — inside Our Tools, auth-gated */}
              {user && (
                <Link
                  to="/my-garage"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors ${isActive('/my-garage') ? 'bg-emerald-50 text-primary' : 'text-gray-700 hover:bg-emerald-50 hover:text-primary'}`}
                >
                  <Car className="h-5 w-5" />
                  <span>My Garage</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
