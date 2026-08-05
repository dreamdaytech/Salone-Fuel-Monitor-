import React, { useState, useMemo, useEffect } from 'react';
import { db, collection, query, where, getDocs, writeBatch, doc, setDoc, arrayUnion, arrayRemove, onSnapshot, getDoc, serverTimestamp } from '../firebase';
import { Building2, Edit2, Trash2, Search, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { toast } from 'sonner';

interface AdminBrandsProps {
  stations: any[];
}

export default function AdminBrands({ stations }: AdminBrandsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [globalBrands, setGlobalBrands] = useState<string[]>([]);
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [editingBrand, setEditingBrand] = useState<{ oldName: string; newName: string } | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'brands'), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalBrands(docSnap.data().list || []);
      }
    });
    return () => unsubscribe();
  }, []);

  const brands = useMemo(() => {
    return Array.from(new Set([...globalBrands, ...stations.map(s => s.brand)])).filter(Boolean).sort() as string[];
  }, [stations, globalBrands]);

  const filteredBrands = useMemo(() => {
    if (!searchTerm) return brands;
    const lower = searchTerm.toLowerCase();
    return brands.filter(b => b.toLowerCase().includes(lower));
  }, [brands, searchTerm]);

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    setIsProcessing(true);
    try {
      await setDoc(doc(db, 'settings', 'brands'), {
        list: arrayUnion(newBrandName.trim())
      }, { merge: true });
      toast.success(`Successfully added brand "${newBrandName.trim()}"`);
      setAddingBrand(false);
      setNewBrandName('');
    } catch (error) {
      console.error('Error adding brand:', error);
      toast.error('Failed to add brand');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!editingBrand || !editingBrand.newName.trim()) return;
    if (editingBrand.oldName === editingBrand.newName.trim()) {
      setEditingBrand(null);
      return;
    }

    setIsProcessing(true);
    try {
      const q = query(collection(db, 'stations'), where('brand', '==', editingBrand.oldName));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          brand: editingBrand.newName.trim(),
          lastUpdated: serverTimestamp() 
        });
      });
      
      await batch.commit();

      const docSnap = await getDoc(doc(db, 'settings', 'brands'));
      if (docSnap.exists()) {
         const list = docSnap.data().list || [];
         if (list.includes(editingBrand.oldName)) {
           await setDoc(doc(db, 'settings', 'brands'), {
             list: arrayRemove(editingBrand.oldName)
           }, { merge: true });
         }
      }
      await setDoc(doc(db, 'settings', 'brands'), {
        list: arrayUnion(editingBrand.newName.trim())
      }, { merge: true });
      toast.success(`Successfully renamed brand to "${editingBrand.newName.trim()}"`);
      setEditingBrand(null);
    } catch (error) {
      console.error('Error updating brand:', error);
      toast.error('Failed to update brand');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBrand) return;
    
    setIsProcessing(true);
    try {
      const q = query(collection(db, 'stations'), where('brand', '==', deletingBrand));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          brand: 'Unknown',
          lastUpdated: serverTimestamp()
        });
      });
      
      await batch.commit();

      await setDoc(doc(db, 'settings', 'brands'), {
        list: arrayRemove(deletingBrand)
      }, { merge: true });
      toast.success(`Successfully deleted brand "${deletingBrand}"`);
      setDeletingBrand(null);
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Failed to delete brand');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-surface-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Manage Brands
          </h2>
          <p className="text-gray-500 mt-1">Manage, edit, or delete fuel station brands across the platform.</p>
        </div>
        <Button onClick={() => setAddingBrand(true)} className="w-full sm:w-auto flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Brand
        </Button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600 text-sm">Brand Name</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm w-48 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBrands.map((brand, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-surface-900">{brand}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Used by {stations.filter(s => s.brand === brand).length} stations</div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingBrand({ oldName: brand, newName: brand })}
                          className="text-primary border-primary/20 hover:bg-primary/5"
                        >
                          <Edit2 className="w-4 h-4 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingBrand(brand)}
                          className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:border-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBrands.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-gray-500">
                      No brands found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-surface-900 mb-2">Edit Brand Name</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will update the brand name for all {stations.filter(s => s.brand === editingBrand.oldName).length} stations currently using "{editingBrand.oldName}".
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-surface-900 mb-2">Brand Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-surface-900 font-medium transition-all"
                value={editingBrand.newName}
                onChange={(e) => setEditingBrand({ ...editingBrand, newName: e.target.value })}
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingBrand(null)}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isProcessing || !editingBrand.newName.trim() || editingBrand.oldName === editingBrand.newName.trim()}
                className="flex-1"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h3 className="text-xl font-bold text-surface-900 mb-2 text-center">Delete Brand?</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Are you sure you want to delete the brand <strong>"{deletingBrand}"</strong>? This will remove the brand from all {stations.filter(s => s.brand === deletingBrand).length} stations currently using it. This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeletingBrand(null)}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isProcessing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Delete Brand'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Brand Modal */}
      {addingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-surface-900 mb-2">Add New Brand</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create a new fuel station brand. It will be available for station owners to select when registering their stations.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-surface-900 mb-2">Brand Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-surface-900 font-medium transition-all"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="e.g. TotalEnergies"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setAddingBrand(false);
                  setNewBrandName('');
                }}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBrand}
                disabled={isProcessing || !newBrandName.trim()}
                className="flex-1"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Add Brand'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
