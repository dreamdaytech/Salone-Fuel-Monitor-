/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FavoriteProvider } from './contexts/FavoriteContext';
import { Toaster, toast } from 'sonner';
import Navbar from './components/Navbar';
import SystemUpdater from './components/SystemUpdater';
import RouteSEO from './components/RouteSEO';
import { usePageViewTracker } from './hooks/useAnalytics';

/**
 * Wraps React.lazy() with automatic reload on stale-chunk errors.
 * When a new deployment replaces hashed JS filenames, old browser tabs
 * will fail to fetch the old chunk URLs. This catches that error and
 * reloads the page once so the user gets the latest version seamlessly.
 */
function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().catch((err: Error) => {
      const msg = err?.message?.toLowerCase() ?? '';
      const isChunkError =
        msg.includes('failed to fetch dynamically imported module') ||
        msg.includes('importing a module script failed') ||
        msg.includes('error loading chunk');
      if (isChunkError) {
        console.warn('[SFM] Stale chunk on lazy import — reloading for update:', err.message);
        window.location.reload();
        return new Promise(() => {}) as Promise<{ default: T }>;
      }
      throw err;
    })
  );
}

const Landing = lazyWithRetry(() => import('./pages/Landing'));
const FuelStations = lazyWithRetry(() => import('./pages/FuelStations'));
const TransportPrices = lazyWithRetry(() => import('./pages/TransportPrices'));
const TransportPriceDetails = lazyWithRetry(() => import('./pages/TransportPriceDetails'));
const AdminTransportPriceDetails = lazyWithRetry(() => import('./pages/AdminTransportPriceDetails'));
const PriceTrends = lazyWithRetry(() => import('./pages/PriceTrends'));
const TransportTrends = lazyWithRetry(() => import('./pages/TransportTrends'));
const StationDashboard = lazyWithRetry(() => import('./pages/StationDashboard'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AdminReviews = lazyWithRetry(() => import('./pages/AdminReviews'));
const Auth = lazyWithRetry(() => import('./pages/Auth'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const About = lazyWithRetry(() => import('./pages/About'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const CookiePolicy = lazyWithRetry(() => import('./pages/CookiePolicy'));
const CalculatorPage = lazyWithRetry(() => import('./pages/Calculator'));
const Onboarding = lazyWithRetry(() => import('./pages/Onboarding'));
const LocationPickerPage = lazyWithRetry(() => import('./pages/LocationPickerPage'));
const RegionalComparison = lazyWithRetry(() => import('./pages/RegionalComparison'));
const MarketIntelligence = lazyWithRetry(() => import('./pages/MarketIntelligence'));
const ExchangeRates = lazyWithRetry(() => import('./pages/ExchangeRates'));
const BlogList = lazyWithRetry(() => import('./pages/BlogList'));
const BlogPost = lazyWithRetry(() => import('./pages/BlogPost'));
const BarrelVsFuel = lazyWithRetry(() => import('./pages/BarrelVsFuel'));
const AdminBarrelVsFuel = lazyWithRetry(() => import('./pages/AdminBarrelVsFuel'));
const MyGarage = lazyWithRetry(() => import('./pages/MyGarage'));
const Donate = lazyWithRetry(() => import('./pages/Donate'));
const DonateSuccess = lazyWithRetry(() => import('./pages/DonateSuccess'));
const DonateCancel = lazyWithRetry(() => import('./pages/DonateCancel'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
import Footer from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import ScrollProgress from './components/ScrollProgress';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  usePageViewTracker();

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

  const publicRoutes = ['/', '/transport-prices', '/calculator', '/price-trends', '/transport-trends', '/regional-comparison', '/market-intelligence', '/exchange-rates', '/barrel-vs-fuel', '/about', '/contact', '/terms', '/privacy', '/cookies', '/blog', '/stations', '/donate', '/donate/success', '/donate/cancel'];
  const isPublicRoute = publicRoutes.includes(location.pathname) || location.pathname.startsWith('/blog/') || location.pathname.startsWith('/transport-prices/');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <FavoriteProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-surface-50">
          <RouteSEO />
          <ScrollProgress />
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
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/stations" element={<FuelStations />} />
                <Route path="/transport-prices" element={<TransportPrices />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/transport-prices/:id" element={<TransportPriceDetails />} />
                <Route path="/price-trends" element={<PriceTrends />} />
                <Route path="/transport-trends" element={<TransportTrends />} />
                <Route path="/login" element={!user ? <Auth /> : <Navigate to="/" />} />
                <Route path="/signup" element={!user ? <Auth /> : <Navigate to="/" />} />
                <Route path="/register" element={user && !profile ? <Register /> : <Navigate to="/" />} />
                <Route path="/profile" element={user ? (profile && !profile.onboardingCompleted ? <Navigate to="/onboarding" /> : <Profile />) : <Navigate to="/login" />} />
                <Route path="/regional-comparison" element={<RegionalComparison />} />
                <Route path="/market-intelligence" element={<MarketIntelligence />} />
                <Route path="/exchange-rates" element={<ExchangeRates />} />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/barrel-vs-fuel" element={<BarrelVsFuel />} />
                <Route path="/admin/barrel-vs-fuel" element={user && profile?.role === 'admin' ? <AdminBarrelVsFuel /> : <Navigate to={user ? '/' : '/login'} />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/donate/success" element={<DonateSuccess />} />
                <Route path="/donate/cancel" element={<DonateCancel />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/onboarding" element={user && profile && !profile.onboardingCompleted ? <Onboarding /> : <Navigate to="/" />} />
                <Route path="/location-picker" element={<LocationPickerPage />} />
                <Route path="/dashboard" element={user && (profile?.role === 'station_owner' || profile?.role === 'admin') ? <StationDashboard /> : <Navigate to={user ? "/" : "/login"} />} />
                <Route path="/admin" element={user && profile?.role === 'admin' ? <AdminDashboard /> : <Navigate to={user ? "/" : "/login"} />} />
                <Route path="/admin/transport-prices/:id" element={user && profile?.role === 'admin' ? <AdminTransportPriceDetails /> : <Navigate to={user ? "/" : '/login'} />} />
                <Route path="/my-garage" element={user ? <MyGarage /> : <Navigate to="/login" />} />
                <Route path="/admin/reviews" element={user && profile?.role === 'admin' ? <AdminReviews /> : <Navigate to={user ? "/" : '/login'} />} />
                <Route path="*" element={user && !profile ? <Register /> : <NotFound />} />
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
