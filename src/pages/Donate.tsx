import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2, ArrowRight, ShieldCheck, Lock, Coffee, Star, Rocket, Server, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const presetAmounts = [
  { value: 100, label: '100 SLE' },
  { value: 250, label: '250 SLE' },
  { value: 500, label: '500 SLE' },
  { value: 1000, label: '1,000 SLE' },
  { value: 2500, label: '2,500 SLE' },
];

export default function Donate() {
  const [amount, setAmount] = useState<number | ''>(100);
  const [currency, setCurrency] = useState<'SLE'>('SLE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 10) {
      setError("Minimum donation amount is 10 SLE.");
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/monime/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, name, email })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment gateway.');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while connecting to the payment provider.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] py-24 pb-32">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-bold tracking-wide uppercase mb-8 border border-white/20 backdrop-blur-sm"
          >
            <Heart className="w-4 h-4 fill-current text-white" />
            Support Our Mission
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6"
          >
            Fuel the Future of<br/>
            <span className="text-blue-200">Transparency</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-3xl mx-auto"
          >
            Salone Fuel Monitor is free for all citizens. Your donations help us maintain server infrastructure, develop new features, and expand our platform across Sierra Leone.
          </motion.p>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-20 -mt-20">
        {/* Tiers Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white mb-3 drop-shadow-md">Every contribution matters</h2>
          <p className="text-blue-100 font-medium">Choose a tier that feels right for you. No amount is too small.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1 */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center hover:shadow-xl transition-shadow shadow-sm">
            <div className="w-16 h-16 mx-auto bg-[#fff9db] text-[#f59f00] rounded-2xl flex items-center justify-center mb-6 border border-[#ffe89e]">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-surface-900 mb-2">Supporter</h3>
            <p className="text-gray-500 text-sm mb-6 h-10">Buy us a coffee and keep the lights on.</p>
            <div className="text-[#f59f00] font-extrabold text-lg">SLE 100 – 250</div>
          </div>

          {/* Tier 2 */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center hover:shadow-xl transition-shadow shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#0072C6]"></div>
            <div className="w-16 h-16 mx-auto bg-[#e6f2ff] text-[#0072C6] rounded-2xl flex items-center justify-center mb-6 border border-[#cce4ff]">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-surface-900 mb-2">Contributor</h3>
            <p className="text-gray-500 text-sm mb-6 h-10">Help us ship new features and improvements.</p>
            <div className="text-[#0072C6] font-extrabold text-lg">SLE 500 – 1,000</div>
          </div>

          {/* Tier 3 */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center hover:shadow-xl transition-shadow shadow-sm">
            <div className="w-16 h-16 mx-auto bg-[#ede9ff] text-[#7048e8] rounded-2xl flex items-center justify-center mb-6 border border-[#e0d6ff]">
              <Rocket className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-surface-900 mb-2">Champion</h3>
            <p className="text-gray-500 text-sm mb-6 h-10">Power our mission to keep the platform free for all.</p>
            <div className="text-[#7048e8] font-extrabold text-lg">SLE 2,500+</div>
          </div>
        </div>
      </div>

      {/* Main Donation Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-10 shadow-sm">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <h2 className="text-2xl font-extrabold text-surface-900 mb-2">Make a Donation</h2>
                <p className="text-gray-500 text-sm">Choose your currency and amount to proceed.</p>
              </div>

              <form onSubmit={handleDonate} className="space-y-8">
                
                {/* Currency */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase mb-3">
                    Currency
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 bg-surface-900 text-white font-bold py-3.5 px-4 rounded-xl border border-surface-900 shadow-md"
                    >
                      <div className="w-4 h-4 rounded-full border-4 border-blue-500 bg-white"></div>
                      SLE (Leone)
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex items-center justify-center gap-2 bg-white text-gray-400 font-bold py-3.5 px-4 rounded-xl border border-gray-200 cursor-not-allowed opacity-60"
                      title="USD payments coming soon"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                      $ USD (Coming Soon)
                    </button>
                  </div>
                </div>

                {/* Amount Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase mb-3">
                    Amount
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-4">
                    {presetAmounts.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setAmount(preset.value)}
                        className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border ${
                          amount === preset.value
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-bold">SLE</span>
                    </div>
                    <input
                      type="number"
                      min="10"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="block w-full pl-14 pr-4 py-4 text-base bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072C6] focus:border-[#0072C6] transition-all font-medium text-surface-900 placeholder-gray-400"
                      placeholder="Custom amount"
                      required
                    />
                  </div>
                </div>

                {/* Personal Info */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase mb-3">
                    Your Details (Optional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-4 py-3.5 text-base bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072C6] transition-all"
                      placeholder="Full Name"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-4 py-3.5 text-base bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072C6] transition-all"
                      placeholder="Email Address"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0072C6] to-[#005aa0] hover:from-[#005aa0] hover:to-[#004a80] text-white font-bold py-4.5 px-8 rounded-xl shadow-lg shadow-[#0072C6]/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      Donate Now <ArrowRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>
                
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 mt-6">
                  <Lock className="w-4 h-4" />
                  <span>Secure checkout powered by Monime.</span>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Where money goes */}
            <div className="bg-[#0f172a] text-white rounded-[2rem] p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="w-6 h-6 text-[#1EB53A]" />
                <h3 className="text-xl font-extrabold">Where your money goes</h3>
              </div>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Server className="w-5 h-5 text-[#1EB53A]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Platform Hosting & Security</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Keeping user data secure and servers running 24/7 requires robust infrastructure.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Community Outreach</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Funding offline awareness campaigns in rural districts to ensure diverse voices are heard.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Independent Moderation</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Supporting the team that verifies data and ensures the platform remains accurate and non-partisan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Corporate Donations */}
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-[2rem] p-8">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Corporate Donations</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Represent an organization that wishes to support data transparency? We offer partnership packages.
              </p>
              <Link to="/contact" className="text-sm font-bold text-[#0072C6] hover:text-[#005aa0] flex items-center gap-1 group">
                Contact our partnerships team 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
        </div>
      </div>
      </div>
    </div>
  );
}
