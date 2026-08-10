import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DonateSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden p-8 text-center"
      >
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
          Thank You!
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Your donation has been successfully processed. We truly appreciate your support in keeping Salone Fuel Monitor running and empowering citizens with real-time data.
        </p>
        
        <div className="flex items-center justify-center mb-8 text-red-500">
          <Heart className="w-6 h-6 fill-current animate-pulse" />
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
          <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  );
}
