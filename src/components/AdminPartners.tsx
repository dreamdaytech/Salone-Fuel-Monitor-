import React, { useState, useEffect, useRef } from 'react';
import { db, collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from '../firebase';
import { Partner } from '../types/partner';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Link as LinkIcon, Loader2, Save, X, MoreVertical } from 'lucide-react';
import { Button } from './ui/Button';
import { toast } from 'sonner';

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<{id: string, name: string} | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    logoUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'partners'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Partner[];
      setPartners(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching partners:", error);
      toast.error('Failed to load partners');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        // Keep aspect ratio but fit within constraints
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.9);
        setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.logoUrl) {
      toast.error('Name and logo are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await setDoc(doc(db, 'partners', editingId), {
          name: formData.name.trim(),
          websiteUrl: formData.websiteUrl.trim(),
          logoUrl: formData.logoUrl
        }, { merge: true });
        toast.success('Partner updated successfully');
      } else {
        const newRef = doc(collection(db, 'partners'));
        await setDoc(newRef, {
          name: formData.name.trim(),
          websiteUrl: formData.websiteUrl.trim(),
          logoUrl: formData.logoUrl,
          order: partners.length,
          createdAt: serverTimestamp()
        });
        toast.success('Partner added successfully');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast.error('Failed to save partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', websiteUrl: '', logoUrl: '' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (partner: Partner) => {
    setFormData({
      name: partner.name,
      websiteUrl: partner.websiteUrl || '',
      logoUrl: partner.logoUrl
    });
    setEditingId(partner.id);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPartner) return;
    try {
      await deleteDoc(doc(db, 'partners', deletingPartner.id));
      toast.success('Partner removed');
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Failed to remove partner');
    } finally {
      setDeletingPartner(null);
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === partners.length - 1)
    ) return;

    const newPartners = [...partners];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap order values
    const tempOrder = newPartners[index].order;
    newPartners[index].order = newPartners[swapIndex].order;
    newPartners[swapIndex].order = tempOrder;

    // Sort array
    newPartners.sort((a, b) => a.order - b.order);
    
    // Optimistic update
    setPartners(newPartners);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'partners', newPartners[index].id), { order: newPartners[index].order });
      batch.update(doc(db, 'partners', newPartners[swapIndex].id), { order: newPartners[swapIndex].order });
      await batch.commit();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
      // Revert will happen automatically on next snapshot
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Strategic Affiliations</h2>
          <p className="text-sm text-gray-500 mt-1">Manage trusted partners and supporters displayed on the About Us page.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Add Partner
        </Button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-surface-900">{editingId ? 'Edit Partner' : 'Add New Partner'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. Petroleum Regulatory Agency"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL (Optional)</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partner Logo *</label>
              
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click or drag image to upload</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 2MB (Transparent bg recommended)</p>
                  </div>
                </div>

                {formData.logoUrl && (
                  <div className="w-48 h-32 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                    <img src={formData.logoUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                      className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !formData.logoUrl} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? 'Save Changes' : 'Add Partner'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {partners.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <ul className="divide-y divide-gray-200">
            {partners.map((partner, index) => (
              <li key={partner.id} className="p-4 hover:bg-gray-50 flex items-center gap-6 group transition-colors">
                <div className="flex flex-col gap-1 text-gray-400">
                  <button 
                    onClick={() => moveOrder(index, 'up')}
                    disabled={index === 0}
                    className="hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => moveOrder(index, 'down')}
                    disabled={index === partners.length - 1}
                    className="hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 flex-1 min-w-0">
                  <div className="w-32 h-16 bg-gray-50 border border-gray-100 rounded flex items-center justify-center p-2 flex-shrink-0">
                    <img src={partner.logoUrl} alt={partner.name} className="max-w-full max-h-full object-contain" />
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <h4 className="text-lg font-bold text-gray-900 truncate">{partner.name}</h4>
                    {partner.websiteUrl && (
                      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1 truncate">
                        <LinkIcon className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{partner.websiteUrl}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="relative" ref={openMenuId === partner.id ? menuRef : null}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === partner.id ? null : partner.id)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                    title="More options"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {openMenuId === partner.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-[9999] py-1 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => { handleEdit(partner); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => { setDeletingPartner({id: partner.id, name: partner.name}); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No Partners Added Yet</h3>
          <p className="mt-1 text-gray-500">Add affiliations to display them on the About Us page.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 mb-2">Remove Affiliation?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to remove <strong>"{deletingPartner.name}"</strong>? This action cannot be undone and will immediately remove them from the About Us page.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeletingPartner(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
