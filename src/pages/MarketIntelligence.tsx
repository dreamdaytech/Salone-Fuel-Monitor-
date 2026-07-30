import React, { useState, useEffect } from 'react';
import { db, doc, onSnapshot } from '../firebase';
import { BarChart3, Info } from 'lucide-react';
import MarketIntelligencePanel from '../components/MarketIntelligencePanel';
import type { MarketIntelligenceData } from '../lib/marketIntelligence';

export default function MarketIntelligence() {
  const [marketIntel, setMarketIntel] = useState<MarketIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'market_intelligence', 'current'),
      (snap) => {
        if (snap.exists()) {
          setMarketIntel(snap.data() as MarketIntelligenceData);
        } else {
          setMarketIntel(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Could not load market intelligence:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-surface-900 via-surface-800 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Analytics & Insights</p>
              <h1 className="text-2xl sm:text-4xl font-black text-white">Market Intelligence</h1>
            </div>
          </div>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Deep dive into global economic indicators, commodity prices, and currency trends affecting the fuel market. 
            Stay informed with our comprehensive data analysis on Brent Crude, USD/SLL exchange rates, and regional inflation.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium">Loading market data...</p>
          </div>
        ) : marketIntel ? (
          <div className="space-y-6">
            <MarketIntelligencePanel data={marketIntel} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Info className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 mb-2">No Market Data Available</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Market intelligence data has not been published yet. Please check back later or contact administration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
