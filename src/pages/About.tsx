import React, { useState, useEffect } from 'react';
import { Info, Target, Users, ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';
import { Partner } from '../types/partner';

export default function About() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'partners'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Partner[];
      setPartners(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] py-24">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl tracking-tight">
            About <span className="text-blue-100">Salone Fuel Monitor</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100 leading-relaxed">
            Empowering citizens and businesses in Sierra Leone with real-time fuel price transparency and station monitoring.
          </p>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
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

      {/* Strategic Affiliations Section */}
      {partners.length > 0 && (
        <div className="py-24 bg-surface-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-surface-900 mb-4 tracking-tight">
              Strategic Affiliations
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-16">
              Trusted Partners & Supporters who help us make fuel data transparent and accessible across Sierra Leone.
            </p>

            <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-center">
              {partners.map(partner => (
                <div key={partner.id} className="group relative flex flex-col items-center">
                  {partner.websiteUrl ? (
                    <a 
                      href={partner.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-48 h-32 md:w-56 md:h-36 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center hover:shadow-md hover:border-blue-200 transition-all"
                    >
                      <img 
                        src={partner.logoUrl} 
                        alt={partner.name} 
                        className="max-w-full max-h-full object-contain filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                      />
                      <div className="absolute -top-2 -right-2 bg-blue-100 text-blue-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </a>
                  ) : (
                    <div className="block w-48 h-32 md:w-56 md:h-36 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center hover:shadow-md transition-all">
                      <img 
                        src={partner.logoUrl} 
                        alt={partner.name} 
                        className="max-w-full max-h-full object-contain filter grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                      />
                    </div>
                  )}
                  <span className="mt-4 text-sm font-medium text-gray-600">{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
