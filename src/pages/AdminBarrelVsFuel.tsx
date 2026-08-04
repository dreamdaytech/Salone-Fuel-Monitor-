import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  db, collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Edit2, Trash2, Calendar, DollarSign, Fuel, AlertCircle, X, ChevronRight, BarChart3, Save, AlertTriangle
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
    const q = query(collection(db, 'barrelFuelSnapshots'), orderBy('date', 'desc'));
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Barrel vs Fuel</h2>
          <p className="text-gray-500">Manage historical price snapshots</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Month</th>
                <th className="text-right px-4 py-3 font-semibold">Brent</th>
                <th className="text-right px-4 py-3 font-semibold">WTI</th>
                <th className="text-right px-4 py-3 font-semibold">OPEC</th>
                <th className="text-right px-4 py-3 font-semibold">Petrol</th>
                <th className="text-right px-4 py-3 font-semibold">Diesel</th>
                <th className="text-right px-4 py-3 font-semibold">Kerosene</th>
                <th className="text-center px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.monthLabel}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">${r.brentUSD}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">${r.wtiUSD}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">${r.opecUSD}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900 font-semibold">{r.petrolNLe}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900 font-semibold">{r.dieselNLe}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900 font-semibold">{r.keroseneNLe}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button onClick={() => openEdit(r)} className="p-1.5 text-gray-500 hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Record' : 'Add Record'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" name="dateStr" value={form.dateStr} onChange={handleDateChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20" />

              <div className="grid grid-cols-3 gap-4">
                <input type="number" name="brentUSD" placeholder="Brent USD" value={form.brentUSD} onChange={handleChange} className="border p-2 rounded text-sm" />
                <input type="number" name="wtiUSD" placeholder="WTI USD" value={form.wtiUSD} onChange={handleChange} className="border p-2 rounded text-sm" />
                <input type="number" name="opecUSD" placeholder="OPEC USD" value={form.opecUSD} onChange={handleChange} className="border p-2 rounded text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input type="number" name="petrolNLe" placeholder="Petrol NLe" value={form.petrolNLe} onChange={handleChange} className="border p-2 rounded text-sm" />
                <input type="number" name="dieselNLe" placeholder="Diesel NLe" value={form.dieselNLe} onChange={handleChange} className="border p-2 rounded text-sm" />
                <input type="number" name="keroseneNLe" placeholder="Kerosene NLe" value={form.keroseneNLe} onChange={handleChange} className="border p-2 rounded text-sm" />
              </div>
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
