import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Building2, MapPin, Fuel, CheckCircle, XCircle, Target, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoriteContext';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to fix map sizing issues
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Component to handle map clicks for location picking
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface Station {
  id: string;
  name: string;
  location: string;
  district: string;
  brand: string;
  latitude?: number;
  longitude?: number;
  isVerified?: boolean;
  prices: Record<string, number>;
  isOutOfStock?: boolean;
  ownerId?: string | null;
  claimStatus?: 'unclaimed' | 'pending' | 'claimed';
}

interface AdminStationMapProps {
  stations: Station[];
  showTitle?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  onStationSelect?: (station: any) => void;
}

const isStationOutOfStock = (station: Station) => {
  return station.isOutOfStock === true;
};

export default function AdminStationMap({ 
  stations, 
  showTitle = true, 
  onLocationSelect,
  selectedLocation,
  onStationSelect
}: AdminStationMapProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'out_of_stock'>('all');

  // Center of Sierra Leone
  const center: [number, number] = [8.4605, -11.7799];
  
  // Sierra Leone approximate bounds
  const bounds: L.LatLngBoundsExpression = [
    [6.9, -13.3], // Southwest
    [10.0, -10.2] // Northeast
  ];
  
  // Filter stations to ensure they have coordinates and are within a reasonable range for Sierra Leone
  const stationsWithCoords = stations.filter(s => 
    s.latitude && 
    s.longitude && 
    s.latitude > 6 && s.latitude < 11 && 
    s.longitude < -10 && s.longitude > -14
  );

  const totalWithCoords = stationsWithCoords.length;
  const availableStations = stationsWithCoords.filter(s => !isStationOutOfStock(s));
  const outOfStockStations = stationsWithCoords.filter(s => isStationOutOfStock(s));

  const filteredMarkers = stationsWithCoords.filter(s => {
    if (availabilityFilter === 'all') return true;
    const outOfStock = isStationOutOfStock(s);
    if (availabilityFilter === 'available') return !outOfStock;
    if (availabilityFilter === 'out_of_stock') return outOfStock;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
      {showTitle && (
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-surface-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Station Distribution Map
            </h3>
            <p className="text-xs text-gray-500 mt-1">Visualizing {stationsWithCoords.length} stations within Sierra Leone</p>
          </div>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span>Verified Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span>Pending Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>Out Of Stock</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 relative z-0">
        {/* Floating Category Filter & Legend */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl p-3 shadow-xl max-w-[220px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 shadow-none">Stock Availability</p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setAvailabilityFilter('all')}
              className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all outline-none ${
                availabilityFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                All Stations
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-slate-200/50 text-slate-800 font-black">{totalWithCoords}</span>
            </button>

            <button
              onClick={() => setAvailabilityFilter('available')}
              className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all outline-none ${
                availabilityFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                In Stock
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-emerald-100/50 text-emerald-800 font-black">{availableStations.length}</span>
            </button>

            <button
              onClick={() => setAvailabilityFilter('out_of_stock')}
              className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all outline-none ${
                availabilityFilter === 'out_of_stock'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                  : 'bg-red-50 text-red-700 hover:bg-red-100/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Out Of Stock
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-red-100/50 text-red-800 font-black">{outOfStockStations.length}</span>
            </button>
          </div>
        </div>

        <MapContainer 
          center={center} 
          zoom={8} 
          minZoom={7}
          maxBounds={bounds}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapResizer />
          <MapClickHandler onLocationSelect={onLocationSelect} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Selected Location Marker */}
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={L.divIcon({
                className: 'selected-location-icon',
                html: `<div class="w-10 h-10 rounded-full border-4 border-white shadow-2xl flex items-center justify-center bg-primary animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                      </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              })}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="p-2 text-center">
                  <p className="font-bold text-surface-900">Reference Location</p>
                  <p className="text-xs text-gray-500">Showing stations near this point</p>
                </div>
              </Popup>
            </Marker>
          )}

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            showCoverageOnHover={false}
          >
            {filteredMarkers.map((station) => {
              const outOfStock = isStationOutOfStock(station);
              const markerBgColor = outOfStock ? 'bg-red-500' : (station.isVerified ? 'bg-emerald-500' : 'bg-amber-500');
              const statusIndicatorBg = outOfStock ? 'bg-red-50 text-red-600 border-red-100' : (station.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100');
              
              return (
                <Marker 
                  key={station.id} 
                  position={[station.latitude!, station.longitude!]}
                  icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="relative w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${markerBgColor}">
                            ${outOfStock ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border border-white rounded-full flex items-center justify-center font-black text-[7px] text-white">!</div>` : ''}
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22L15 22"/><path d="M4 9L15 9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
                          </div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32]
                  })}
                >
                  <Popup className="station-popup">
                    <div className="p-1 min-w-[200px]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg border ${statusIndicatorBg}`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 leading-tight">{station.name}</h4>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{station.brand}</p>
                          </div>
                        </div>
                        {user && (
                          <button
                            onClick={() => toggleFavorite(station.id)}
                            className={`p-1 border transition-all rounded-lg ${
                              isFavorite(station.id)
                                ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100'
                                : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-rose-500 hover:bg-rose-50'
                            }`}
                            title={isFavorite(station.id) ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFavorite(station.id) ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {station.location}, {station.district}
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          {station.isVerified ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <XCircle className="w-3 h-3" /> Pending
                            </span>
                          )}

                          {outOfStock ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
                              Out Of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 mb-3">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Current Prices</div>
                        {outOfStock ? (
                          <p className="text-xs font-bold text-red-500 text-center py-1">No Fuel Available</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(station.prices).map(([fuel, price]) => (
                              <div key={fuel} className="flex flex-col">
                                <span className="text-[10px] text-gray-500">{fuel}</span>
                                <span className="text-xs font-bold text-gray-900">Le {price.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {onStationSelect && (
                        <button
                          onClick={() => onStationSelect(station)}
                          className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}
