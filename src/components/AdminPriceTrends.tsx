import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Edit2, Trash2, Check, X, TrendingUp, AlertTriangle, Save, Info } from 'lucide-react';
import { Button } from './ui/Button';

export interface PriceTrendRecord {
  id: string;
  monthYear: string;
  petrolPrice: number | '';
  dieselPrice: number | '';
  kerosenePrice: number | '';
  effectiveDate: string;
}

export function AdminPriceTrends() {
  const [trends, setTrends] = useState<PriceTrendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PriceTrendRecord>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Confirmation Modals State
  const [deleteTarget, setDeleteTarget] = useState<PriceTrendRecord | null>(null);
  const [saveTargetId, setSaveTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const q = query(collection(db, 'price_trends'), orderBy('effectiveDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PriceTrendRecord[];
      setTrends(data);
      setLoading(false);
      setErrorMsg(null);
    }, (error) => {
      console.error("Error fetching price trends:", error);
      setErrorMsg(error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (trend: PriceTrendRecord) => {
    setEditingId(trend.id);
    setEditForm(trend);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
    setIsAdding(false);
    setSaveTargetId(null);
  };

  // Trigger Confirmation Modal for Save
  const triggerSaveConfirmation = (id: string) => {
    if (!editForm.effectiveDate && !editForm.monthYear) {
      alert('Please provide an Effective Date or Month & Year.');
      return;
    }
    setSaveTargetId(id);
  };

  // Execute Save
  const executeSave = async () => {
    if (!saveTargetId) return;
    setIsSubmitting(true);
    try {
      const dataToSave = {
        monthYear: editForm.monthYear || '',
        petrolPrice: Number(editForm.petrolPrice) || 0,
        dieselPrice: Number(editForm.dieselPrice) || 0,
        kerosenePrice: Number(editForm.kerosenePrice) || 0,
        effectiveDate: editForm.effectiveDate || ''
      };

      if (saveTargetId === 'new') {
        await addDoc(collection(db, 'price_trends'), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
        showToast('New price trend record created successfully.');
      } else {
        await updateDoc(doc(db, 'price_trends', saveTargetId), {
          ...dataToSave,
          updatedAt: serverTimestamp()
        });
        showToast('Price trend record updated successfully.');
      }
      setEditingId(null);
      setEditForm({});
      setIsAdding(false);
      setSaveTargetId(null);
    } catch (error) {
      console.error('Error saving price trend:', error);
      alert('Failed to save price trend record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Confirmation Modal for Delete
  const triggerDeleteConfirmation = (trend: PriceTrendRecord) => {
    setDeleteTarget(trend);
  };

  // Execute Delete
  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'price_trends', deleteTarget.id));
      showToast(`Deleted price trend record for ${deleteTarget.monthYear || deleteTarget.effectiveDate}.`);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting price trend:', error);
      alert('Failed to delete price trend record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId('new');
    setEditForm({
      monthYear: '',
      petrolPrice: '',
      dieselPrice: '',
      kerosenePrice: '',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-12 text-center text-red-500 font-medium">
        Error loading price trends: {errorMsg}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-surface-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <Info className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Price Trends Management
            </h2>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">View, add, edit or remove official historical fuel price records</p>
          </div>
          <Button
            onClick={startAdd}
            disabled={isAdding}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Record
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Month & Year</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Petrol (PMS) NLe/L</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Diesel (AGO) NLe/L</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kerosene NLe/L</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Effective Date</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isAdding && (
                <tr className="bg-primary/5">
                  <td className="p-4">
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="e.g. January 2024"
                      value={editForm.monthYear || ''}
                      onChange={(e) => setEditForm({ ...editForm, monthYear: e.target.value })}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="0.00"
                      value={editForm.petrolPrice ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, petrolPrice: e.target.value ? Number(e.target.value) : '' })}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="0.00"
                      value={editForm.dieselPrice ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, dieselPrice: e.target.value ? Number(e.target.value) : '' })}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="0.00"
                      value={editForm.kerosenePrice ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, kerosenePrice: e.target.value ? Number(e.target.value) : '' })}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      value={editForm.effectiveDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, effectiveDate: e.target.value })}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => triggerSaveConfirmation('new')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                        title="Save New Record"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {trends.map((trend) => (
                <tr key={trend.id} className="hover:bg-gray-50 transition-colors">
                  {editingId === trend.id ? (
                    <>
                      <td className="p-4">
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none font-semibold"
                          value={editForm.monthYear || ''}
                          onChange={(e) => setEditForm({ ...editForm, monthYear: e.target.value })}
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none font-semibold"
                          value={editForm.petrolPrice ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, petrolPrice: e.target.value ? Number(e.target.value) : '' })}
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none font-semibold"
                          value={editForm.dieselPrice ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, dieselPrice: e.target.value ? Number(e.target.value) : '' })}
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none font-semibold"
                          value={editForm.kerosenePrice ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, kerosenePrice: e.target.value ? Number(e.target.value) : '' })}
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="date"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none font-semibold"
                          value={editForm.effectiveDate || ''}
                          onChange={(e) => setEditForm({ ...editForm, effectiveDate: e.target.value })}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => triggerSaveConfirmation(trend.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            title="Confirm & Save"
                          >
                            <Check className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 text-sm font-semibold text-gray-900">{trend.monthYear || 'N/A'}</td>
                      <td className="p-4 text-sm font-semibold text-gray-700">
                        {trend.petrolPrice ? (Number(trend.petrolPrice) >= 1000 ? `${Number(trend.petrolPrice).toLocaleString()} SLL` : `NLe ${Number(trend.petrolPrice).toFixed(2)}`) : '-'}
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-700">
                        {trend.dieselPrice ? (Number(trend.dieselPrice) >= 1000 ? `${Number(trend.dieselPrice).toLocaleString()} SLL` : `NLe ${Number(trend.dieselPrice).toFixed(2)}`) : '-'}
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-700">
                        {trend.kerosenePrice ? (Number(trend.kerosenePrice) >= 1000 ? `${Number(trend.kerosenePrice).toLocaleString()} SLL` : `NLe ${Number(trend.kerosenePrice).toFixed(2)}`) : '-'}
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-500">{trend.effectiveDate || '-'}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(trend)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Edit Price Trend Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDeleteConfirmation(trend)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Price Trend Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {!isAdding && trends.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-sm font-medium text-gray-500">
                    No price trends recorded yet. Click "Add New Record" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal: Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                <p className="text-xs text-gray-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-1.5">
              <p className="text-gray-700"><strong>Record Period:</strong> {deleteTarget.monthYear || 'N/A'}</p>
              <p className="text-gray-700"><strong>Effective Date:</strong> {deleteTarget.effectiveDate || 'N/A'}</p>
              <p className="text-gray-700"><strong>Prices:</strong> Petrol: {deleteTarget.petrolPrice || '-'}, Diesel: {deleteTarget.dieselPrice || '-'}, Kerosene: {deleteTarget.kerosenePrice || '-'}</p>
            </div>

            <p className="text-sm text-gray-600 font-medium">
              Are you sure you want to permanently delete this official price trend entry from the database?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-200 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Save / Edit */}
      {saveTargetId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Save className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {saveTargetId === 'new' ? 'Confirm New Record' : 'Confirm Price Update'}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {saveTargetId === 'new' ? 'Adding new official price trend entry' : 'Updating historical price trend record'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500 font-semibold">Month & Year:</span>
                <span className="text-gray-900 font-bold">{editForm.monthYear || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500 font-semibold">Effective Date:</span>
                <span className="text-gray-900 font-bold">{editForm.effectiveDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500 font-semibold">Petrol Price:</span>
                <span className="text-primary font-bold">{editForm.petrolPrice ? `NLe ${editForm.petrolPrice}` : '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500 font-semibold">Diesel Price:</span>
                <span className="text-surface-900 font-bold">{editForm.dieselPrice ? `NLe ${editForm.dieselPrice}` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Kerosene Price:</span>
                <span className="text-fuchsia-600 font-bold">{editForm.kerosenePrice ? `NLe ${editForm.kerosenePrice}` : '-'}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 font-medium">
              Are you sure you want to publish these fuel price changes to the public Price Trends chart?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSaveTargetId(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                Back to Edit
              </button>
              <button
                onClick={executeSave}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Confirm & Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
