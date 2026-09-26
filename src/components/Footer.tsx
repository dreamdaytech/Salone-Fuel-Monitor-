import React from 'react';
import { Link } from 'react-router-dom';

const socialLinks = [
  {
    label: 'Facebook',
    shortLabel: 'FB',
    href: 'https://www.facebook.com/salonefuelmonitor/',
  },
  {
    label: 'TikTok',
    shortLabel: 'TT',
    href: 'https://www.tiktok.com/@salonefuelmonitor',
  },
  {
    label: 'WhatsApp Channel',
    shortLabel: 'WA',
    href: 'https://whatsapp.com/channel/0029Vb9SnPdJuyAEbHMPcy2x',
  },
];

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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
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

        <div className="grid gap-8 border-t border-white/20 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Fuel Price Guides</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-blue-100">
              <Link to="/petrol-price-sierra-leone" className="hover:text-white transition-colors">Petrol Price in Sierra Leone</Link>
              <Link to="/diesel-price-sierra-leone" className="hover:text-white transition-colors">Diesel Price in Sierra Leone</Link>
              <Link to="/kerosene-price-sierra-leone" className="hover:text-white transition-colors">Kerosene Price in Sierra Leone</Link>
              <Link to="/price-trends" className="hover:text-white transition-colors">Fuel Price History</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Research &amp; Explainers</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-blue-100">
              <Link to="/blog/why-fuel-prices-change-in-sierra-leone" className="hover:text-white transition-colors">Why Fuel Prices Change</Link>
              <Link to="/blog/sierra-leone-fuel-price-history-2026" className="hover:text-white transition-colors">2026 Fuel Price Timeline</Link>
              <Link to="/blog/sierra-leone-vs-liberia-fuel-prices" className="hover:text-white transition-colors">Sierra Leone vs Liberia</Link>
              <Link to="/blog/sierra-leone-vs-ghana-fuel-prices" className="hover:text-white transition-colors">Sierra Leone vs Ghana</Link>
              <Link to="/blog/sierra-leone-vs-nigeria-fuel-prices" className="hover:text-white transition-colors">Sierra Leone vs Nigeria</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Fuel Intelligence</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-blue-100">
              <Link to="/regional-comparison" className="hover:text-white transition-colors">West Africa Fuel Prices</Link>
              <Link to="/barrel-vs-fuel" className="hover:text-white transition-colors">Global Oil vs Pump Prices</Link>
              <Link to="/stations" className="hover:text-white transition-colors">Fuel Stations</Link>
              <Link to="/data-methodology" className="hover:text-white transition-colors">Data Sources &amp; Methodology</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Salone Fuel Monitor</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-blue-100">
              <Link to="/blog" className="hover:text-white transition-colors">Fuel News &amp; Analysis</Link>
              <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link to="/donate" className="hover:text-white transition-colors">Donate Now</Link>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Follow Us</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow Salone Fuel Monitor on ${social.label}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] font-extrabold tracking-tight">
                      {social.shortLabel}
                    </span>
                    <span>{social.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-blue-200">
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} Salone Fuel Monitor. All rights reserved.</p>
            <p className="text-xs text-blue-300 mt-1">Designed with ❤️ by DreamDay Technology</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-4 md:mt-0">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
