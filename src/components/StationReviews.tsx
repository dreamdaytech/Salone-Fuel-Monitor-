import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Star, MessageSquare, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';

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

interface StationReviewsProps {
  stationId: string;
}

export default function StationReviews({ stationId }: StationReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stationId) return;

    // Only fetch approved reviews for public display
    const q = query(
      collection(db, 'reviews'),
      where('stationId', '==', stationId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

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
        // Don't throw here as it might break the UI if index is missing
      }
    );

    return () => unsubscribe();
  }, [stationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to submit a review.");
      return;
    }
    
    if (rating < 1 || rating > 5) {
      setError("Please select a valid rating.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'reviews'), {
        stationId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        rating,
        text: text.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setSubmitSuccess(true);
      setText('');
      setRating(5);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            variant="unstyled"
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            showNotification={false}
          >
            <Star 
              className={`w-5 h-5 ${
                star <= count 
                  ? 'fill-amber-400 text-amber-400' 
                  : 'fill-gray-100 text-gray-200'
              }`} 
            />
          </Button>
        ))}
      </div>
    );
  };

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Station Reviews</h4>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-amber-900">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-amber-700 font-medium">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Review Submission Form */}
      {user ? (
        <div className="bg-surface-50 p-5 rounded-2xl border border-gray-100">
          <h5 className="text-sm font-bold text-surface-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Write a Review
          </h5>
          
          {submitSuccess ? (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-medium">Review submitted successfully! It will appear after moderation.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm flex items-center gap-2 border border-rose-100">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Rating</label>
                {renderStars(rating, true)}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Your Review (Optional)</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share your experience at this station..."
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none h-24"
                  maxLength={1000}
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  notificationMessage="Review submitted successfully! It will appear after moderation."
                  variant="primary"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  {!isSubmitting && <Send className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-center">
          <p className="text-sm text-gray-600 font-medium mb-3">Sign in to leave a review for this station.</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-900">{review.userName}</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {review.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              {review.text && (
                <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 border-dashed">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-500">No reviews yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to review this station!</p>
          </div>
        )}
      </div>
    </div>
  );
}
