/**
 * MyGarage.tsx — Personal Dispatch & Fuel Tracker
 * Salone Fuel Monitor — Personal use module
 *
 * Tabs:
 *  1. My Vehicles  — add/edit/delete personal vehicles
 *  2. Dispatches   — log trips with odometer in/out
 *  3. Fuel Logs    — record fill-ups, charts, PDF export
 *
 * Data is stored in Firestore sub-collections:
 *   users/{uid}/vehicles, /dispatches, /fuel_logs
 *
 * No Brahim Investment code or data is touched.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  db, collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, where
} from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car, Fuel, Navigation, Plus, X, Edit2, Trash2,
  ChevronRight, ArrowLeft, Download, Filter, Search,
  CheckCircle2, Clock, AlertCircle, BarChart3, TrendingUp,
  Gauge, MapPin, Calendar, Receipt, CreditCard, FileText,
  Droplets, Loader2, RefreshCw, ExternalLink, Info,
  Wrench, Settings
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBase64, drawPdfHeader } from '../utils/pdfUtils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GarageVehicle {
  id: string;
  vehicleType?: typeof VEHICLE_TYPES[number];
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  fuelType: 'Petrol' | 'Diesel' | 'Kerosene';
  color?: string;
  notes?: string;
  isPrimary?: boolean;
  createdAt?: any;
}

interface GarageDispatch {
  id: string;
  vehicleId: string;
  date: string;
  odometerOut: number;
  odometerIn?: number;
  destination: string;
  purposeOfTrip: string;
  distanceKm?: number;
  status: 'Active' | 'Completed';
  notes?: string;
  createdAt?: any;
}

interface GarageFuelLog {
  id: string;
  vehicleId: string;
  dispatchId?: string;
  date: string;
  time?: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  stationName: string;
  location?: string;
  paymentMethod?: 'Cash' | 'Mobile Money' | 'Fuel Card' | 'Voucher';
  receiptNumber?: string;
  fuelType?: 'Petrol' | 'Diesel' | 'Kerosene';
  notes?: string;
  createdAt?: any;
}

interface GarageMaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;
  serviceType: string;
  cost: number;
  odometerReading?: number;
  mechanicOrShop?: string;
  notes?: string;
  receiptNumber?: string;
  createdAt?: any;
}

interface GarageServiceType {
  id: string;
  name: string;
  createdAt?: any;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VEHICLE_TYPES = ['Bus', 'Car', 'Ferry', 'Keke', 'Okada', 'Poda Poda', 'Other'] as const;
const FUEL_TYPES = ['Petrol', 'Diesel', 'Kerosene'] as const;
const PAYMENT_METHODS = ['Cash', 'Mobile Money', 'Fuel Card', 'Voucher'] as const;
const SL_DISTRICTS = [
  'Western Area Urban', 'Western Area Rural', 'Bo', 'Bonthe', 'Moyamba',
  'Pujehun', 'Kailahun', 'Kenema', 'Kono', 'Bombali', 'Falaba',
  'Koinadugu', 'Tonkolili', 'Kambia', 'Karene', 'Port Loko'
];
const COLORS = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Grey'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n?: number, digits = 0) =>
  n == null ? '—' : n.toLocaleString('en-SL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const fmtDate = (d?: string) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

const today = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().slice(0, 5);

// ─── Fuel Type Badge ─────────────────────────────────────────────────────────

const FuelBadge = ({ type }: { type: string }) => {
  const c = type === 'Petrol' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : type === 'Diesel' ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${c}`}>
      <Droplets className="w-3 h-3" />{type}
    </span>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isActive ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
      {isActive ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      {status}
    </span>
  );
};

// ─── Modal Wrapper ─────────────────────────────────────────────────────────────

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-surface-900/60 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h3 className="text-base font-bold text-surface-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// ─── Form Field ───────────────────────────────────────────────────────────────

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";
const selectCls = `${inputCls} bg-white`;

// ─── Vehicle Form Modal ───────────────────────────────────────────────────────

const VehicleFormModal = ({ initial, onSave, onClose }: {
  initial?: GarageVehicle;
  onSave: (data: Omit<GarageVehicle, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}) => {
  const [vehicleType, setVehicleType] = useState<typeof VEHICLE_TYPES[number]>(initial?.vehicleType ?? 'Car');
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [year, setYear] = useState(initial?.year ?? '');
  const [plateNumber, setPlateNumber] = useState(initial?.plateNumber ?? '');
  const [fuelType, setFuelType] = useState<GarageVehicle['fuelType']>(initial?.fuelType ?? 'Petrol');
  const [color, setColor] = useState(initial?.color ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isPrimary, setIsPrimary] = useState(initial?.isPrimary ?? false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) { toast.error('Make and Model are required'); return; }
    setSaving(true);
    try {
      await onSave({ vehicleType, make: make.trim(), model: model.trim(), year, plateNumber: plateNumber.trim().toUpperCase(), fuelType, color, notes, isPrimary });
      onClose();
    } catch { toast.error('Failed to save vehicle'); }
    finally { setSaving(false); }
  };

  const years = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <Modal title={initial ? 'Edit Vehicle' : 'Add Vehicle'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-1">
        <Field label="Vehicle Type" required>
          <select className={selectCls} value={vehicleType} onChange={e => setVehicleType(e.target.value as typeof VEHICLE_TYPES[number])}>
            {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Make" required>
            <input className={inputCls} value={make} onChange={e => setMake(e.target.value)} placeholder="e.g. Toyota" />
          </Field>
          <Field label="Model" required>
            <input className={inputCls} value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Corolla" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year">
            <select className={selectCls} value={year} onChange={e => setYear(e.target.value)}>
              <option value="">— Select Year —</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Plate Number">
            <input className={inputCls} value={plateNumber} onChange={e => setPlateNumber(e.target.value)} placeholder="e.g. AWO 668" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fuel Type" required>
            <select className={selectCls} value={fuelType} onChange={e => setFuelType(e.target.value as GarageVehicle['fuelType'])}>
              {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Color">
            <select className={selectCls} value={color} onChange={e => setColor(e.target.value)}>
              <option value="">— Select Color —</option>
              {COLORS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <textarea className={inputCls} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none mb-4">
          <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)}
            className="w-4 h-4 accent-primary rounded" />
          Set as primary vehicle <span className="text-xs text-gray-400">(auto-filters station map)</span>
        </label>
        <button type="submit" disabled={saving}
          className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Car className="w-4 h-4" /> {initial ? 'Update Vehicle' : 'Add Vehicle'}</>}
        </button>
      </form>
    </Modal>
  );
};

// ─── Dispatch Form Modal ───────────────────────────────────────────────────────

const DispatchFormModal = ({ vehicles, initial, onSave, onClose }: {
  vehicles: GarageVehicle[];
  initial?: GarageDispatch;
  onSave: (data: Omit<GarageDispatch, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}) => {
  const primaryVeh = vehicles.find(v => v.isPrimary) ?? vehicles[0];
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? primaryVeh?.id ?? '');
  const [date, setDate] = useState(initial?.date ?? today());
  const [odometerOut, setOdometerOut] = useState(String(initial?.odometerOut ?? ''));
  const [destination, setDestination] = useState(initial?.destination ?? '');
  const [purposeOfTrip, setPurposeOfTrip] = useState(initial?.purposeOfTrip ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) { toast.error('Select a vehicle'); return; }
    if (!destination.trim()) { toast.error('Destination is required'); return; }
    if (!purposeOfTrip.trim()) { toast.error('Purpose is required'); return; }
    setSaving(true);
    try {
      await onSave({
        vehicleId, date, odometerOut: Number(odometerOut) || 0,
        destination: destination.trim(), purposeOfTrip: purposeOfTrip.trim(),
        status: 'Active', notes
      });
      onClose();
    } catch { toast.error('Failed to save dispatch'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? 'Edit Dispatch' : 'Start Dispatch'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Vehicle" required>
          <select className={selectCls} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
            <option value="">— Select Vehicle —</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} {v.plateNumber ? `(${v.plateNumber})` : ''}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="Odometer Out (km)">
            <input type="number" className={inputCls} value={odometerOut} onChange={e => setOdometerOut(e.target.value)} placeholder="0" min={0} />
          </Field>
        </div>
        <Field label="Destination" required>
          <input className={inputCls} value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Kenema" />
        </Field>
        <Field label="Purpose of Trip" required>
          <input className={inputCls} value={purposeOfTrip} onChange={e => setPurposeOfTrip(e.target.value)} placeholder="e.g. Business meeting" />
        </Field>
        <Field label="Notes">
          <textarea className={inputCls} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </Field>
        <button type="submit" disabled={saving}
          className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Navigation className="w-4 h-4" /> {initial ? 'Update Dispatch' : 'Start Dispatch'}</>}
        </button>
      </form>
    </Modal>
  );
};

// ─── Return Dispatch Modal ────────────────────────────────────────────────────

const ReturnModal = ({ dispatch, onReturn, onClose }: {
  dispatch: GarageDispatch;
  onReturn: (odometerIn: number) => Promise<void>;
  onClose: () => void;
}) => {
  const [odometerIn, setOdometerIn] = useState('');
  const [saving, setSaving] = useState(false);

  const dist = odometerIn && Number(odometerIn) > dispatch.odometerOut
    ? Number(odometerIn) - dispatch.odometerOut : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(odometerIn);
    if (!val || val <= dispatch.odometerOut) { toast.error(`Odometer in must be greater than ${dispatch.odometerOut}`); return; }
    setSaving(true);
    try { await onReturn(val); onClose(); }
    catch { toast.error('Failed to record return'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Record Return" onClose={onClose}>
      <div className="bg-emerald-50 rounded-xl p-3 mb-4 text-sm text-emerald-800 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <div><b>Odometer Out:</b> {fmt(dispatch.odometerOut)} km — enter the current reading to complete this dispatch.</div>
      </div>
      <form onSubmit={handleSubmit}>
        <Field label="Odometer In (km)" required>
          <input type="number" className={inputCls} value={odometerIn} onChange={e => setOdometerIn(e.target.value)}
            placeholder={String(dispatch.odometerOut + 1)} min={dispatch.odometerOut + 1} autoFocus />
        </Field>
        {dist != null && (
          <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm font-bold text-blue-700 flex items-center gap-2">
            <Gauge className="w-4 h-4" /> Distance: {fmt(dist)} km
          </div>
        )}
        <button type="submit" disabled={saving}
          className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Complete Dispatch</>}
        </button>
      </form>
    </Modal>
  );
};

// ─── Fuel Log Form Modal ──────────────────────────────────────────────────────

const FuelLogFormModal = ({ vehicles, dispatches, initial, onSave, onClose }: {
  vehicles: GarageVehicle[];
  dispatches: GarageDispatch[];
  initial?: GarageFuelLog;
  onSave: (data: Omit<GarageFuelLog, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}) => {
  const primaryVeh = vehicles.find(v => v.isPrimary) ?? vehicles[0];
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? primaryVeh?.id ?? '');
  const [dispatchId, setDispatchId] = useState(initial?.dispatchId ?? '');
  const [date, setDate] = useState(initial?.date ?? today());
  const [time, setTime] = useState(initial?.time ?? nowTime());
  const [liters, setLiters] = useState(String(initial?.liters ?? ''));
  const [costPerLiter, setCostPerLiter] = useState(String(initial?.costPerLiter ?? ''));
  const [stationName, setStationName] = useState(initial?.stationName ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [paymentMethod, setPaymentMethod] = useState<GarageFuelLog['paymentMethod']>(initial?.paymentMethod ?? 'Cash');
  const [receiptNumber, setReceiptNumber] = useState(initial?.receiptNumber ?? '');
  const [fuelType, setFuelType] = useState<GarageVehicle['fuelType']>(
    initial?.fuelType ?? (vehicles.find(v => v.id === vehicleId)?.fuelType ?? 'Petrol')
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  // auto-set fuel type from vehicle
  useEffect(() => {
    const veh = vehicles.find(v => v.id === vehicleId);
    if (veh) setFuelType(veh.fuelType);
  }, [vehicleId, vehicles]);

  const total = liters && costPerLiter ? (Number(liters) * Number(costPerLiter)) : 0;

  // only active dispatches for selected vehicle
  const relevantDispatches = dispatches.filter(d => d.vehicleId === vehicleId && d.status === 'Active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) { toast.error('Select a vehicle'); return; }
    if (!stationName.trim()) { toast.error('Station name is required'); return; }
    if (!liters || Number(liters) <= 0) { toast.error('Enter valid liters'); return; }
    if (!costPerLiter || Number(costPerLiter) <= 0) { toast.error('Enter cost per liter'); return; }
    setSaving(true);
    try {
      // Build payload — never include undefined (Firestore will reject it)
      const payload: Omit<GarageFuelLog, 'id' | 'createdAt'> = {
        vehicleId,
        date,
        time,
        liters: Number(liters),
        costPerLiter: Number(costPerLiter),
        totalCost: Number(liters) * Number(costPerLiter),
        stationName: stationName.trim(),
        location: location || '',
        paymentMethod,
        receiptNumber: receiptNumber || '',
        fuelType,
        notes: notes || '',
      };
      // Only set dispatchId if actually chosen
      if (dispatchId) payload.dispatchId = dispatchId;

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Fuel log save error:', err);
      toast.error('Failed to save fuel log');
    }
    finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? 'Edit Fuel Log' : 'Log Fuel Fill-up'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Vehicle" required>
          <select className={selectCls} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
            <option value="">— Select Vehicle —</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} {v.plateNumber ? `(${v.plateNumber})` : ''}</option>
            ))}
          </select>
        </Field>
        {relevantDispatches.length > 0 && (
          <Field label="Link to Dispatch (optional)">
            <select className={selectCls} value={dispatchId} onChange={e => setDispatchId(e.target.value)}>
              <option value="">— None —</option>
              {relevantDispatches.map(d => (
                <option key={d.id} value={d.id}>{d.destination} · {fmtDate(d.date)}</option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <input type="time" className={inputCls} value={time} onChange={e => setTime(e.target.value)} />
          </Field>
        </div>
        <Field label="Station Name" required>
          <input className={inputCls} value={stationName} onChange={e => setStationName(e.target.value)} placeholder="e.g. NP Freetown" />
        </Field>
        <Field label="Location / District">
          <select className={selectCls} value={location} onChange={e => setLocation(e.target.value)}>
            <option value="">— Select District —</option>
            {SL_DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Liters" required>
            <input type="number" className={inputCls} value={liters} onChange={e => setLiters(e.target.value)} placeholder="0.00" step="0.01" min={0} />
          </Field>
          <Field label="Cost / Liter (Le)" required>
            <input type="number" className={inputCls} value={costPerLiter} onChange={e => setCostPerLiter(e.target.value)} placeholder="0" min={0} />
          </Field>
        </div>
        {total > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
            <span className="text-sm text-emerald-700 font-medium">Total Cost</span>
            <span className="text-base font-bold text-emerald-800">Le {fmt(total)}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fuel Type">
            <select className={selectCls} value={fuelType} onChange={e => setFuelType(e.target.value as GarageVehicle['fuelType'])}>
              {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Payment Method">
            <select className={selectCls} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as GarageFuelLog['paymentMethod'])}>
              {PAYMENT_METHODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Receipt Number">
          <input className={inputCls} value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Notes">
          <textarea className={inputCls} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </Field>
        <button type="submit" disabled={saving}
          className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Fuel className="w-4 h-4" /> {initial ? 'Update Fuel Log' : 'Save Fuel Log'}</>}
        </button>
      </form>
    </Modal>
  );
};

// ─── Maintenance Form Modal ──────────────────────────────────────────────────

const MaintenanceFormModal = ({
  initial, vehicles, serviceTypes, onSave, onClose
}: {
  initial?: GarageMaintenanceLog;
  vehicles: GarageVehicle[];
  serviceTypes: GarageServiceType[];
  onSave: (data: Omit<GarageMaintenanceLog, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}) => {
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? '');
  const [date, setDate] = useState(initial?.date ?? today());
  const [serviceType, setServiceType] = useState(initial?.serviceType ?? '');
  const [cost, setCost] = useState(initial?.cost?.toString() ?? '');
  const [odometerReading, setOdometerReading] = useState(initial?.odometerReading?.toString() ?? '');
  const [mechanicOrShop, setMechanicOrShop] = useState(initial?.mechanicOrShop ?? '');
  const [receiptNumber, setReceiptNumber] = useState(initial?.receiptNumber ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) { toast.error('Select a vehicle'); return; }
    if (!serviceType) { toast.error('Select a service type'); return; }
    if (!cost || Number(cost) <= 0) { toast.error('Enter valid cost'); return; }
    setSaving(true);
    try {
      const payload: Omit<GarageMaintenanceLog, 'id' | 'createdAt'> = {
        vehicleId,
        date,
        serviceType,
        cost: Number(cost),
        odometerReading: odometerReading ? Number(odometerReading) : undefined,
        mechanicOrShop: mechanicOrShop.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save maintenance log');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";
  const selectCls = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none bg-white";

  return (
    <Modal title={initial ? 'Edit Maintenance' : 'Log Maintenance'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vehicle" required>
            <select className={selectCls} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              <option value="">— Select Vehicle —</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>
              ))}
            </select>
          </Field>
          <Field label="Date" required>
            <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} max={today()} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service Type" required>
            <select className={selectCls} value={serviceType} onChange={e => setServiceType(e.target.value)}>
              <option value="">— Select Type —</option>
              {serviceTypes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              {serviceTypes.length === 0 && <option value="" disabled>No types defined yet</option>}
            </select>
          </Field>
          <Field label="Cost (Le)" required>
            <input type="number" className={inputCls} value={cost} onChange={e => setCost(e.target.value)} placeholder="0" min={0} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Odometer Reading (Optional)">
            <input type="number" className={inputCls} value={odometerReading} onChange={e => setOdometerReading(e.target.value)} placeholder="0" min={0} />
          </Field>
          <Field label="Mechanic / Shop (Optional)">
            <input type="text" className={inputCls} value={mechanicOrShop} onChange={e => setMechanicOrShop(e.target.value)} placeholder="Shop Name" />
          </Field>
        </div>
        <Field label="Receipt Number (Optional)">
          <input type="text" className={inputCls} value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Notes (Optional)">
          <textarea className={inputCls} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Details of service performed..." />
        </Field>
        <button type="submit" disabled={saving}
          className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Wrench className="w-4 h-4" /> {initial ? 'Update Maintenance' : 'Log Maintenance'}</>}
        </button>
      </form>
    </Modal>
  );
};

// ─── Service Type Manager Modal ─────────────────────────────────────────────

const ServiceTypeManagerModal = ({
  serviceTypes, onSave, onDelete, onClose
}: {
  serviceTypes: GarageServiceType[];
  onSave: (data: Omit<GarageServiceType, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) => {
  const [newTypeName, setNewTypeName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: newTypeName.trim() });
      setNewTypeName('');
    } catch {
      toast.error('Failed to add service type');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (st: GarageServiceType) => {
    setEditingId(st.id);
    setEditingName(st.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: editingName.trim() }, id);
      cancelEdit();
    } catch {
      toast.error('Failed to update service type');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Manage Service Types" onClose={onClose}>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input 
          autoFocus
          className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          placeholder="New service type (e.g., Oil Change)"
          value={newTypeName}
          onChange={e => setNewTypeName(e.target.value)}
        />
        <button type="submit" disabled={saving || !newTypeName.trim()} className="bg-primary text-white px-4 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60">
          Add
        </button>
      </form>

      {serviceTypes.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">No service types defined.</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {serviceTypes.map(st => (
            <li key={st.id} className="flex items-center gap-2 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
              {editingId === st.id ? (
                <>
                  <input
                    autoFocus
                    className="flex-1 rounded-lg border border-primary px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEdit(st.id); if (e.key === 'Escape') cancelEdit(); }}
                  />
                  <button
                    onClick={() => handleEdit(st.id)}
                    disabled={saving || !editingName.trim()}
                    className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-surface-900">{st.name}</span>
                  <button
                    onClick={() => startEdit(st)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(st.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

// ─── Master Export Modal ────────────────────────────────────────────────────────

const MasterExportModal = ({
  vehicles, onClose, onExport, exporting
}: {
  vehicles: GarageVehicle[];
  onClose: () => void;
  onExport: (filters: { vehicleId: string; dateRange: string; customStart?: string; customEnd?: string }) => void;
  exporting: boolean;
}) => {
  const [vehicleId, setVehicleId] = useState('All');
  const [dateRange, setDateRange] = useState('AllTime');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  return (
    <Modal title="Master Export" onClose={onClose}>
      <div className="space-y-4 mb-6">
        <Field label="Filter by Vehicle">
          <select className={inputCls} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
            <option value="All">All Vehicles</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>)}
          </select>
        </Field>

        <Field label="Date Range">
          <select className={inputCls} value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="AllTime">All Time</option>
            <option value="Last7Days">Last 7 Days</option>
            <option value="Last30Days">Last 30 Days</option>
            <option value="ThisMonth">This Month</option>
            <option value="ThisYear">This Year</option>
            <option value="Custom">Custom Range...</option>
          </select>
        </Field>

        {dateRange === 'Custom' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <input type="date" className={inputCls} value={customStart} onChange={e => setCustomStart(e.target.value)} />
            </Field>
            <Field label="End Date">
              <input type="date" className={inputCls} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </Field>
          </div>
        )}
      </div>

      <button onClick={() => onExport({ vehicleId, dateRange, customStart, customEnd })} disabled={exporting || (dateRange === 'Custom' && (!customStart || !customEnd))}
        className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</> : <><Download className="w-4 h-4" /> Export Master Report</>}
      </button>
    </Modal>
  );
};

// ─── Vehicles Tab ─────────────────────────────────────────────────────────────

const VehiclesTab = ({ vehicles, dispatches, fuelLogs, onAdd, onEdit, onDelete, onSetPrimary }: {
  vehicles: GarageVehicle[];
  dispatches: GarageDispatch[];
  fuelLogs: GarageFuelLog[];
  onAdd: () => void;
  onEdit: (v: GarageVehicle) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) => {
  const getVehicleStats = (vid: string) => {
    const logs = fuelLogs.filter(l => l.vehicleId === vid);
    const trips = dispatches.filter(d => d.vehicleId === vid && d.status === 'Completed');
    const totalFuel = logs.reduce((s, l) => s + l.liters, 0);
    const totalCost = logs.reduce((s, l) => s + l.totalCost, 0);
    const totalKm = trips.reduce((s, d) => s + (d.distanceKm ?? 0), 0);
    return { totalFuel, totalCost, totalKm, fillUps: logs.length, trips: trips.length };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-surface-900">My Vehicles</h2>
          <p className="text-sm text-gray-500">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>
      {vehicles.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">No vehicles yet</p>
          <p className="text-sm text-gray-400 mb-4">Add your first vehicle to start tracking</p>
          <button onClick={onAdd} className="text-primary font-semibold text-sm hover:underline">+ Add Vehicle</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map(v => {
            const s = getVehicleStats(v.id);
            return (
              <motion.div key={v.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-xl p-2.5">
                      <Car className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base leading-tight">{v.make} {v.model}</h3>
                      <p className="text-emerald-100 text-xs mt-0.5">{v.year || 'Year N/A'} · {v.color || 'Color N/A'}</p>
                    </div>
                  </div>
                  {v.isPrimary && (
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30">PRIMARY</span>
                  )}
                </div>
                {/* Card Body */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-4">
                    {v.plateNumber && (
                      <span className="bg-surface-900 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-lg tracking-widest">{v.plateNumber}</span>
                    )}
                    {v.vehicleType && (
                      <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">{v.vehicleType}</span>
                    )}
                    <FuelBadge type={v.fuelType} />
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Fill-ups', value: String(s.fillUps), icon: Fuel },
                      { label: 'Total Km', value: fmt(s.totalKm), icon: Gauge },
                      { label: 'Fuel Spend', value: `Le ${fmt(s.totalCost)}`, icon: CreditCard },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <Icon className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                        <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                        <p className="text-xs font-bold text-surface-900 truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                  {v.notes && <p className="text-xs text-gray-500 italic mb-3 line-clamp-1">{v.notes}</p>}
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    {!v.isPrimary && (
                      <button onClick={() => onSetPrimary(v.id)} className="flex-1 text-xs font-semibold text-gray-600 hover:text-primary py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Set Primary
                      </button>
                    )}
                    <button onClick={() => onEdit(v)} className="flex-1 text-xs font-semibold text-blue-600 hover:text-blue-700 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => onDelete(v.id)} className="flex-1 text-xs font-semibold text-red-500 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Smart Integration Tip */}
      {vehicles.some(v => v.isPrimary) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Smart Station Filter Active</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Your primary vehicle is set to <b>{vehicles.find(v => v.isPrimary)?.fuelType}</b>.{' '}
              <Link to={`/stations?fuel=${vehicles.find(v => v.isPrimary)?.fuelType}`} className="underline font-bold hover:text-blue-800">
                View matching stations →
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─── Dispatches Tab ───────────────────────────────────────────────────────────

const DispatchesTab = ({ dispatches, vehicles, onAdd, onReturn, onEdit, onDelete, onLogFuel }: {
  dispatches: GarageDispatch[];
  vehicles: GarageVehicle[];
  onAdd: () => void;
  onReturn: (d: GarageDispatch) => void;
  onEdit: (d: GarageDispatch) => void;
  onDelete: (id: string) => void;
  onLogFuel: (dispatchId: string, vehicleId: string) => void;
}) => {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [search, setSearch] = useState('');

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);

  const filtered = useMemo(() =>
    dispatches.filter(d => {
      if (filter !== 'All' && d.status !== filter) return false;
      const term = search.toLowerCase();
      return !term || d.destination.toLowerCase().includes(term) || d.purposeOfTrip.toLowerCase().includes(term);
    }), [dispatches, filter, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-surface-900">Dispatches</h2>
          <p className="text-sm text-gray-500">{dispatches.filter(d => d.status === 'Active').length} active · {dispatches.filter(d => d.status === 'Completed').length} completed</p>
        </div>
        <button onClick={onAdd} disabled={vehicles.length === 0}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" /> Start Dispatch
        </button>
      </div>
      {vehicles.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">Add a vehicle first before logging dispatches.</p>
        </div>
      )}
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className={`${inputCls} pl-9`} placeholder="Search dispatches…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
          {(['All', 'Active', 'Completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Navigation className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No dispatches found</p>
          {dispatches.length === 0 && <button onClick={onAdd} className="mt-3 text-primary font-semibold text-sm hover:underline">Start your first trip →</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const veh = vehicleMap[d.vehicleId];
            return (
              <motion.div key={d.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={d.status} />
                      {veh && <span className="text-xs text-gray-500 font-medium">{veh.make} {veh.model}</span>}
                    </div>
                    <h3 className="font-bold text-surface-900 truncate">{d.destination}</h3>
                    <p className="text-sm text-gray-500 truncate">{d.purposeOfTrip}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(d.date)}</span>
                      <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" />Out: {fmt(d.odometerOut)} km</span>
                      {d.status === 'Completed' && d.odometerIn && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <TrendingUp className="w-3.5 h-3.5" />{fmt(d.distanceKm)} km driven
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {d.status === 'Active' && (
                      <>
                        <button onClick={() => onReturn(d)}
                          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Return
                        </button>
                        <button onClick={() => onLogFuel(d.id, d.vehicleId)}
                          className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                          <Fuel className="w-3.5 h-3.5" /> Log Fuel
                        </button>
                      </>
                    )}
                    <button onClick={() => onEdit(d)}
                      className="flex items-center gap-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => onDelete(d.id)}
                      className="flex items-center gap-1.5 bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Fuel Logs Tab ─────────────────────────────────────────────────────────────

const FuelLogsTab = ({ fuelLogs, vehicles, dispatches, onAdd, onEdit, onDelete }: {
  fuelLogs: GarageFuelLog[];
  vehicles: GarageVehicle[];
  dispatches: GarageDispatch[];
  onAdd: () => void;
  onEdit: (l: GarageFuelLog) => void;
  onDelete: (id: string) => void;
}) => {
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);
  const dispatchMap = useMemo(() => Object.fromEntries(dispatches.map(d => [d.id, d])), [dispatches]);

  const filtered = useMemo(() =>
    fuelLogs.filter(l => {
      if (vehicleFilter !== 'All' && l.vehicleId !== vehicleFilter) return false;
      if (dateFrom && l.date < dateFrom) return false;
      if (dateTo && l.date > dateTo) return false;
      const term = search.toLowerCase();
      return !term || l.stationName.toLowerCase().includes(term) || (l.location ?? '').toLowerCase().includes(term);
    }), [fuelLogs, vehicleFilter, search, dateFrom, dateTo]);

  const totalLiters = filtered.reduce((s, l) => s + l.liters, 0);
  const totalCost = filtered.reduce((s, l) => s + l.totalCost, 0);
  const avgCostPerL = totalLiters > 0 ? totalCost / totalLiters : 0;

  // Chart data — last 30 days
  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string; spend: number; liters: number }> = {};
    filtered.forEach(l => {
      if (!grouped[l.date]) grouped[l.date] = { date: l.date, spend: 0, liters: 0 };
      grouped[l.date].spend += l.totalCost;
      grouped[l.date].liters += l.liters;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)).slice(-30).map(r => ({
      ...r,
      date: new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      spend: Math.round(r.spend),
      liters: Number(r.liters.toFixed(1))
    }));
  }, [filtered]);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const logo = await getLogoBase64();
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth  = doc.internal.pageSize.getWidth();  // 297mm landscape
      const pageHeight = doc.internal.pageSize.getHeight(); // 210mm landscape
      const margin = 14;
      const usable = pageWidth - margin * 2; // 269mm

      let y = drawPdfHeader(doc, 'My Garage — Fuel Log Report', logo);

      // ── Title ─────────────────────────────────────────────────────────────
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 114, 198);
      doc.text('Personal Fuel Log', margin, y);

      // Meta — right-aligned
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}  ·  Records: ${filtered.length}`, pageWidth - margin, y, { align: 'right' });

      // ── Summary Boxes (3 equal boxes across the full usable width) ────────
      y += 12;
      const boxGap = 6;
      const boxW = (usable - boxGap * 2) / 3; // each box = ~85mm

      const boxes = [
        { label: 'Total Fuel',   value: `${totalLiters.toFixed(1)} L`,            fill: [240,253,244] as [number,number,number], text: [21,128,61]  as [number,number,number] },
        { label: 'Total Cost',   value: `Le ${totalCost.toLocaleString()}`,        fill: [239,246,255] as [number,number,number], text: [29,78,216]  as [number,number,number] },
        { label: 'Avg Cost / L', value: `Le ${Math.round(avgCostPerL).toLocaleString()}`, fill: [255,251,235] as [number,number,number], text: [161,98,7] as [number,number,number] },
      ];

      boxes.forEach((box, i) => {
        const bx = margin + i * (boxW + boxGap);
        doc.setFillColor(...box.fill);
        doc.roundedRect(bx, y, boxW, 20, 3, 3, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.setTextColor(...box.text);
        doc.text(box.label, bx + 5, y + 7);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text(box.value, bx + 5, y + 15);
      });

      y += 28;

      // ── Table ─────────────────────────────────────────────────────────────
      // Column widths must sum to exactly `usable` (269mm)
      // Date  Vehicle  Station  Location  Liters  Cost/L  Total  Payment  Receipt
      //  26    38       52       42        18      24      26     24       19  = 269
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Vehicle', 'Station', 'Location', 'Liters', 'Cost/L (Le)', 'Total (Le)', 'Payment', 'Receipt']],
        body: filtered.map(l => [
          fmtDate(l.date),
          vehicleMap[l.vehicleId] ? `${vehicleMap[l.vehicleId].make} ${vehicleMap[l.vehicleId].model}${vehicleMap[l.vehicleId].vehicleType ? ` (${vehicleMap[l.vehicleId].vehicleType})` : ''}` : '—',
          l.stationName,
          l.location || '—',
          l.liters.toFixed(1),
          l.costPerLiter.toLocaleString(),
          l.totalCost.toLocaleString(),
          l.paymentMethod || '—',
          l.receiptNumber || '—',
        ]),
        tableWidth: usable,
        styles: { fontSize: 8.5, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [0, 114, 198], textColor: 255, fontStyle: 'bold', fontSize: 8.5, halign: 'left' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 26 },  // Date
          1: { cellWidth: 38 },  // Vehicle
          2: { cellWidth: 52 },  // Station
          3: { cellWidth: 42 },  // Location
          4: { cellWidth: 18, halign: 'right' },  // Liters
          5: { cellWidth: 24, halign: 'right' },  // Cost/L
          6: { cellWidth: 26, halign: 'right' },  // Total
          7: { cellWidth: 24 },  // Payment
          8: { cellWidth: 19 },  // Receipt
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          // Footer on every page
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.setFont('helvetica', 'normal');
          doc.text('Salone Fuel Monitor — My Garage', margin, pageHeight - 6);
          doc.text(`Page ${data.pageNumber}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
        }
      });

      doc.save(`SFM_FuelLog_${today()}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-surface-900">Fuel Logs</h2>
          <p className="text-sm text-gray-500">{fuelLogs.length} records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} disabled={exporting || filtered.length === 0}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3.5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export PDF
          </button>
          <button onClick={onAdd} disabled={vehicles.length === 0}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-4 h-4" /> Log Fuel
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Fuel', value: `${totalLiters.toFixed(1)} L`, icon: Fuel, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Spent', value: `Le ${fmt(totalCost)}`, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Avg Cost/L', value: `Le ${fmt(avgCostPerL)}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3">
              <div className={`${bg} rounded-xl p-2.5 shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-sm font-bold text-surface-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-bold text-surface-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Fuel Spend Over Time
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="spend" name="Total Cost (Le)" stroke="#10B981" fill="url(#spendGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className={`${inputCls} pl-9`} placeholder="Search station or location…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={selectCls} value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}>
          <option value="All">All Vehicles</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="date" className={`${inputCls} flex-1 text-xs`} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From" />
          <input type="date" className={`${inputCls} flex-1 text-xs`} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To" />
        </div>
      </div>

      {/* Log Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{fuelLogs.length === 0 ? 'No fuel logs yet' : 'No records match your filters'}</p>
          {fuelLogs.length === 0 && <button onClick={onAdd} className="mt-3 text-primary font-semibold text-sm hover:underline">Log your first fill-up →</button>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Date', 'Vehicle', 'Station', 'Fuel Type', 'Liters', 'Cost/L', 'Total', 'Payment', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(l => {
                  const veh = vehicleMap[l.vehicleId];
                  return (
                    <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(l.date)}</td>
                      <td className="px-4 py-3 text-xs font-medium text-surface-900 whitespace-nowrap">
                        <div>{veh ? `${veh.make} ${veh.model}` : '—'}</div>
                        {veh?.vehicleType && <div className="text-[10px] text-gray-400 font-normal">{veh.vehicleType}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-surface-900 truncate max-w-[120px]">{l.stationName}</p>
                        {l.location && <p className="text-[10px] text-gray-400">{l.location}</p>}
                      </td>
                      <td className="px-4 py-3"><FuelBadge type={l.fuelType ?? 'Petrol'} /></td>
                      <td className="px-4 py-3 text-xs font-semibold text-surface-900 whitespace-nowrap">{l.liters.toFixed(1)} L</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">Le {l.costPerLiter.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-bold text-surface-900 whitespace-nowrap">Le {fmt(l.totalCost)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{l.paymentMethod}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => onEdit(l)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDelete(l.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Maintenance Tab ────────────────────────────────────────────────────────

const MaintenanceTab = ({
  maintenanceLogs, vehicles,
  onAdd, onEdit, onDelete, onManageTypes
}: {
  maintenanceLogs: GarageMaintenanceLog[];
  vehicles: GarageVehicle[];
  onAdd: () => void;
  onEdit: (l: GarageMaintenanceLog) => void;
  onDelete: (id: string) => void;
  onManageTypes: () => void;
}) => {
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    return maintenanceLogs.filter(l => {
      if (vehicleFilter !== 'All' && l.vehicleId !== vehicleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const v = vehicleMap[l.vehicleId];
        const vMatch = v ? `${v.make} ${v.model} ${v.plateNumber}`.toLowerCase().includes(q) : false;
        return vMatch ||
          l.serviceType.toLowerCase().includes(q) ||
          l.mechanicOrShop?.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [maintenanceLogs, vehicleFilter, search, vehicleMap]);

  const totalCost = filtered.reduce((sum, l) => sum + l.cost, 0);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const logo = await getLogoBase64();
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth  = doc.internal.pageSize.getWidth();  // 297mm landscape
      const pageHeight = doc.internal.pageSize.getHeight(); // 210mm landscape
      const margin = 14;
      const usable = pageWidth - margin * 2; // 269mm

      let y = drawPdfHeader(doc, 'My Garage — Maintenance Report', logo);

      // ── Title ─────────────────────────────────────────────────────────────
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 114, 198);
      doc.text('Maintenance Log', margin, y);

      // Meta — right-aligned
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}  ·  Records: ${filtered.length}`, pageWidth - margin, y, { align: 'right' });

      // ── Summary Boxes (2 boxes) ───────────────────────────────────────────
      y += 12;
      const boxGap = 6;
      const boxW = (usable - boxGap) / 2; // ~131mm

      const boxes = [
        { label: 'Total Services', value: `${filtered.length}`, fill: [240,253,244] as [number,number,number], text: [21,128,61] as [number,number,number] },
        { label: 'Total Maintenance Cost', value: `Le ${totalCost.toLocaleString()}`, fill: [239,246,255] as [number,number,number], text: [29,78,216] as [number,number,number] },
      ];

      boxes.forEach((box, i) => {
        const bx = margin + i * (boxW + boxGap);
        doc.setFillColor(...box.fill);
        doc.roundedRect(bx, y, boxW, 20, 3, 3, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.setTextColor(...box.text);
        doc.text(box.label, bx + 5, y + 7);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text(box.value, bx + 5, y + 15);
      });

      y += 28;

      // ── Table ─────────────────────────────────────────────────────────────
      // Column widths must sum to exactly `usable` (269mm)
      // Date  Vehicle  ServiceType  Mechanic  Odo  Cost  Notes  Receipt
      //  26    40       35           35        20   25    70     18 = 269
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Vehicle', 'Service', 'Mechanic', 'Odo (km)', 'Cost (Le)', 'Notes', 'Receipt']],
        body: filtered.map(l => [
          fmtDate(l.date),
          vehicleMap[l.vehicleId] ? `${vehicleMap[l.vehicleId].make} ${vehicleMap[l.vehicleId].model}` : '—',
          l.serviceType,
          l.mechanicOrShop || '—',
          l.odometerReading ? l.odometerReading.toLocaleString() : '—',
          l.cost.toLocaleString(),
          l.notes || '—',
          l.receiptNumber || '—',
        ]),
        tableWidth: usable,
        styles: { fontSize: 8.5, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [0, 114, 198], textColor: 255, fontStyle: 'bold', fontSize: 8.5, halign: 'left' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 26 },  // Date
          1: { cellWidth: 40 },  // Vehicle
          2: { cellWidth: 35 },  // Service
          3: { cellWidth: 35 },  // Mechanic
          4: { cellWidth: 20, halign: 'right' },  // Odo
          5: { cellWidth: 25, halign: 'right' },  // Cost
          6: { cellWidth: 70 },  // Notes
          7: { cellWidth: 18 },  // Receipt
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.setFont('helvetica', 'normal');
          doc.text('Salone Fuel Monitor — My Garage', margin, pageHeight - 6);
          doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
        }
      });

      doc.save(`maintenance_log_${today()}.pdf`);
      toast.success('Maintenance log exported');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-surface-900">Maintenance Records</h2>
          <p className="text-sm text-gray-500">{maintenanceLogs.length} records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onManageTypes}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3.5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
            <Settings className="w-4 h-4" /> Service Types
          </button>
          <button onClick={exportPDF} disabled={exporting || filtered.length === 0}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3.5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export PDF
          </button>
          <button onClick={onAdd} disabled={vehicles.length === 0}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-4 h-4" /> Log Service
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pl-9 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                 placeholder="Search records…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none bg-white" 
                value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}>
          <option value="All">All Vehicles</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}
        </select>
      </div>

      {filtered.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">Total Maintenance Cost (Filtered)</span>
          <span className="text-lg font-bold text-blue-800">Le {fmt(totalCost)}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{maintenanceLogs.length === 0 ? 'No maintenance logs yet' : 'No records match your filters'}</p>
          {maintenanceLogs.length === 0 && <button onClick={onAdd} className="mt-3 text-primary font-semibold text-sm hover:underline">Log your first service →</button>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Date', 'Vehicle', 'Service', 'Mechanic', 'Odo (km)', 'Cost (Le)', 'Notes', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(l => {
                  const veh = vehicleMap[l.vehicleId];
                  return (
                    <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(l.date)}</td>
                      <td className="px-4 py-3 text-xs font-medium text-surface-900 whitespace-nowrap">
                        <div>{veh ? `${veh.make} ${veh.model}` : '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                          {l.serviceType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-900">{l.mechanicOrShop || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{l.odometerReading ? l.odometerReading.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-surface-900 whitespace-nowrap">Le {fmt(l.cost)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{l.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => onEdit(l)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDelete(l.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'vehicles' | 'dispatches' | 'fuel_logs' | 'maintenance';

export default function MyGarage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get('tab') as TabId) ?? 'vehicles';
  const [activeTab, setActiveTab] = useState<TabId>(tabParam);

  // Modal state
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState<GarageVehicle | undefined>();
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [editDispatch, setEditDispatch] = useState<GarageDispatch | undefined>();
  const [returnDispatch, setReturnDispatch] = useState<GarageDispatch | undefined>();
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [editFuelLog, setEditFuelLog] = useState<GarageFuelLog | undefined>();
  const [prefillDispatchId, setPrefillDispatchId] = useState<string | undefined>();
  const [prefillVehicleId, setPrefillVehicleId] = useState<string | undefined>();
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [editMaintenanceLog, setEditMaintenanceLog] = useState<GarageMaintenanceLog | undefined>();
  const [showServiceTypeManager, setShowServiceTypeManager] = useState(false);
  const [editServiceType, setEditServiceType] = useState<GarageServiceType | undefined>();
  const [showMasterExportModal, setShowMasterExportModal] = useState(false);
  const [masterExporting, setMasterExporting] = useState(false);

  // Data
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [dispatches, setDispatches] = useState<GarageDispatch[]>([]);
  const [fuelLogs, setFuelLogs] = useState<GarageFuelLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<GarageMaintenanceLog[]>([]);
  const [serviceTypes, setServiceTypes] = useState<GarageServiceType[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Sync tab with URL
  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user, navigate]);

  // Firestore subscriptions
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);

    const vehiclesUnsub = onSnapshot(
      query(collection(db, 'users', user.uid, 'vehicles'), orderBy('createdAt', 'desc')),
      snap => setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() } as GarageVehicle))),
      err => console.error('vehicles:', err)
    );

    const dispatchesUnsub = onSnapshot(
      query(collection(db, 'users', user.uid, 'dispatches'), orderBy('createdAt', 'desc')),
      snap => setDispatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as GarageDispatch))),
      err => console.error('dispatches:', err)
    );

    const fuelLogsUnsub = onSnapshot(
      query(collection(db, 'users', user.uid, 'fuel_logs'), orderBy('date', 'desc')),
      snap => { setFuelLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as GarageFuelLog))); },
      err => console.error('fuel_logs:', err)
    );

    const maintenanceUnsub = onSnapshot(
      query(collection(db, 'users', user.uid, 'maintenance'), orderBy('date', 'desc')),
      snap => { setMaintenanceLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as GarageMaintenanceLog))); },
      err => console.error('maintenance:', err)
    );

    const serviceTypesUnsub = onSnapshot(
      query(collection(db, 'users', user.uid, 'service_types'), orderBy('name', 'asc')),
      snap => { 
        setServiceTypes(snap.docs.map(d => ({ id: d.id, ...d.data() } as GarageServiceType)));
        setDataLoading(false);
      },
      err => { console.error('service_types:', err); setDataLoading(false); }
    );

    return () => { vehiclesUnsub(); dispatchesUnsub(); fuelLogsUnsub(); maintenanceUnsub(); serviceTypesUnsub(); };
  }, [user]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your garage…</p>
        </div>
      </div>
    );
  }

  // ── CRUD helpers ───────────────────────────────────────────────────────────

  const uid = user!.uid;

  /**
   * Firestore rejects fields set to `undefined`.
   * Strip them (and empty optional strings) before every write.
   */
  const cleanDoc = (obj: Record<string, any>): Record<string, any> =>
    Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
    );

  const saveVehicle = async (data: Omit<GarageVehicle, 'id' | 'createdAt'>) => {
    const clean = cleanDoc(data as any);
    // Ensure only one primary
    if (clean.isPrimary) {
      for (const v of vehicles) {
        if (v.isPrimary && v.id !== editVehicle?.id) {
          await updateDoc(doc(db, 'users', uid, 'vehicles', v.id), { isPrimary: false });
        }
      }
    }
    if (editVehicle) {
      await updateDoc(doc(db, 'users', uid, 'vehicles', editVehicle.id), clean);
      toast.success('Vehicle updated');
    } else {
      await addDoc(collection(db, 'users', uid, 'vehicles'), { ...clean, createdAt: serverTimestamp() });
      toast.success('Vehicle added');
    }
    setEditVehicle(undefined);
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm('Delete this vehicle? All linked dispatches and fuel logs will remain but lose the vehicle link.')) return;
    await deleteDoc(doc(db, 'users', uid, 'vehicles', id));
    toast.success('Vehicle deleted');
  };

  const setPrimaryVehicle = async (id: string) => {
    for (const v of vehicles) {
      await updateDoc(doc(db, 'users', uid, 'vehicles', v.id), { isPrimary: v.id === id });
    }
    toast.success('Primary vehicle updated');
  };

  const saveDispatch = async (data: Omit<GarageDispatch, 'id' | 'createdAt'>) => {
    const clean = cleanDoc(data as any);
    if (editDispatch) {
      await updateDoc(doc(db, 'users', uid, 'dispatches', editDispatch.id), clean);
      toast.success('Dispatch updated');
    } else {
      await addDoc(collection(db, 'users', uid, 'dispatches'), { ...clean, createdAt: serverTimestamp() });
      toast.success('Dispatch started');
    }
    setEditDispatch(undefined);
  };

  const returnDispatchFn = async (odometerIn: number) => {
    if (!returnDispatch) return;
    const dist = odometerIn - returnDispatch.odometerOut;
    await updateDoc(doc(db, 'users', uid, 'dispatches', returnDispatch.id), {
      odometerIn, distanceKm: dist, status: 'Completed'
    });
    toast.success(`Dispatch completed · ${fmt(dist)} km driven`);
    setReturnDispatch(undefined);
  };

  const deleteDispatch = async (id: string) => {
    if (!confirm('Delete this dispatch record?')) return;
    await deleteDoc(doc(db, 'users', uid, 'dispatches', id));
    toast.success('Dispatch deleted');
  };

  const saveFuelLog = async (data: Omit<GarageFuelLog, 'id' | 'createdAt'>) => {
    // Strip undefined/null — Firestore will throw if any field is undefined
    const clean = cleanDoc(data as any);
    if (editFuelLog) {
      await updateDoc(doc(db, 'users', uid, 'fuel_logs', editFuelLog.id), clean);
      toast.success('Fuel log updated');
    } else {
      await addDoc(collection(db, 'users', uid, 'fuel_logs'), { ...clean, createdAt: serverTimestamp() });
      toast.success('Fuel fill-up logged');
    }
    setEditFuelLog(undefined);
  };

  const deleteFuelLog = async (id: string) => {
    if (!confirm('Delete this fuel record?')) return;
    await deleteDoc(doc(db, 'users', uid, 'fuel_logs', id));
    toast.success('Fuel log deleted');
  };

  const saveMaintenance = async (data: Omit<GarageMaintenanceLog, 'id' | 'createdAt'>) => {
    const clean = cleanDoc(data as any);
    if (editMaintenanceLog) {
      await updateDoc(doc(db, 'users', uid, 'maintenance', editMaintenanceLog.id), clean);
      toast.success('Maintenance log updated');
    } else {
      await addDoc(collection(db, 'users', uid, 'maintenance'), { ...clean, createdAt: serverTimestamp() });
      toast.success('Maintenance logged');
    }
    setEditMaintenanceLog(undefined);
  };

  const deleteMaintenance = async (id: string) => {
    if (!confirm('Delete this maintenance record?')) return;
    await deleteDoc(doc(db, 'users', uid, 'maintenance', id));
    toast.success('Maintenance log deleted');
  };

  const saveServiceType = async (data: Omit<GarageServiceType, 'id' | 'createdAt'>, existingId?: string) => {
    const clean = cleanDoc(data as any);
    if (existingId) {
      await updateDoc(doc(db, 'users', uid, 'service_types', existingId), clean);
      toast.success('Service type updated');
    } else {
      await addDoc(collection(db, 'users', uid, 'service_types'), { ...clean, createdAt: serverTimestamp() });
      toast.success('Service type added');
    }
  };

  const deleteServiceType = async (id: string) => {
    if (!confirm('Delete this service type?')) return;
    await deleteDoc(doc(db, 'users', uid, 'service_types', id));
    toast.success('Service type deleted');
  };

  const exportMasterPDF = async (filters: { vehicleId: string; dateRange: string; customStart?: string; customEnd?: string }) => {
    setMasterExporting(true);
    try {
      const logo = await getLogoBase64();
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth  = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const usable = pageWidth - margin * 2; // 269mm

      // Filter Data
      const getDateFilter = (dateStr: string) => {
        if (filters.dateRange === 'AllTime') return true;
        const d = new Date(dateStr);
        const now = new Date();
        if (filters.dateRange === 'Last7Days') return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        if (filters.dateRange === 'Last30Days') return (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        if (filters.dateRange === 'ThisMonth') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filters.dateRange === 'ThisYear') return d.getFullYear() === now.getFullYear();
        if (filters.dateRange === 'Custom') {
          if (filters.customStart && dateStr < filters.customStart) return false;
          if (filters.customEnd && dateStr > filters.customEnd) return false;
        }
        return true;
      };

      const dFiltered = dispatches.filter(d => (filters.vehicleId === 'All' || d.vehicleId === filters.vehicleId) && getDateFilter(d.date));
      const fFiltered = fuelLogs.filter(f => (filters.vehicleId === 'All' || f.vehicleId === filters.vehicleId) && getDateFilter(f.date));
      const mFiltered = maintenanceLogs.filter(m => (filters.vehicleId === 'All' || m.vehicleId === filters.vehicleId) && getDateFilter(m.date));

      const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

      // ── Page 1: Header & Summary ─────────────────────────────────────────
      let y = drawPdfHeader(doc, 'My Garage — Master Export', logo);
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 114, 198);
      doc.text('Comprehensive Garage Report', margin, y);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const vehicleName = filters.vehicleId === 'All' ? 'All Vehicles' : (vehicleMap[filters.vehicleId] ? `${vehicleMap[filters.vehicleId].make} ${vehicleMap[filters.vehicleId].model}` : 'Unknown');
      doc.text(`Generated: ${new Date().toLocaleString()}  ·  Vehicle: ${vehicleName}`, pageWidth - margin, y, { align: 'right' });

      y += 12;

      // Summary Boxes
      const totDist = dFiltered.reduce((s, d) => s + (d.distanceKm || 0), 0);
      const totFuel = fFiltered.reduce((s, f) => s + f.totalCost, 0);
      const totMaint = mFiltered.reduce((s, m) => s + m.cost, 0);
      const totLiters = fFiltered.reduce((s, f) => s + f.liters, 0);

      const boxGap = 6;
      const boxW = (usable - boxGap * 3) / 4;

      const boxes = [
        { label: 'Total Distance', value: `${fmt(totDist)} km`, fill: [240,253,244] as [number,number,number], text: [21,128,61] as [number,number,number] },
        { label: 'Total Fuel', value: `${totLiters.toFixed(1)} L`, fill: [239,246,255] as [number,number,number], text: [29,78,216] as [number,number,number] },
        { label: 'Fuel Cost', value: `Le ${fmt(totFuel)}`, fill: [254,242,242] as [number,number,number], text: [185,28,28] as [number,number,number] },
        { label: 'Maintenance Cost', value: `Le ${fmt(totMaint)}`, fill: [255,251,235] as [number,number,number], text: [161,98,7] as [number,number,number] },
      ];

      boxes.forEach((box, i) => {
        const bx = margin + i * (boxW + boxGap);
        doc.setFillColor(...box.fill);
        doc.roundedRect(bx, y, boxW, 20, 3, 3, 'F');
        doc.setFontSize(8); doc.setTextColor(...box.text);
        doc.text(box.label, bx + 5, y + 7);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text(box.value, bx + 5, y + 15);
      });

      y += 30;

      // Add common footer
      const drawFooter = () => {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text('Salone Fuel Monitor — My Garage', margin, pageHeight - 6);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
      };

      // ── Dispatches Table ──────────────────────────────────────────────────
      if (dFiltered.length > 0) {
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
        doc.text('Dispatches', margin, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Date', 'Vehicle', 'Destination', 'Purpose', 'Odo Out', 'Odo In', 'Distance', 'Status']],
          body: dFiltered.map(d => [
            fmtDate(d.date),
            vehicleMap[d.vehicleId] ? `${vehicleMap[d.vehicleId].make} ${vehicleMap[d.vehicleId].model}` : '—',
            d.destination,
            d.purposeOfTrip,
            fmt(d.odometerOut),
            d.odometerIn ? fmt(d.odometerIn) : '—',
            d.distanceKm ? fmt(d.distanceKm) : '—',
            d.status,
          ]),
          tableWidth: usable,
          styles: { fontSize: 8.5, cellPadding: 3, overflow: 'linebreak' },
          headStyles: { fillColor: [0, 114, 198], textColor: 255 },
          margin: { left: margin, right: margin },
          didDrawPage: drawFooter
        });
        y = (doc as any).lastAutoTable.finalY + 15;
      }

      // ── Fuel Logs Table ───────────────────────────────────────────────────
      if (fFiltered.length > 0) {
        if (y > pageHeight - 40) { doc.addPage(); y = margin + 10; }
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
        doc.text('Fuel Logs', margin, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Date', 'Vehicle', 'Station', 'Liters', 'Cost/L (Le)', 'Total (Le)', 'Receipt']],
          body: fFiltered.map(f => [
            fmtDate(f.date),
            vehicleMap[f.vehicleId] ? `${vehicleMap[f.vehicleId].make} ${vehicleMap[f.vehicleId].model}` : '—',
            f.stationName,
            f.liters.toFixed(1),
            fmt(f.costPerLiter),
            fmt(f.totalCost),
            f.receiptNumber || '—'
          ]),
          tableWidth: usable,
          styles: { fontSize: 8.5, cellPadding: 3 },
          headStyles: { fillColor: [0, 114, 198], textColor: 255 },
          margin: { left: margin, right: margin },
          didDrawPage: drawFooter
        });
        y = (doc as any).lastAutoTable.finalY + 15;
      }

      // ── Maintenance Logs Table ────────────────────────────────────────────
      if (mFiltered.length > 0) {
        if (y > pageHeight - 40) { doc.addPage(); y = margin + 10; }
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
        doc.text('Maintenance Logs', margin, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Date', 'Vehicle', 'Service', 'Mechanic', 'Odo (km)', 'Cost (Le)', 'Notes']],
          body: mFiltered.map(m => [
            fmtDate(m.date),
            vehicleMap[m.vehicleId] ? `${vehicleMap[m.vehicleId].make} ${vehicleMap[m.vehicleId].model}` : '—',
            m.serviceType,
            m.mechanicOrShop || '—',
            m.odometerReading ? fmt(m.odometerReading) : '—',
            fmt(m.cost),
            m.notes || '—'
          ]),
          tableWidth: usable,
          styles: { fontSize: 8.5, cellPadding: 3 },
          headStyles: { fillColor: [0, 114, 198], textColor: 255 },
          margin: { left: margin, right: margin },
          didDrawPage: drawFooter
        });
      }

      doc.save(`master_export_${today()}.pdf`);
      toast.success('Master report exported successfully');
      setShowMasterExportModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate master report');
    } finally {
      setMasterExporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'vehicles', label: 'My Vehicles', icon: <Car className="w-4 h-4" />, count: vehicles.length },
    { id: 'dispatches', label: 'Dispatches', icon: <Navigation className="w-4 h-4" />, count: dispatches.filter(d => d.status === 'Active').length || undefined },
    { id: 'fuel_logs', label: 'Fuel Logs', icon: <Fuel className="w-4 h-4" />, count: fuelLogs.length || undefined },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" />, count: maintenanceLogs.length || undefined },
  ];

  const primaryVeh = vehicles.find(v => v.isPrimary);
  const totalFuelSpend = fuelLogs.reduce((s, l) => s + l.totalCost, 0);
  const totalKm = dispatches.filter(d => d.status === 'Completed').reduce((s, d) => s + (d.distanceKm ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-surface-900 flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-2.5 shadow-sm">
                <Car className="w-7 h-7 text-white" />
              </div>
              My Garage
            </h1>
            <p className="text-gray-500 mt-1.5">Track your personal vehicles, trips, and fuel spend</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button onClick={() => setShowMasterExportModal(true)}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors flex-1 sm:flex-none justify-center whitespace-nowrap">
              <Download className="w-4 h-4" /> Master Export
            </button>
            {primaryVeh && (
              <Link to={`/stations?fuel=${primaryVeh.fuelType}`}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors flex-1 sm:flex-none justify-center whitespace-nowrap">
                <MapPin className="w-4 h-4" /> Find {primaryVeh.fuelType} Stations <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        {(vehicles.length > 0 || fuelLogs.length > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Vehicles', value: String(vehicles.length), icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Active Trips', value: String(dispatches.filter(d => d.status === 'Active').length), icon: Navigation, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Total km Driven', value: `${fmt(totalKm)} km`, icon: Gauge, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Fuel Spend', value: `Le ${fmt(totalFuelSpend)}`, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3">
                <div className={`${bg} rounded-xl p-2 shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium leading-none">{label}</p>
                  <p className="text-sm font-bold text-surface-900 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-7 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => switchTab(tab.id)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-surface-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.icon}
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}>
          {activeTab === 'vehicles' && (
            <VehiclesTab
              vehicles={vehicles} dispatches={dispatches} fuelLogs={fuelLogs}
              onAdd={() => { setEditVehicle(undefined); setShowVehicleForm(true); }}
              onEdit={v => { setEditVehicle(v); setShowVehicleForm(true); }}
              onDelete={deleteVehicle}
              onSetPrimary={setPrimaryVehicle}
            />
          )}
          {activeTab === 'dispatches' && (
            <DispatchesTab
              dispatches={dispatches} vehicles={vehicles}
              onAdd={() => { setEditDispatch(undefined); setShowDispatchForm(true); }}
              onReturn={d => setReturnDispatch(d)}
              onEdit={d => { setEditDispatch(d); setShowDispatchForm(true); }}
              onDelete={deleteDispatch}
              onLogFuel={(dispatchId, vehicleId) => {
                setPrefillDispatchId(dispatchId);
                setPrefillVehicleId(vehicleId);
                setEditFuelLog(undefined);
                setShowFuelForm(true);
              }}
            />
          )}
          {activeTab === 'fuel_logs' && (
            <FuelLogsTab
              fuelLogs={fuelLogs} vehicles={vehicles} dispatches={dispatches}
              onAdd={() => { setEditFuelLog(undefined); setPrefillDispatchId(undefined); setPrefillVehicleId(undefined); setShowFuelForm(true); }}
              onEdit={l => { setEditFuelLog(l); setShowFuelForm(true); }}
              onDelete={deleteFuelLog}
            />
          )}
          {activeTab === 'maintenance' && (
            <MaintenanceTab
              maintenanceLogs={maintenanceLogs}
              vehicles={vehicles}
              onAdd={() => { setEditMaintenanceLog(undefined); setShowMaintenanceForm(true); }}
              onEdit={l => { setEditMaintenanceLog(l); setShowMaintenanceForm(true); }}
              onDelete={deleteMaintenance}
              onManageTypes={() => setShowServiceTypeManager(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      {showVehicleForm && (
        <VehicleFormModal
          initial={editVehicle}
          onSave={saveVehicle}
          onClose={() => { setShowVehicleForm(false); setEditVehicle(undefined); }}
        />
      )}
      {showDispatchForm && (
        <DispatchFormModal
          vehicles={vehicles}
          initial={editDispatch}
          onSave={saveDispatch}
          onClose={() => { setShowDispatchForm(false); setEditDispatch(undefined); }}
        />
      )}
      {returnDispatch && (
        <ReturnModal
          dispatch={returnDispatch}
          onReturn={returnDispatchFn}
          onClose={() => setReturnDispatch(undefined)}
        />
      )}
      {showFuelForm && (
        <FuelLogFormModal
          vehicles={vehicles}
          dispatches={dispatches}
          initial={editFuelLog ? editFuelLog : (prefillDispatchId || prefillVehicleId ? {
            id: '', vehicleId: prefillVehicleId ?? '', dispatchId: prefillDispatchId,
            date: today(), time: nowTime(), liters: 0, costPerLiter: 0, totalCost: 0, stationName: ''
          } : undefined)}
          onSave={saveFuelLog}
          onClose={() => { setShowFuelForm(false); setEditFuelLog(undefined); setPrefillDispatchId(undefined); setPrefillVehicleId(undefined); }}
        />
      )}
      {showMaintenanceForm && (
        <MaintenanceFormModal
          initial={editMaintenanceLog}
          vehicles={vehicles}
          serviceTypes={serviceTypes}
          onSave={saveMaintenance}
          onClose={() => { setShowMaintenanceForm(false); setEditMaintenanceLog(undefined); }}
        />
      )}
      {showServiceTypeManager && (
        <ServiceTypeManagerModal
          serviceTypes={serviceTypes}
          onSave={saveServiceType}
          onDelete={deleteServiceType}
          onClose={() => setShowServiceTypeManager(false)}
        />
      )}
      {showMasterExportModal && (
        <MasterExportModal
          vehicles={vehicles}
          onExport={exportMasterPDF}
          exporting={masterExporting}
          onClose={() => setShowMasterExportModal(false)}
        />
      )}
    </div>
  );
}
