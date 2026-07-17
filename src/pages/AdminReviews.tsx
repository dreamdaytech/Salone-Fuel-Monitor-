import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Trash2, Star, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Review {
  id: string;
  stationId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export default function AdminReviews() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    setVisibleCount(8);
  }, [filter]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    let q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    
    if (filter !== 'all') {
      q = query(
        collection(db, 'reviews'),
        where('status', '==', filter),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const reviewData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        setReviews(reviewData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching reviews:", error);
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin, filter]);

  const handleStatusUpdate = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating review status:", error);
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
      handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`w-4 h-4 ${
              star <= count 
                ? 'fill-amber-400 text-amber-400' 
                : 'fill-gray-100 text-gray-200'
            }`} 
          />
        ))}
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-surface-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2 tracking-tight">Review Moderation</h1>
          <p className="text-gray-500 font-medium">Manage user reviews for fuel stations</p>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant="unstyled"
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                filter === status 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-500 hover:text-surface-900 hover:bg-gray-50'
              }`}
              showNotification={false}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6">
            {reviews.slice(0, visibleCount).map((review) => (
              <div key={review.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-surface-900">{review.userName}</h3>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                          review.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          review.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {review.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">
                        Station ID: {review.stationId} • {review.createdAt?.toDate?.()?.toLocaleString() || 'Unknown Date'}
                      </p>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  
                  {review.text && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  {review.status !== 'approved' && (
                    <Button
                      onClick={() => handleStatusUpdate(review.id, 'approved')}
                      variant="unstyled"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-colors border border-emerald-100"
                      showNotification={false}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                  )}
                  {review.status !== 'rejected' && (
                    <Button
                      onClick={() => handleStatusUpdate(review.id, 'rejected')}
                      variant="unstyled"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-sm font-bold transition-colors border border-amber-100"
                      showNotification={false}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(review.id)}
                    variant="unstyled"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-sm font-bold transition-colors border border-rose-100 mt-auto"
                    showNotification={false}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {reviews.length > visibleCount && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => setVisibleCount(prev => prev + 8)}
                variant="secondary"
                className="px-8 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
                showNotification={false}
              >
                Show More Reviews
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-surface-900 mb-2">No Reviews Found</h3>
          <p className="text-gray-500 font-medium">There are currently no reviews matching the "{filter}" filter.</p>
        </div>
      )}
    </div>
  );
}
