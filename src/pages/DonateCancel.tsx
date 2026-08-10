import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DonateCancel() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] pt-24 pb-32">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="flex-grow flex items-start justify-center px-4 -mt-24 relative z-20 pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-gray-100"
        >
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
        
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Payment Cancelled
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            The donation process was cancelled or didn't complete successfully. No charges were made to your account.
          </p>
        
          <div className="flex flex-col gap-4">
            <Link
              to="/donate"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-[#0072C6] to-[#005aa0] hover:from-[#005aa0] hover:to-[#004a80] transition-colors shadow-md shadow-blue-600/20"
            >
              <RotateCcw className="mr-2 -ml-1 w-5 h-5" />
              Try Again
            </Link>
            
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="mr-2 -ml-1 w-5 h-5" />
              Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
