import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A]">
      <div 
        className="absolute inset-0 opacity-10"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
          backgroundSize: '60px 60px' 
        }} 
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        
        {/* Call to action section styled like the banner header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-14">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
              Have questions or feedback?
            </h2>
            <p className="text-blue-100 text-base max-w-xl">
              We're always looking for ways to improve Salone Fuel Monitor. Reach out to us if you have suggestions or need support.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0 mt-4 sm:mt-0">
            <Link 
              to="/contact"
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors border border-white/20 shadow-sm"
            >
              Contact Support
            </Link>
          </div>
        </div>

        {/* Footer links section */}
        <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-blue-200">
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} Salone Fuel Monitor. All rights reserved.</p>
            <p className="text-xs text-blue-300 mt-1">Designed with ❤️ by DreamDay Technology</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-4 md:mt-0">
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
