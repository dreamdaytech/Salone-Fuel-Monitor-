import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  MapPin, Activity, Bus, Globe, DollarSign, Calculator, 
  TrendingUp, ArrowRight, ShieldCheck, Fuel, Newspaper
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

  const features = [
    {
      title: 'Fuel Stations',
      description: 'Find verified fuel stations, check stock availability, and navigate to the nearest pumps.',
      icon: MapPin,
      link: '/stations',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Price Trends',
      description: 'Track historical fuel prices in Sierra Leone and export detailed PDF reports.',
      icon: Activity,
      link: '/price-trends',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Transport Prices',
      description: 'View official public transport fares across districts to avoid overcharging.',
      icon: Bus,
      link: '/transport-prices',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Regional Comparison',
      description: 'Compare Sierra Leone pump prices with neighboring West African countries.',
      icon: Globe,
      link: '/regional-comparison',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Barrel vs Fuel',
      description: 'Analyze the relationship between global crude oil prices and local pump prices.',
      icon: TrendingUp,
      link: '/barrel-vs-fuel',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Fuel Calculator',
      description: 'Calculate fuel costs based on your vehicle efficiency and distance.',
      icon: Calculator,
      link: '/calculator',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    }
  ];

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
                  View Trends
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
              <div className="absolute -inset-1 bg-gradient-to-r from-white/30 to-emerald-300/30 rounded-3xl blur-lg" />
              <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Current Pump Prices</h3>
                    <p className="text-sm text-gray-500">Official National Average</p>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <Fuel className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                    ))}
                  </div>
                ) : latestFuelPrices ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-10 bg-red-500 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Petrol (PMS)</p>
                          <p className="text-2xl font-bold text-gray-900">Le {latestFuelPrices.petrol}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-lg">/ Liter</span>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:bg-emerald-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-10 bg-emerald-500 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Diesel (AGO)</p>
                          <p className="text-2xl font-bold text-gray-900">Le {latestFuelPrices.diesel}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">/ Liter</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">Price data temporarily unavailable.</div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Link to="/price-trends" className="flex items-center justify-between w-full group">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">View Detailed Price Trends</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Tools for Citizens</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Access a comprehensive suite of tools designed to bring transparency to the fuel and transport sector in Sierra Leone.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <Link to={feature.link} className="block group h-full">
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                  <p className="text-gray-500 flex-grow">{feature.description}</p>
                  
                  <div className="mt-6 flex items-center text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    Explore feature <ArrowRight className="ml-1 w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
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
