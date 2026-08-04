import React, { useState } from 'react';
import { Calculator, Car, Route as RouteIcon, Fuel, Share2, Check } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

export default function CalculatorPage() {
  const [distance, setDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('miles');
  const [efficiency, setEfficiency] = useState('');
  const [efficiencyUnit, setEfficiencyUnit] = useState('km_per_l');
  const [fuelPrice, setFuelPrice] = useState('');

  const calculateCost = () => {
    const distInput = parseFloat(distance);
    const eff = parseFloat(efficiency);
    const price = parseFloat(fuelPrice);

    if (isNaN(distInput) || isNaN(eff) || isNaN(price) || distInput <= 0 || eff <= 0 || price <= 0) {
      return null;
    }

    const distInKm = distanceUnit === 'miles' ? distInput * 1.60934 : distInput;
    const distInMiles = distanceUnit === 'miles' ? distInput : distInput / 1.60934;

    let litersNeeded = 0;
    if (efficiencyUnit === 'km_per_l') {
      litersNeeded = distInKm / eff;
    } else if (efficiencyUnit === 'l_per_100km') {
      litersNeeded = (distInKm * eff) / 100;
    } else if (efficiencyUnit === 'mpg') {
      litersNeeded = distInKm / (eff * 0.425144);
    } else if (efficiencyUnit === 'mpg_uk') {
      litersNeeded = distInKm / (eff * 0.354006);
    } else if (efficiencyUnit === 'miles_per_l') {
      litersNeeded = distInMiles / eff;
    }

    const totalCost = litersNeeded * price;

    return {
      totalCost,
      litersNeeded
    };
  };

  const result = calculateCost();

  const handleShare = async () => {
    if (!result) return;
    
    const text = `My estimated fuel cost for a ${distance} ${distanceUnit === 'miles' ? 'mile' : 'km'} trip is SLE ${result.totalCost.toFixed(2)} (${result.litersNeeded.toFixed(1)}L needed) at SLE ${fuelPrice}/L.\nCalculated via Fuel Price Monitor`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fuel Cost Estimate',
          text: text,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          copyToClipboard(text);
        }
      }
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Results copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy results.');
    });
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] rounded-3xl p-8 sm:p-12 mb-12 text-white shadow-xl shadow-blue-900/10 text-center">
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
              backgroundSize: '60px 60px' 
            }} 
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-6 text-white border border-white/20 backdrop-blur-sm">
              <Calculator className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">Fuel Cost Calculator</h1>
            <p className="text-lg text-blue-100 font-medium">Estimate your travel costs by entering your vehicle's fuel efficiency, distance, and current fuel price.</p>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RouteIcon className="w-4 h-4 text-emerald-500" />
                    Distance
                  </div>
                  <select 
                    value={distanceUnit} 
                    onChange={(e) => setDistanceUnit(e.target.value)}
                    className="bg-transparent border-none text-emerald-600 font-bold focus:ring-0 text-sm cursor-pointer px-0 py-0"
                  >
                    <option value="km">km</option>
                    <option value="miles">miles</option>
                  </select>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder={distanceUnit === 'miles' ? "e.g., 30" : "e.g., 50"}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <div className="text-xs text-gray-500 px-1 space-y-1">
                  <p>Total distance you plan to travel. You can toggle between <strong>kilometers (km)</strong> or <strong>miles</strong> using the dropdown above.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-500" />
                    Fuel Efficiency
                  </div>
                  <select 
                    value={efficiencyUnit} 
                    onChange={(e) => setEfficiencyUnit(e.target.value)}
                    className="bg-transparent border-none text-emerald-600 font-bold focus:ring-0 text-sm cursor-pointer px-0 py-0"
                  >
                    <option value="km_per_l">km/L</option>
                    <option value="l_per_100km">L/100km</option>
                    <option value="miles_per_l">miles/L</option>
                    <option value="mpg">mpg (US)</option>
                    <option value="mpg_uk">mpg (UK)</option>
                  </select>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={efficiency}
                  onChange={(e) => setEfficiency(e.target.value)}
                  placeholder={efficiencyUnit.includes('mpg') ? "e.g., 25" : efficiencyUnit === 'km_per_l' ? "e.g., 12" : efficiencyUnit === 'miles_per_l' ? "e.g., 10" : "e.g., 8"}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <div className="text-xs text-gray-500 px-1 mt-2 space-y-1">
                  <p>How efficiently your vehicle uses fuel. Check your dashboard for this value:</p>
                  <ul className="list-disc pl-4 space-y-0.5 opacity-80">
                    <li><strong>km/L</strong>: Kilometers driven per liter of fuel</li>
                    <li><strong>L/100km</strong>: Liters of fuel used per 100 kilometers</li>
                    <li><strong>miles/L</strong>: Miles driven per liter of fuel</li>
                    <li><strong>mpg</strong>: Miles per gallon (choose US or UK standard)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-emerald-500" />
                  Fuel Price (SLE / Liter)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 px-1">The current price of fuel per liter in Sierra Leonean Leones (SLE) at the pump.</p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500 opacity-5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-emerald-500 opacity-5 rounded-full blur-3xl"></div>
              
              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2 z-10">Estimated Cost</h3>
              <div className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 z-10">
                {result ? (
                  <>
                    SLE <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">{result.totalCost.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-gray-300">SLE 0.00</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full z-10 mb-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Distance</p>
                  <p className="text-lg font-bold text-gray-900">{result ? parseFloat(distance).toLocaleString() : '0'} <span className="text-sm text-gray-500">{distanceUnit === 'miles' ? 'miles' : 'km'}</span></p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fuel Needed</p>
                  <p className="text-lg font-bold text-gray-900">{result ? result.litersNeeded.toFixed(1) : '0.0'} <span className="text-sm text-gray-500">L</span></p>
                </div>
              </div>
              
              {result && (
                <div className="z-10 w-full mt-2">
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-emerald-700 border-emerald-200 hover:border-emerald-300 transition-all rounded-xl py-6"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share Result</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
