/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FavoriteProvider } from './contexts/FavoriteContext';
import { AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import PageTransition from './components/PageTransition';
import Navbar from './components/Navbar';
import SystemUpdater from './components/SystemUpdater';
const Landing = React.lazy(() => import('./pages/Landing'));
const FuelStations = React.lazy(() => import('./pages/FuelStations'));
const TransportPrices = React.lazy(() => import('./pages/TransportPrices'));
const TransportPriceDetails = React.lazy(() => import('./pages/TransportPriceDetails'));
const AdminTransportPriceDetails = React.lazy(() => import('./pages/AdminTransportPriceDetails'));
const PriceTrends = React.lazy(() => import('./pages/PriceTrends'));
const TransportTrends = React.lazy(() => import('./pages/TransportTrends'));
const StationDashboard = React.lazy(() => import('./pages/StationDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminReviews = React.lazy(() => import('./pages/AdminReviews'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Polls = React.lazy(() => import('./pages/Polls'));
const Surveys = React.lazy(() => import('./pages/Surveys'));
const Petitions = React.lazy(() => import('./pages/Petitions'));
const Decision = React.lazy(() => import('./pages/Decision'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const CookiePolicy = React.lazy(() => import('./pages/CookiePolicy'));
const CalculatorPage = React.lazy(() => import('./pages/Calculator'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const LocationPickerPage = React.lazy(() => import('./pages/LocationPickerPage'));
const RegionalComparison = React.lazy(() => import('./pages/RegionalComparison'));
const MarketIntelligence = React.lazy(() => import('./pages/MarketIntelligence'));
const ExchangeRates = React.lazy(() => import('./pages/ExchangeRates'));
const BlogList = React.lazy(() => import('./pages/BlogList'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const BarrelVsFuel = React.lazy(() => import('./pages/BarrelVsFuel'));
const AdminBarrelVsFuel = React.lazy(() => import('./pages/AdminBarrelVsFuel'));
import Footer from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Back online!', {
        id: 'offline-toast',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error('You are currently offline. Viewing cached data.', {
        id: 'offline-toast',
        duration: Infinity,
      });
    };

    // Show initial offline state if started offline
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const publicRoutes = ['/', '/transport-prices', '/calculator', '/price-trends', '/transport-trends', '/regional-comparison', '/market-intelligence', '/exchange-rates', '/barrel-vs-fuel', '/about', '/terms', '/privacy', '/cookies', '/blog'];
  const isPublicRoute = publicRoutes.includes(location.pathname) || location.pathname.startsWith('/blog/') || location.pathname.startsWith('/transport-prices/');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && !profile) {
    const policyRoutes = ['/terms', '/privacy', '/cookies'];
    if (!policyRoutes.includes(location.pathname)) {
      return <Register />;
    }
  }

  if (user && profile && !profile.onboardingCompleted && location.pathname !== '/onboarding') {
    const policyRoutes = ['/terms', '/privacy', '/cookies'];
    if (!policyRoutes.includes(location.pathname)) {
      return <Navigate to="/onboarding" />;
    }
  }

  return (
    <FavoriteProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-surface-50">
          <Toaster position="top-center" richColors />
          <SystemUpdater />
          <Navbar />
          {isOffline && (
            <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              You are offline. Some features may not be available.
            </div>
          )}
          <main>
            <React.Suspense fallback={
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Landing />} />
                <Route path="/stations" element={<FuelStations />} />
                <Route path="/transport-prices" element={<TransportPrices />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/transport-prices/:id" element={<TransportPriceDetails />} />
                <Route path="/price-trends" element={<PriceTrends />} />
                <Route path="/transport-trends" element={<TransportTrends />} />
                <Route path="/login" element={!user ? <Auth /> : <Navigate to="/" />} />
                <Route path="/signup" element={!user ? <Auth /> : <Navigate to="/" />} />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/polls" element={user ? <Polls /> : <Navigate to="/login" />} />
                <Route path="/surveys" element={user ? <Surveys /> : <Navigate to="/login" />} />
                <Route path="/petitions" element={user ? <Petitions /> : <Navigate to="/login" />} />
                <Route path="/decision" element={user ? <Decision /> : <Navigate to="/login" />} />
                <Route path="/regional-comparison" element={<RegionalComparison />} />
                <Route path="/market-intelligence" element={<MarketIntelligence />} />
                <Route path="/exchange-rates" element={<ExchangeRates />} />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/barrel-vs-fuel" element={<BarrelVsFuel />} />
                <Route path="/admin/barrel-vs-fuel" element={user && profile?.role === 'admin' ? <AdminBarrelVsFuel /> : <Navigate to={user ? '/' : '/login'} />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/onboarding" element={user && profile && !profile.onboardingCompleted ? <Onboarding /> : <Navigate to="/" />} />
                <Route path="/location-picker" element={<LocationPickerPage />} />
                <Route path="/dashboard" element={user && (profile?.role === 'station_owner' || profile?.role === 'admin') ? <StationDashboard /> : <Navigate to={user ? "/" : "/login"} />} />
                <Route path="/admin" element={user && profile?.role === 'admin' ? <AdminDashboard /> : <Navigate to={user ? "/" : "/login"} />} />
                <Route path="/admin/transport-prices/:id" element={user && profile?.role === 'admin' ? <AdminTransportPriceDetails /> : <Navigate to={user ? "/" : "/login"} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </React.Suspense>
          </main>
          {isPublicRoute && <Footer />}
        </div>
      </NotificationProvider>
    </FavoriteProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
