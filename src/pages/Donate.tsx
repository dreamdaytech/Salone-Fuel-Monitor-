import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const presetAmounts = [
  { value: 50, label: 'SLE 50' },
  { value: 100, label: 'SLE 100' },
  { value: 250, label: 'SLE 250' },
  { value: 500, label: 'SLE 500' },
];

export default function Donate() {
  const [amount, setAmount] = useState<number | ''>(100);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 10) {
      setError("Minimum donation amount is SLE 10.");
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
        // Redirect to Monime Hosted Checkout
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header section */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6"
          >
            <Heart className="w-8 h-8 fill-current" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Support Salone Fuel Monitor
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your contributions help us keep the platform running, providing real-time data, and empowering citizens across Sierra Leone.
          </p>
        </div>

        {/* Donation Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6 sm:p-10">
            <form onSubmit={handleDonate} className="space-y-8">
              
              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Select Donation Amount (SLE)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setAmount(preset.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        amount === preset.value
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">SLE</span>
                  </div>
                  <input
                    type="number"
                    min="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="block w-full pl-14 pr-4 py-4 text-lg bg-gray-50 dark:bg-gray-900 border-0 rounded-xl ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:text-white transition-all"
                    placeholder="Other Amount"
                    required
                  />
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:text-white transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:text-white transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting to Secure Checkout...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 fill-current" />
                    Donate SLE {amount || '0'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Payments securely processed by Monime</span>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
