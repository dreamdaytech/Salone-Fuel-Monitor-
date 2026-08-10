import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DonateCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden p-8 text-center"
      >
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
          Payment Cancelled
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          The donation process was cancelled or didn't complete successfully. No charges were made to your account.
        </p>
        
        <div className="flex flex-col gap-4">
          <Link
            to="/donate"
            className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="mr-2 -ml-1 w-5 h-5" />
            Try Again
          </Link>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2 -ml-1 w-5 h-5" />
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
