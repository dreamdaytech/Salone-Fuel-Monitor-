import { Home, Search, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export default function NotFound() {
  useSEO({
    title: 'Page Not Found',
    description: 'The requested Salone Fuel Monitor page could not be found.',
    robots: 'noindex, nofollow',
  });

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-surface-50">
      <div className="max-w-2xl w-full text-center bg-white border border-gray-100 rounded-3xl shadow-xl shadow-slate-200/40 p-8 sm:p-12">
        <div className="text-6xl sm:text-7xl font-black text-primary/20 mb-4">404</div>
        <h1 className="text-3xl sm:text-4xl font-black text-surface-900 mb-4">Page Not Found</h1>
        <p className="text-gray-500 text-base sm:text-lg mb-8">
          The page you requested does not exist, may have moved, or is no longer available.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors">
            <Home className="w-4 h-4" />
            Fuel Prices Today
          </Link>
          <Link to="/price-trends" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-surface-900 font-bold hover:border-primary hover:text-primary transition-colors">
            <TrendingUp className="w-4 h-4" />
            Price Trends
          </Link>
          <Link to="/stations" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-surface-900 font-bold hover:border-primary hover:text-primary transition-colors">
            <Search className="w-4 h-4" />
            Fuel Stations
          </Link>
        </div>
      </div>
    </div>
  );
}
