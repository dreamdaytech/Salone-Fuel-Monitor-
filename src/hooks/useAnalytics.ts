import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, logEvent } from '../firebase';

/**
 * Maps route paths to human-readable page names for Analytics.
 */
const PAGE_NAMES: Record<string, string> = {
  '/':                      'Home / Landing',
  '/stations':              'Fuel Stations',
  '/price-trends':          'Price Trends',
  '/transport-prices':      'Transport Prices',
  '/transport-trends':      'Transport Trends',
  '/regional-comparison':   'Regional Comparison',
  '/market-intelligence':   'Market Intelligence',
  '/exchange-rates':        'Exchange Rates',
  '/barrel-vs-fuel':        'Barrel vs Fuel',
  '/calculator':            'Fuel Calculator',
  '/blog':                  'Blog',
  '/about':                 'About Us',
  '/contact':               'Contact',
  '/polls':                 'Polls',
  '/surveys':               'Surveys',
  '/petitions':             'Petitions',
  '/decision':              'Decision',
  '/profile':               'User Profile',
  '/login':                 'Login',
  '/signup':                'Sign Up',
  '/onboarding':            'Onboarding',
  '/terms':                 'Terms of Service',
  '/privacy':               'Privacy Policy',
  '/cookies':               'Cookie Policy',
  '/dashboard':             'Station Dashboard',
  '/admin':                 'Admin Dashboard',
};

function getPageName(pathname: string): string {
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];
  if (pathname.startsWith('/blog/')) return 'Blog Post';
  if (pathname.startsWith('/transport-prices/')) return 'Transport Price Details';
  if (pathname.startsWith('/admin/')) return 'Admin Panel';
  return pathname;
}

/**
 * Hook: auto-tracks page_view on every route change.
 * Used inside AppContent so it has access to the router context.
 */
export function usePageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!analytics) return;
    const pageName = getPageName(location.pathname);
    logEvent(analytics, 'page_view', {
      page_path:     location.pathname,
      page_title:    pageName,
      page_location: window.location.href,
    });
  }, [location.pathname]);
}

// ─── Custom Event Helpers ────────────────────────────────────────────────────

/** Called when user exports a PDF report */
export function trackPdfExport(reportName: string) {
  if (!analytics) return;
  logEvent(analytics, 'pdf_export', { report_name: reportName });
}

/** Called when user views a fuel station detail */
export function trackStationView(stationName: string, stationId: string) {
  if (!analytics) return;
  logEvent(analytics, 'station_view', { station_name: stationName, station_id: stationId });
}

/** Called when user searches for a fuel station */
export function trackStationSearch(query: string) {
  if (!analytics) return;
  logEvent(analytics, 'station_search', { search_term: query });
}

/** Called when user switches fuel type in comparisons */
export function trackFuelTypeSwitch(fuelType: string, page: string) {
  if (!analytics) return;
  logEvent(analytics, 'fuel_type_switch', { fuel_type: fuelType, page });
}

/** Called when user runs calculator */
export function trackCalculatorUse(fuelType: string, litres: number) {
  if (!analytics) return;
  logEvent(analytics, 'calculator_use', { fuel_type: fuelType, litres });
}

/** Called when user reads a blog post */
export function trackBlogRead(slug: string, title: string) {
  if (!analytics) return;
  logEvent(analytics, 'blog_post_read', { post_slug: slug, post_title: title });
}

/** Called when user shares content */
export function trackShare(method: string, contentType: string, itemId?: string) {
  if (!analytics) return;
  logEvent(analytics, 'share', { method, content_type: contentType, item_id: itemId });
}

/** Generic custom event tracker */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (!analytics) return;
  logEvent(analytics, eventName, params);
}
