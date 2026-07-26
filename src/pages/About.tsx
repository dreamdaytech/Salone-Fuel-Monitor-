import React from 'react';
import { Info, Target, Users, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero Section */}
      <div className="bg-surface-900 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl tracking-tight">
            About <span className="text-primary">Salone Fuel Monitor</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-400 leading-relaxed">
            Empowering citizens and businesses in Sierra Leone with real-time fuel price transparency and station monitoring.
          </p>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Mission Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-xs text-primary font-bold tracking-widest uppercase mb-2">Our Mission</h2>
            <p className="text-3xl leading-8 font-extrabold tracking-tight text-surface-900 sm:text-4xl">
              Transparency in every drop
            </p>
            <p className="mt-4 max-w-2xl text-lg text-gray-500 lg:mx-auto">
              We believe that access to accurate, real-time information about fuel availability and pricing is a fundamental right for every citizen.
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-surface-50 p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-4">Accuracy</h3>
                <p className="text-gray-600 leading-relaxed">
                  Providing verified data directly from fuel stations and regulatory bodies to ensure you always have the right information.
                </p>
              </div>

              <div className="bg-surface-50 p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-4">Community</h3>
                <p className="text-gray-600 leading-relaxed">
                  Building a platform that serves the needs of drivers, station owners, and the general public across Sierra Leone.
                </p>
              </div>

              <div className="bg-surface-50 p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-4">Trust</h3>
                <p className="text-gray-600 leading-relaxed">
                  Maintaining a secure and reliable platform that users can depend on for their daily transportation and business needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="lg:grid lg:grid-cols-2">
              <div className="p-8 lg:p-20">
                <h2 className="text-3xl font-extrabold text-surface-900 mb-8 tracking-tight">Our Story</h2>
                <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                  <p>
                    Salone Fuel Monitor was born out of a simple observation: finding fuel and knowing the current price shouldn't be a guessing game. In a rapidly changing economy, information is power.
                  </p>
                  <p>
                    Our team of dedicated developers and industry experts came together to build a solution that bridges the gap between fuel stations and consumers. We started with a small pilot in Freetown and are now expanding to cover the entire country.
                  </p>
                  <p>
                    Today, we serve thousands of users daily, helping them save time, money, and stress by providing the most up-to-date fuel data available in Sierra Leone.
                  </p>
                </div>
              </div>
              <div className="relative h-96 lg:h-auto">
                <img
                  className="absolute inset-0 w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1527018601619-a508a2be00cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                  alt="Fuel station"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent lg:from-white/10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
