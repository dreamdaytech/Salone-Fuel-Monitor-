import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
  MapMouseEvent
} from '@vis.gl/react-google-maps';
import { Search, MapPin, Navigation, Info, Copy, Check, Loader2, Fuel, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { collection, onSnapshot, query, db, handleFirestoreError, OperationType } from '../firebase';

// Sierra Leone Center Coordinates
const SIERRA_LEONE_CENTER = { lat: 8.4606, lng: -11.7799 };
const DEFAULT_ZOOM = 8;

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface Station {
  id: string;
  name: string;
  district: string;
  location: string;
  brand: string;
  isVerified?: boolean;
  latitude?: number;
  longitude?: number;
  isSuspended?: boolean;
  status?: string;
  isPublished?: boolean;
}

const PlaceAutocomplete = ({ onPlaceSelect }: { onPlaceSelect: (place: google.maps.places.PlaceResult) => void }) => {
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const placesLib = useMapsLibrary('places');
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!placesLib || !map) return;
    autocompleteService.current = new placesLib.AutocompleteService();
    placesService.current = new placesLib.PlacesService(map);
  }, [placesLib, map]);

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input || !autocompleteService.current) {
        setPredictions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await autocompleteService.current.getPlacePredictions({
          input,
          componentRestrictions: { country: 'sl' }, // Restrict to Sierra Leone
          types: ['geocode', 'establishment']
        });
        setPredictions(response.predictions || []);
        setIsDropdownOpen(true);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue) fetchPredictions(inputValue);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, fetchPredictions]);

  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    setInputValue(prediction.description);
    setIsDropdownOpen(false);
    setLoading(true);

    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ['geometry', 'formatted_address', 'name'] },
      (place, status) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          onPlaceSelect(place);
        }
      }
    );
  };

  return (
    <div className="relative w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => predictions.length > 0 && setIsDropdownOpen(true)}
          placeholder="Search for a location in Sierra Leone..."
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-base font-medium placeholder:text-gray-400 shadow-sm"
        />
      </div>

      <AnimatePresence>
        {isDropdownOpen && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {predictions.map((prediction) => (
              <Button
                key={prediction.place_id}
                onClick={() => handlePredictionSelect(prediction)}
                variant="unstyled"
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0"
                showNotification={false}
              >
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{prediction.structured_formatting.main_text}</p>
                  <p className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</p>
                </div>
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MapEvents = ({ onMapClick }: { onMapClick: (e: MapMouseEvent) => void }) => {
  return (
    <Map
      defaultCenter={SIERRA_LEONE_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      onClick={onMapClick}
      mapId="bf51a910020fa25a" // Example Map ID for Advanced Markers
      className="w-full h-full rounded-3xl"
      disableDefaultUI={false}
      gestureHandling={'greedy'}
    />
  );
};

const StationMarker = ({ station }: { station: Station }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: station.latitude!, lng: station.longitude! }}
        onClick={() => setOpen(true)}
      >
        <div className="relative flex items-center justify-center cursor-pointer">
          <div className="absolute w-8 h-8 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className={`relative w-8 h-8 ${station.isVerified ? 'bg-emerald-600' : 'bg-amber-500'} rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-transform hover:scale-110`}>
            <Fuel className="w-4 h-4 text-white" />
          </div>
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-2 min-w-[210px] text-gray-900 font-sans max-w-sm">
            <h4 className="font-extrabold text-sm text-gray-900 leading-snug mb-1">{station.name}</h4>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${station.isVerified ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              <span className="text-xs font-bold text-gray-600">
                {station.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2 leading-relaxed flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>{station.location}, {station.district}</span>
            </p>
            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <a
                href={`/?station=${station.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 py-1 px-2 hover:bg-emerald-50 rounded-lg transition-colors outline-none"
              >
                <span>View Details</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default function LocationPickerPage() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [mapCenter, setMapCenter] = useState(SIERRA_LEONE_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [copied, setCopied] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const geocoderLib = useMapsLibrary('geocoding');
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'stations'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const stationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Station[];

        // Filter approved and published/active stations with valid coordinates client-side
        const activeStations = stationData.filter(s => 
          s.latitude && 
          s.longitude && 
          s.latitude > 6 && s.latitude < 11 && 
          s.longitude < -10 && s.longitude > -14 &&
          s.isSuspended !== true &&
          (s.status === 'approved' || !s.status)
        );
        setStations(activeStations);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'stations');
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (geocoderLib) {
      geocoder.current = new geocoderLib.Geocoder();
    }
  }, [geocoderLib]);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!geocoder.current) return;

    geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        setSelectedLocation({
          lat,
          lng,
          address: results[0].formatted_address
        });
      } else {
        setSelectedLocation({
          lat,
          lng,
          address: 'Unknown Location'
        });
      }
    });
  }, []);

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    const location = place.geometry?.location;
    if (!location) return;

    const lat = location.lat();
    const lng = location.lng();

    setSelectedLocation({
      lat,
      lng,
      address: place.formatted_address || place.name || 'Selected Location'
    });
    setMapCenter({ lat, lng });
    setZoom(15);
  };

  const handleMapClick = (e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    const { lat, lng } = e.detail.latLng;
    reverseGeocode(lat, lng);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        reverseGeocode(latitude, longitude);
        setMapCenter({ lat: latitude, lng: longitude });
        setZoom(15);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const copyToClipboard = () => {
    if (!selectedLocation) return;
    const text = `Lat: ${selectedLocation.lat}, Lng: ${selectedLocation.lng}\nAddress: ${selectedLocation.address}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">API Key Missing</h2>
          <p className="text-gray-600 mb-6">
            Please add your Google Maps API Key to the <code className="bg-gray-100 px-2 py-1 rounded text-red-600">.env</code> file as <code className="bg-gray-100 px-2 py-1 rounded text-red-600">VITE_GOOGLE_MAPS_API_KEY</code>.
          </p>
          <div className="text-sm text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="font-bold mb-2">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-500">
              <li>Go to Google Cloud Console</li>
              <li>Enable Maps JavaScript API and Places API</li>
              <li>Create an API Key</li>
              <li>Add it to your environment variables</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Location Picker</h1>
              <p className="text-gray-500 font-medium">Select a location in Sierra Leone</p>
            </div>
            <Button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              variant="primary"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
              showNotification={false}
            >
              {isLocating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
              Use My Current Location
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search and Details */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Search Location</h2>
                <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} />
              </div>

              <AnimatePresence>
                {selectedLocation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-6 rounded-3xl shadow-xl border border-primary/10 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4">
                      <Button
                        onClick={copyToClipboard}
                        variant="unstyled"
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        title="Copy details"
                        showNotification={false}
                      >
                        {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                      </Button>
                    </div>

                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Selected Details</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Address</p>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{selectedLocation.address}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Latitude</p>
                          <p className="text-sm font-mono font-bold text-gray-700">{selectedLocation.lat.toFixed(6)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Longitude</p>
                          <p className="text-sm font-mono font-bold text-gray-700">{selectedLocation.lng.toFixed(6)}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <Button 
                          variant="primary"
                          className="w-full py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                          onClick={() => alert('Location saved successfully!\n' + JSON.stringify(selectedLocation, null, 2))}
                          showNotification={false}
                        >
                          Confirm & Save Location
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!selectedLocation && (
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm flex-shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900 mb-1">How to select?</p>
                    <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                      You can search for a place using the input above, use your current GPS location, or simply click anywhere on the map to pick a point.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Map View */}
            <div className="lg:col-span-2 h-[600px] bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
              <Map
                center={mapCenter}
                zoom={zoom}
                onCenterChanged={(e) => setMapCenter(e.detail.center)}
                onZoomChanged={(e) => setZoom(e.detail.zoom)}
                onClick={handleMapClick}
                mapId="bf51a910020fa25a"
                className="w-full h-full"
                disableDefaultUI={false}
                gestureHandling={'greedy'}
              >
                {selectedLocation && (
                  <AdvancedMarker
                    position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                    title={selectedLocation.address}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping" />
                      <div className="relative w-8 h-8 bg-primary rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </AdvancedMarker>
                )}

                {stations.map((station) => (
                  <StationMarker key={station.id} station={station} />
                ))}
              </Map>
            </div>
          </div>
        </div>
      </div>
    </APIProvider>
  );
}
