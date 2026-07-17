/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FavoriteProvider } from './contexts/FavoriteContext';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import PageTransition from './components/PageTransition';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TransportPrices from './pages/TransportPrices';
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
import Onboarding from './pages/Onboarding';
import LocationPickerPage from './pages/LocationPickerPage';
import Footer from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  const publicRoutes = ['/', '/transport-prices', '/about', '/terms', '/privacy', '/cookies'];
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
          <main>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                <Route path="/transport-prices" element={<PageTransition><TransportPrices /></PageTransition>} />
                <Route path="/login" element={!user ? <PageTransition><Auth /></PageTransition> : <Navigate to="/" />} />
                <Route path="/signup" element={!user ? <PageTransition><Auth /></PageTransition> : <Navigate to="/" />} />
                <Route path="/profile" element={user ? <PageTransition><Profile /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/polls" element={user ? <PageTransition><Polls /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/surveys" element={user ? <PageTransition><Surveys /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/petitions" element={user ? <PageTransition><Petitions /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/decision" element={user ? <PageTransition><Decision /></PageTransition> : <Navigate to="/login" />} />
                <Route path="/about" element={<PageTransition><About /></PageTransition>} />
                <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
                <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
                <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
                <Route path="/cookies" element={<PageTransition><CookiePolicy /></PageTransition>} />
                <Route path="/onboarding" element={user && profile && !profile.onboardingCompleted ? <PageTransition><Onboarding /></PageTransition> : <Navigate to="/" />} />
                <Route path="/location-picker" element={<PageTransition><LocationPickerPage /></PageTransition>} />
                <Route path="/dashboard" element={user && (profile?.role === 'station_owner' || profile?.role === 'admin') ? <PageTransition><StationDashboard /></PageTransition> : <Navigate to={user ? "/" : "/login"} />} />
                <Route path="/admin" element={user && profile?.role === 'admin' ? <PageTransition><AdminDashboard /></PageTransition> : <Navigate to={user ? "/" : "/login"} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
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
