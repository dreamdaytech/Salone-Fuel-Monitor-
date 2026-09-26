import React from 'react';
import { Link } from 'react-router-dom';
import {
  Car, Fuel, Navigation, Wrench, FileText, ShieldCheck,
  ArrowRight, CheckCircle2, Gauge, Receipt, MapPin
} from 'lucide-react';

const features = [
  {
    icon: Car,
    title: 'Manage Your Vehicles',
    description: 'Keep your vehicles in one place with make, model, year, plate number, fuel type and primary-vehicle settings.'
  },
  {
    icon: Navigation,
    title: 'Track Dispatches & Trips',
    description: 'Record trip destinations, purpose, odometer readings and completed distance for a clearer travel history.'
  },
  {
    icon: Fuel,
    title: 'Record Fuel Fill-ups',
    description: 'Log litres, cost per litre, station, payment method and total fuel spend for each vehicle.'
  },
  {
    icon: Wrench,
    title: 'Maintenance Records',
    description: 'Keep a simple service history with maintenance type, cost, odometer reading, mechanic or workshop and notes.'
  },
  {
    icon: FileText,
    title: 'Download Reports',
    description: 'Export useful PDF reports for fuel logs, maintenance records and your overall vehicle activity.'
  },
  {
    icon: MapPin,
    title: 'Connect With Fuel Stations',
    description: 'Use your primary vehicle fuel type with Salone Fuel Monitor to quickly find relevant fuel-station information.'
  }
];

export default function MyGaragePublic() {
  return (
    <div className="bg-surface-50">
      <section className="relative overflow-hidden bg-surface-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_38%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 mb-6">
                <Car className="w-4 h-4" />
                Personal vehicle & fuel tracker
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                My Garage
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-gray-300 max-w-2xl leading-relaxed">
                A simple way to manage your vehicles, track trips, record fuel purchases, monitor maintenance and understand what your vehicle is really costing you.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-white hover:bg-primary-hover transition-colors shadow-lg shadow-emerald-900/30">
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-bold text-white hover:bg-white/10 transition-colors">
                  Sign In to My Garage
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                {['Private to your account', 'No spreadsheet required', 'Built for everyday vehicle owners'].map(item => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-7 shadow-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white p-5 text-surface-900">
                  <Car className="w-8 h-8 text-primary mb-5" />
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Vehicles</p>
                  <p className="mt-1 text-2xl font-black">All in one place</p>
                </div>
                <div className="rounded-2xl bg-emerald-500 p-5 text-white">
                  <Gauge className="w-8 h-8 mb-5" />
                  <p className="text-xs uppercase tracking-wider text-emerald-100 font-bold">Trips</p>
                  <p className="mt-1 text-2xl font-black">Track distance</p>
                </div>
                <div className="rounded-2xl bg-blue-600 p-5 text-white">
                  <Fuel className="w-8 h-8 mb-5" />
                  <p className="text-xs uppercase tracking-wider text-blue-100 font-bold">Fuel</p>
                  <p className="mt-1 text-2xl font-black">Monitor spend</p>
                </div>
                <div className="rounded-2xl bg-white p-5 text-surface-900">
                  <Receipt className="w-8 h-8 text-primary mb-5" />
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Records</p>
                  <p className="mt-1 text-2xl font-black">Export reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">What you can do</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-surface-900">Your personal vehicle records, without the paperwork.</h2>
          <p className="mt-4 text-gray-600 text-lg leading-relaxed">
            My Garage brings your basic vehicle, trip, fuel and maintenance records together so you can make better day-to-day decisions using your own history.
          </p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-primary flex items-center justify-center mb-5">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-surface-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-7 sm:p-10 flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-3">
              <ShieldCheck className="w-5 h-5" /> Your garage is personal
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-surface-900">Start keeping better vehicle records today.</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Sign in to create your private garage. Your vehicles, dispatches, fuel logs and maintenance records are associated with your account and are not published as public listings.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 shrink-0">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-white hover:bg-primary-hover transition-colors">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/stations" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3.5 font-bold text-surface-800 hover:bg-gray-50 transition-colors">
              Browse Fuel Stations
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
