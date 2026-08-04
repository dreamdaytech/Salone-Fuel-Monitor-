import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  db, collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Pencil, Trash2, X, Save, BarChart3,
  ArrowLeft, ChevronRight, AlertTriangle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

// ---------- types ----------
interface BarrelFuelSnapshot {
  id: string;
  monthLabel: string;
  date: any;
  brentUSD: number;
  wtiUSD: number;
  opecUSD: number;
  petrolNLe: number;
  dieselNLe: number;
  keroseneNLe: number;
  notes?: string;
}

type FormData = Omit<BarrelFuelSnapshot, 'id' | 'date'> & { dateStr: string };

const EMPTY_FORM: FormData = {
  monthLabel: '',
  dateStr: '',
  brentUSD: 0,
  wtiUSD: 0,
  opecUSD: 0,
  petrolNLe: 0,
  dieselNLe: 0,
  keroseneNLe: 0,
  notes: '',
};

// ---------- component ----------
export default function AdminBarrelVsFuel() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const [records, setRecords] = useState<BarrelFuelSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Guard: must be admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  // Live listener
  useEffect(() => {
    const q = query(collection(db, 'barrelFuelSnapshots'), orderBy('date', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ---------- helpers ----------
  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(r: BarrelFuelSnapshot) {
    setEditingId(r.id);
    // Convert Firestore timestamp to yyyy-MM-dd string
    let dateStr = '';
    if (r.date?.toDate) {
      dateStr = r.date.toDate().toISOString().slice(0, 10);
    } else if (r.date instanceof Date) {
      dateStr = r.date.toISOString().slice(0, 10);
    }
    setForm({
      monthLabel: r.monthLabel,
      dateStr,
      brentUSD: r.brentUSD,
      wtiUSD: r.wtiUSD,
      opecUSD: r.opecUSD,
      petrolNLe: r.petrolNLe,
      dieselNLe: r.dieselNLe,
      keroseneNLe: r.keroseneNLe,
      notes: r.notes || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ['brentUSD', 'wtiUSD', 'opecUSD', 'petrolNLe', 'dieselNLe', 'keroseneNLe'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));
  }

  // Auto-fill monthLabel from date
  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setForm((prev) => {
      let monthLabel = prev.monthLabel;
      if (val) {
        const d = new Date(val + 'T00:00:00');
        monthLabel = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      }
      return { ...prev, dateStr: val, monthLabel };
    });
  }

  async function handleSave() {
    if (!form.dateStr || !form.monthLabel) {
      toast.error('Please enter a date.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        monthLabel: form.monthLabel,
        date: new Date(form.dateStr + 'T00:00:00'),
        brentUSD: form.brentUSD,
        wtiUSD: form.wtiUSD,
        opecUSD: form.opecUSD,
        petrolNLe: form.petrolNLe,
        dieselNLe: form.dieselNLe,
        keroseneNLe: form.keroseneNLe,
        notes: form.notes || '',
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'barrelFuelSnapshots', editingId), payload);
        toast.success('Record updated successfully.');
      } else {
        await addDoc(collection(db, 'barrelFuelSnapshots'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success('Record added successfully.');
      }
      closeModal();
    } catch (err) {
      toast.error('Failed to save record. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'barrelFuelSnapshots', deleteId));
      toast.success('Record deleted.');
      setDeleteId(null);
    } catch (err) {
      toast.error('Failed to delete record.');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] shadow-md">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 text-blue-200 text-sm mb-3">
            <Link to="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white font-medium">Barrel vs Fuel</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Barrel vs Fuel — Manage Records</h1>
              <p className="text-blue-200 text-sm mt-1">
                Add, edit or delete barrel & fuel price snapshots. {records.length} record{records.length !== 1 ? 's' : ''} total.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/barrel-vs-fuel"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm border border-white/20 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                View Public Page
              </Link>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-[#1EB53A] hover:bg-[#18a033] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow"
              >
                <Plus className="h-4 w-4" />
                Add Record
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {records.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
            <BarChart3 className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No records yet. Add the first snapshot.</p>
            <button onClick={openAdd} className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
              + Add First Record
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Month</th>
                    <th className="text-right px-4 py-3 font-semibold">Brent</th>
                    <th className="text-right px-4 py-3 font-semibold">WTI</th>
                    <th className="text-right px-4 py-3 font-semibold">OPEC</th>
                    <th className="text-right px-4 py-3 font-semibold">Petrol</th>
                    <th className="text-right px-4 py-3 font-semibold">Diesel</th>
                    <th className="text-right px-4 py-3 font-semibold">Kerosene</th>
                    <th className="text-left px-4 py-3 font-semibold">Notes</th>
                    <th className="text-center px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.monthLabel}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#0072C6]">${r.brentUSD}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#10B981]">${r.wtiUSD}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#F59E0B]">${r.opecUSD}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#EF4444]">Le {r.petrolNLe > 0 ? r.petrolNLe : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#8B5CF6]">Le {r.dieselNLe > 0 ? r.dieselNLe : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#F97316]">Le {r.keroseneNLe > 0 ? r.keroseneNLe : '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs italic max-w-[140px] truncate">{r.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border border-blue-100"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border border-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ---- Add / Edit Modal ---- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Record' : 'Add New Record'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="dateStr"
                  value={form.dateStr}
                  onChange={handleDateChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                {form.monthLabel && (
                  <p className="text-xs text-gray-400 mt-1">Will display as: <strong>{form.monthLabel}</strong></p>
                )}
              </div>

              {/* Barrel Prices */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">🛢️ Global Barrel Prices (USD/bbl)</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'brentUSD', label: 'Brent Crude', color: '#0072C6' },
                    { key: 'wtiUSD', label: 'WTI Crude', color: '#10B981' },
                    { key: 'opecUSD', label: 'OPEC Basket', color: '#F59E0B' },
                  ].map(({ key, label, color }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1" style={{ color }}>{label}</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                        <input
                          type="number"
                          name={key}
                          value={(form as any)[key] || ''}
                          onChange={handleChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-primary"
                          style={{ '--tw-ring-color': color + '40' } as any}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fuel Prices */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">⛽ Sierra Leone Pump Prices (NLe/L)</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'petrolNLe', label: 'Petrol', color: '#EF4444' },
                    { key: 'dieselNLe', label: 'Diesel', color: '#8B5CF6' },
                    { key: 'keroseneNLe', label: 'Kerosene', color: '#F97316' },
                  ].map(({ key, label, color }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1" style={{ color }}>{label}</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Le</span>
                        <input
                          type="number"
                          name={key}
                          value={(form as any)[key] || ''}
                          onChange={handleChange}
                          placeholder="0"
                          step="0.5"
                          className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Official NPA price adjustment"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingId ? 'Update Record' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Delete Confirm Modal ---- */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mx-auto mb-4">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Record?</h2>
            <p className="text-sm text-gray-500 mb-6">This will permanently delete this snapshot. This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {deleting ? <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
