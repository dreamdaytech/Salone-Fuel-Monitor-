import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  MapPin, Activity, Bus, Globe, DollarSign, Calculator, 
  TrendingUp, ArrowRight, ShieldCheck, Fuel, Newspaper,
  Car, Gauge, Receipt, Wrench, Navigation, BarChart3
} from 'lucide-react';
import { db, collection, query, orderBy, limit, getDocs } from '../firebase';

export default function Landing() {
  const [latestFuelPrices, setLatestFuelPrices] = useState<{ petrol: number, diesel: number, kerosene: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestPrices() {
      try {
        const q = query(collection(db, 'barrelFuelSnapshots'), orderBy('date', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setLatestFuelPrices({
            petrol: data.petrolNLe,
            diesel: data.dieselNLe,
            kerosene: data.keroseneNLe
          });
        }
      } catch (err) {
        console.error("Error fetching latest fuel prices:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatestPrices();
  }, []);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A]">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-6">
                <ShieldCheck className="h-4 w-4" />
                Official Price Transparency
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
                Empowering Citizens with Real-Time <span className="text-emerald-300">Fuel Data</span>
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto lg:mx-0">
                Track pump prices, find verified stations with stock, compare global trends, and stay informed on official transport fares across Sierra Leone.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/stations" className="bg-white text-[#005aa0] px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg flex items-center justify-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Find Fuel Now
                </Link>
                <Link to="/price-trends" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3.5 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
                  <Activity className="h-5 w-5" />
                  View Price Trends
                </Link>
              </div>
            </motion.div>

            {/* Right Content - Price Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mx-auto w-full max-w-md lg:ml-auto"
            >
              <motion.div 
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-1 bg-gradient-to-r from-white/30 to-emerald-300/30 rounded-3xl blur-lg" 
              />
              <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Current Pump Prices</h3>
                    <p className="text-sm text-gray-500">Official National Average</p>
                  </div>
                  <motion.div 
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="p-2.5 bg-blue-50 rounded-xl"
                  >
                    <Fuel className="h-6 w-6 text-blue-600" />
                  </motion.div>
                </div>

                {loading ? (
                  <div className="space-y-4" style={{ minHeight: '232px' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-[68px] bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : latestFuelPrices ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                          className="w-1.5 h-10 bg-red-500 rounded-full" 
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Petrol (PMS)</p>
                          <p className="text-2xl font-bold text-gray-900">Le {latestFuelPrices.petrol}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-lg">/ Liter</span>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:bg-emerald-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                          className="w-1.5 h-10 bg-emerald-500 rounded-full" 
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Diesel (AGO)</p>
                          <p className="text-2xl font-bold text-gray-900">Le {latestFuelPrices.diesel}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">/ Liter</span>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:bg-amber-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                          className="w-1.5 h-10 bg-amber-500 rounded-full" 
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Kerosene (DPK)</p>
                          <p className="text-2xl font-bold text-gray-900">Le {latestFuelPrices.kerosene}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">/ Liter</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">Price data temporarily unavailable.</div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-4">
                  <Link to="/price-trends" className="flex items-center justify-between w-full group">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">View Detailed Price Trends</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors group-hover:translate-x-1" />
                  </Link>
                  <Link to="/regional-comparison" className="flex items-center justify-between w-full group">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Regional Fuel Comparison</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Platform Tools Intro ── */}
      <div className="bg-white py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold uppercase tracking-wider mb-4">Platform Tools</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Everything You Need, In One Place</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">A comprehensive suite of tools designed to bring transparency, insight, and control to fuel and transport in Sierra Leone.</p>
          </motion.div>
        </div>
      </div>

      {/* ── 1. Fuel Stations ── */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="order-last lg:order-first">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-5"><MapPin className="w-4 h-4" /> Fuel Stations</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-5">Find Verified Stations<br /><span className="text-blue-600">Near You, Right Now</span></h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">Browse an interactive map of verified fuel stations across Sierra Leone. Check live stock availability before you drive.</p>
              <ul className="space-y-3 mb-10">
                {['Live fuel stock status at every station', 'Interactive map with directions', 'Filter by fuel type — Petrol, Diesel, Kerosene', 'Verified station data from official sources'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-gray-700 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</span>{pt}
                  </li>
                ))}
              </ul>
              <Link to="/stations" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5">
                <MapPin className="h-5 w-5" /> Find Fuel Stations <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }} className="order-first lg:order-last">
              <div className="relative rounded-3xl overflow-hidden aspect-square max-w-sm mx-auto lg:max-w-full shadow-2xl group border-4 border-white">
                <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
                <img
                  src="/images/fuel_stations_sl_new.png"
                  alt="Fuel Stations in Sierra Leone"
                  width="600"
                  height="600"
                  fetchPriority="high"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── 2. Price Trends ── */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="order-first lg:order-1">
              <div className="relative rounded-3xl overflow-hidden aspect-square max-w-sm mx-auto lg:max-w-full shadow-2xl group border-4 border-white/10">
                <div className="absolute inset-0 bg-emerald-900/20 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
                <img
                  src="/images/price_trends_sl.png"
                  alt="Price Trends Data"
                  width="600"
                  height="600"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }} className="order-last lg:order-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-bold mb-5"><Activity className="w-4 h-4" /> Price Trends</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5">Track Every Price Change<br /><span className="text-emerald-300">Since Day One</span></h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">Follow the complete history of Sierra Leone's official fuel prices. Spot patterns, understand policy impacts, and export full PDF reports.</p>
              <ul className="space-y-3 mb-10">
                {['Full historical price chart going back years', 'Petrol, Diesel & Kerosene tracked separately', 'Export branded PDF reports in one click', 'Compare price changes month over month'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-gray-300 text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</span>{pt}
                  </li>
                ))}
              </ul>
              <Link to="/price-trends" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5">
                <Activity className="h-5 w-5" /> View Price Trends <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── 3. Transport Prices ── */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="order-last lg:order-first">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-bold mb-5"><Bus className="w-4 h-4" /> Transport Prices</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-5">Know Your Official<br /><span className="text-purple-600">Transport Fares</span></h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">Access official public transport fares across all districts in Sierra Leone. Never be overcharged again — know your rights before you board.</p>
              <ul className="space-y-3 mb-10">
                {['Official fares for all districts & routes', 'Poda-poda, taxi & intercity prices', 'Updated whenever government revises fares', 'Easy-to-browse by origin and destination'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-gray-700 text-sm">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</span>{pt}
                  </li>
                ))}
              </ul>
              <Link to="/transport-prices" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base transition-all shadow-lg shadow-purple-600/20 hover:-translate-y-0.5">
                <Bus className="h-5 w-5" /> View Transport Fares <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }} className="order-first lg:order-last">
              <div className="relative rounded-3xl overflow-hidden aspect-square max-w-sm mx-auto lg:max-w-full shadow-2xl group border-4 border-white">
                <div className="absolute inset-0 bg-purple-900/10 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
                <img
                  src="/images/transport_prices_sl.png"
                  alt="Transport Fares"
                  width="600"
                  height="600"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── 4. Regional Comparison ── */}
      <div className="bg-gradient-to-br from-[#6B1212] via-[#3B1F00] to-[#1A4D2E] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="order-first lg:order-1">
              <div className="relative rounded-3xl overflow-hidden aspect-square max-w-sm mx-auto lg:max-w-full shadow-2xl group border-4 border-[#3B1F00]/30">
                <div className="absolute inset-0 bg-[#6B1212]/20 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
                <img
                  src="/images/regional_comparison_wa.png"
                  alt="West Africa Regional Comparison"
                  width="600"
                  height="600"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }} className="order-last lg:order-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/20 text-yellow-300 text-sm font-bold mb-5"><Globe className="w-4 h-4" /> Regional Comparison</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5">How Does Sierra Leone<br /><span className="text-yellow-300">Compare to West Africa?</span></h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">Compare Sierra Leone's pump prices against 8 neighboring West African countries in real-time. See rankings, medal charts, and price gaps at a glance.</p>
              <ul className="space-y-3 mb-10">
                {['Live comparison with 8 West African nations', 'Card, Table, Map & Chart views', 'USD and local currency modes', 'World average benchmark included'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-gray-300 text-sm">
                    <span className="w-5 h-5 rounded-full bg-yellow-400/25 text-yellow-300 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</span>{pt}
                  </li>
                ))}
              </ul>
              <Link to="/regional-comparison" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-base transition-all shadow-lg shadow-green-900/40 hover:-translate-y-0.5">
                <Globe className="h-5 w-5" /> Compare Prices <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── 5. Barrel vs Fuel ── */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="order-last lg:order-first">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold mb-5"><TrendingUp className="w-4 h-4" /> Barrel vs Fuel</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-5">Global Crude Oil vs<br /><span className="text-indigo-600">Your Local Pump Price</span></h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">Understand the direct relationship between global crude oil barrel prices and what you pay at the pump. Spot price trends before they hit locally.</p>
              <ul className="space-y-3 mb-10">
                {['Crude oil price vs pump price overlay charts', 'Brent & WTI benchmark tracking', 'Historical correlation analysis', 'Export reports in PDF format'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-gray-700 text-sm">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</span>{pt}
                  </li>
                ))}
              </ul>
              <Link to="/barrel-vs-fuel" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5">
                <TrendingUp className="h-5 w-5" /> Explore Analysis <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }} className="order-first lg:order-last">
              <div className="relative rounded-3xl overflow-hidden aspect-square max-w-sm mx-auto lg:max-w-full shadow-2xl group border-4 border-white">
                <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
                <img
                  src="/images/barrel_vs_fuel_sl.png"
                  alt="Barrel vs Fuel Analysis"
                  width="600"
                  height="600"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── 6. Fuel Calculator ── */}
      <div className="bg-gradient-to-br from-teal-900 via-cyan-900 to-teal-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="order-first lg:order-1">
              <div className="relative rounded-3xl overflow-hidden aspect-square max-w-sm mx-auto lg:max-w-full shadow-2xl group border-4 border-white/10">
                <div className="absolute inset-0 bg-teal-900/20 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
                <img
                  src="/images/fuel_calculator_sl.png"
                  alt="Fuel Calculator"
                  width="600"
                  height="600"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }} className="order-last lg:order-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-sm font-bold mb-5"><Calculator className="w-4 h-4" /> Fuel Calculator</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5">Plan Your Journey,<br /><span className="text-teal-300">Know Your Fuel Cost</span></h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">Enter your vehicle's fuel efficiency and distance to instantly calculate how much fuel you need and what it will cost at today's official prices.</p>
              <ul className="space-y-3 mb-10">
                {['Instant cost estimate based on live prices', 'Supports Petrol, Diesel & Kerosene', 'Input distance, efficiency & fuel type', 'Great for trip planning & budgeting'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-gray-300 text-sm">
                    <span className="w-5 h-5 rounded-full bg-teal-500/30 text-teal-300 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</span>{pt}
                  </li>
                ))}
              </ul>
              <Link to="/calculator" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-base transition-all shadow-lg shadow-teal-500/25 hover:-translate-y-0.5">
                <Calculator className="h-5 w-5" /> Open Calculator <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── My Garage Section ── */}
      <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 py-20 overflow-hidden relative">
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-4"
              >
                <Car className="h-4 w-4" />
                Personal Fleet Manager
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight"
              >
                Track Every Kilometer,<br />
                <span className="text-emerald-400">Every Drop of Fuel</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-gray-400 text-lg max-w-xl"
              >
                My Garage gives you a personal command center for your vehicles — log trips, track fill-ups, monitor maintenance, and export full reports.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link
                to="/my-garage"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Car className="h-5 w-5" />
                Open My Garage
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              {
                icon: Car,
                title: 'My Vehicles',
                desc: 'Add and manage your personal fleet. Track make, model, fuel type and set a primary vehicle.',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
                glow: 'group-hover:shadow-blue-500/20',
              },
              {
                icon: Navigation,
                title: 'Trip Dispatches',
                desc: 'Log every trip with odometer readings, destination, and purpose. Track active vs completed runs.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
                glow: 'group-hover:shadow-purple-500/20',
              },
              {
                icon: Gauge,
                title: 'Fuel Logs',
                desc: 'Record every fill-up with liters, cost, station and payment method. See charts and export PDF reports.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                glow: 'group-hover:shadow-emerald-500/20',
              },
              {
                icon: Wrench,
                title: 'Maintenance',
                desc: 'Log service records, repair costs and mechanic visits. Never miss a scheduled service again.',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
                glow: 'group-hover:shadow-amber-500/20',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to="/my-garage" className="group block h-full">
                  <div className={`h-full bg-white/5 border ${item.border} rounded-2xl p-6 hover:bg-white/8 transition-all duration-300 hover:shadow-xl ${item.glow}`}>
                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    <div className={`mt-5 inline-flex items-center gap-1 text-xs font-semibold ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      Get started <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { icon: Car, label: 'Vehicles tracked', value: 'Unlimited', color: 'text-blue-400' },
              { icon: Receipt, label: 'Fuel logs', value: 'Full history', color: 'text-emerald-400' },
              { icon: BarChart3, label: 'Cost charts', value: 'Visual insights', color: 'text-purple-400' },
              { icon: Navigation, label: 'PDF export', value: 'Reports ready', color: 'text-amber-400' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <stat.icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
                <div>
                  <p className="text-white font-bold text-sm">{stat.value}</p>
                  <p className="text-gray-500 text-xs">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Highlights / Intelligence Section */}
      <div className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 overflow-hidden relative">
            {/* Decorative background shapes */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-300 text-sm font-medium mb-4">
                  <Newspaper className="h-4 w-4" />
                  Insights & Updates
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Stay Informed with Market Intelligence</h2>
                <p className="text-gray-400 mb-8 text-lg">
                  Read our latest blog posts and market analysis to understand the global factors affecting local pump prices in Sierra Leone.
                </p>
                <Link to="/market-intelligence" className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition-colors">
                  View Market Intel <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/exchange-rates" className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors p-6 rounded-2xl group backdrop-blur-sm">
                  <DollarSign className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-bold text-white mb-2">Exchange Rates</h3>
                  <p className="text-sm text-gray-400">Monitor Bank of Sierra Leone rates vs parallel market.</p>
                </Link>
                <Link to="/blog" className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors p-6 rounded-2xl group backdrop-blur-sm">
                  <Newspaper className="w-8 h-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-bold text-white mb-2">Platform Blog</h3>
                  <p className="text-sm text-gray-400">Read news, updates, and deep dives into fuel economy.</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
