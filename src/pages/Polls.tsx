import React from 'react';
import { Activity } from 'lucide-react';

export default function Polls() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-3xl text-primary mb-6 shadow-inner">
          <Activity className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-surface-900 mb-4 tracking-tight">Polls</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">Participate in community polls and share your voice on the issues that matter most.</p>
        
        <div className="mt-16 bg-white p-16 rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <p className="text-gray-400 font-medium italic">No active polls at the moment. Check back soon!</p>
        </div>
      </div>
    </div>
  );
}
