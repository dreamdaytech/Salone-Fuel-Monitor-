import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot, doc, updateDoc } from '../firebase';
import { CheckCircle, XCircle, ShieldCheck, Clock, User, Phone, FileText } from 'lucide-react';
import { Button } from './ui/Button';
import { toast } from 'sonner';

type AdminStationClaimsProps = {
  onViewStation?: (stationId: string) => void;
};

export default function AdminStationClaims({ onViewStation }: AdminStationClaimsProps) {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'station_claims'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const claimsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClaims(claimsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (claim: any) => {
    if (!window.confirm(`Are you sure you want to approve this claim for ${claim.stationName}?`)) return;
    
    try {
      // 1. Update the station document
      await updateDoc(doc(db, 'stations', claim.stationId), {
        ownerId: claim.userId,
        claimStatus: 'claimed'
      });

      // 2. Update the user profile
      await updateDoc(doc(db, 'users', claim.userId), {
        role: 'station_owner'
      });

      // 3. Update the claim status
      await updateDoc(doc(db, 'station_claims', claim.id), {
        status: 'approved'
      });

      toast.success('Claim approved successfully');
    } catch (error) {
      console.error('Error approving claim:', error);
      toast.error('Failed to approve claim');
    }
  };

  const handleReject = async (claim: any) => {
    if (!window.confirm('Are you sure you want to reject this claim?')) return;
    
    try {
      await updateDoc(doc(db, 'station_claims', claim.id), {
        status: 'rejected'
      });
      toast.success('Claim rejected');
    } catch (error) {
      console.error('Error rejecting claim:', error);
      toast.error('Failed to reject claim');
    }
  };

  const handleRevoke = async (claim: any) => {
    if (!window.confirm(`Are you sure you want to revoke approval for ${claim.stationName}?`)) return;
    
    try {
      // 1. Reset the station document
      await updateDoc(doc(db, 'stations', claim.stationId), {
        ownerId: null,
        claimStatus: 'unclaimed'
      });

      // Note: We don't downgrade the user's role here because they might own other stations.

      // 2. Update the claim status
      await updateDoc(doc(db, 'station_claims', claim.id), {
        status: 'pending'
      });

      toast.success('Claim unapproved successfully');
    } catch (error) {
      console.error('Error revoking claim:', error);
      toast.error('Failed to revoke claim');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Station Ownership Claims
          </h2>
          <p className="text-sm text-gray-500 mt-1">Review and approve requests from users claiming to own stations.</p>
        </div>
        
        {claims.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No claims found.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {claims.map(claim => (
              <div key={claim.id} className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 
                      className={`text-lg font-bold text-surface-900 ${onViewStation ? 'cursor-pointer hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4' : ''}`}
                      onClick={() => onViewStation?.(claim.stationId)}
                      title={onViewStation ? "View Station Details" : undefined}
                    >
                      {claim.stationName}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      claim.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      claim.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      {claim.userEmail}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {claim.contactPhone}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600 sm:col-span-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="bg-gray-100 p-3 rounded-lg flex-1 italic text-gray-700">{claim.proofDetails}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Submitted: {claim.createdAt?.seconds ? new Date(claim.createdAt.seconds * 1000).toLocaleString() : 'Recent'}
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col gap-2">
                  {(claim.status === 'pending' || claim.status === 'rejected') && (
                    <Button
                      onClick={() => handleApprove(claim)}
                      variant="primary"
                      className="px-4 py-2 text-xs flex items-center justify-center gap-2 font-bold w-full md:w-40"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                  )}
                  {claim.status === 'pending' && (
                    <Button
                      onClick={() => handleReject(claim)}
                      variant="outline"
                      className="px-4 py-2 text-xs flex items-center justify-center gap-2 font-bold w-full md:w-40 border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  )}
                  {claim.status === 'approved' && (
                    <Button
                      onClick={() => handleRevoke(claim)}
                      variant="outline"
                      className="px-4 py-2 text-xs flex items-center justify-center gap-2 font-bold w-full md:w-40 border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Unapprove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
