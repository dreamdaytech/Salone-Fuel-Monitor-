import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="py-24 bg-surface-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl font-extrabold text-white mb-6 tracking-tight">Have questions or feedback?</h2>
        <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
          We're always looking for ways to improve SL Fuel Monitor. Reach out to us if you have suggestions or need support.
        </p>
        <Link 
          to="/contact"
          className="inline-flex items-center px-10 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-primary hover:bg-primary-hover transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
        >
          Contact Support
        </Link>

        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p>&copy; {new Date().getFullYear()} SL Fuel Monitor. All rights reserved.</p>
            <p className="text-xs text-slate-500 mt-1">Designed with ❤️ by DreamDay Technology</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none"></div>
    </footer>
  );
}
