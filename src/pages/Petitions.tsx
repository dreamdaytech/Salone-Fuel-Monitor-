import React from 'react';
import { PenTool } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Petitions() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-3xl text-primary mb-6 shadow-inner">
          <PenTool className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-surface-900 mb-4 tracking-tight">Petitions</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">Start or sign petitions to advocate for change in fuel pricing and availability.</p>
        
        <div className="mt-16 bg-white p-16 rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
            <PenTool className="w-8 h-8" />
          </div>
          <p className="text-gray-400 font-medium italic">No petitions found. Be the first to start one!</p>
          <Button 
            variant="primary"
            className="mt-8 px-8 py-3 font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            showNotification={false}
          >
            Create Petition
          </Button>
        </div>
      </div>
    </div>
  );
}
