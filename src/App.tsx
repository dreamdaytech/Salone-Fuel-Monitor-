/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FavoriteProvider } from './contexts/FavoriteContext';
import { AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import PageTransition from './components/PageTransition';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TransportPrices from './pages/TransportPrices';
import TransportPriceDetails from './pages/TransportPriceDetails';
import AdminTransportPriceDetails from './pages/AdminTransportPriceDetails';
import PriceTrends from './pages/PriceTrends';
import TransportTrends from './pages/TransportTrends';
import StationDashboard from './pages/StationDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminReviews from './pages/AdminReviews';
import Auth from './pages/Auth';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Polls from './pages/Polls';
import Surveys from './pages/Surveys';
import Petitions from './pages/Petitions';
import Decision from './pages/Decision';
import About from './pages/About';
import Contact from './pages/Contact';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import CalculatorPage from './pages/Calculator';
import Onboarding from './pages/Onboarding';
import LocationPickerPage from './pages/LocationPickerPage';
import RegionalComparison from './pages/RegionalComparison';
import MarketIntelligence from './pages/MarketIntelligence';
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

  const publicRoutes = ['/', '/transport-prices', '/calculator', '/price-trends', '/transport-trends', '/regional-comparison', '/market-intelligence', '/about', '/terms', '/privacy', '/cookies'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

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
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
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
