'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, Trash2 } from 'lucide-react';
import { GoalPackWithStats } from '@/lib/types';
import { createGoalPackReview, updateGoalPackReview, deleteGoalPackReview } from '@/src/services/appwrite/goalPackService';
import { toast } from 'sonner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalPack: GoalPackWithStats;
  currentUserId: string;
  currentUserName: string;
  currentUserProfilePicture?: string;
  onReviewSubmitted: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  goalPack,
  currentUserId,
  currentUserName,
  currentUserProfilePicture,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!goalPack.userReview;

  useEffect(() => {
    if (isOpen) {
      if (goalPack.userReview) {
        // Editing existing review
        setRating(goalPack.userReview.rating);
        setReviewText(goalPack.userReview.reviewText || '');
      } else {
        // Creating new review
        setRating(0);
        setReviewText('');
      }
      setHoverRating(0);
    }
  }, [isOpen, goalPack.userReview]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && goalPack.userReview) {
        // Update existing review
        await updateGoalPackReview(
          goalPack.userReview.id,
          { rating, reviewText: reviewText.trim() || undefined },
          currentUserId
        );
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        await createGoalPackReview(
          {
            goalPackId: goalPack.id,
            rating,
            reviewText: reviewText.trim() || undefined
          },
          currentUserId,
          currentUserName,
          currentUserProfilePicture
        );
        toast.success('Review submitted successfully!');
      }

      onReviewSubmitted();
      onClose();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!goalPack.userReview) return;

    try {
      setDeleting(true);
      await deleteGoalPackReview(goalPack.userReview.id, currentUserId);
      toast.success('Review deleted successfully!');
      onReviewSubmitted();
      onClose();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(error.message || 'Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (hoverRating || rating);
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              isFilled ? 'text-yellow-500' : 'text-gray-300'
            }`}
            fill={isFilled ? 'currentColor' : 'none'}
          />
        </button>
      );
    }
    return stars;
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/35 bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] flex flex-col relative"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-1 bg-gray-300 rounded-full" />
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {isEditing ? 'Edit Review' : 'Write Review'}
                    </h2>
                    <p className="text-gray-600">{goalPack.title}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Rating */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-3">How would you rate this goal pack?</h3>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {renderStars()}
                  </div>
                  <p className="text-sm text-gray-600">
                    {getRatingText(hoverRating || rating)}
                  </p>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review (Optional)
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts about this goal pack..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Help others by sharing your experience
                    </p>
                    <p className="text-xs text-gray-500">
                      {reviewText.length}/500
                    </p>
                  </div>
                </div>

                {/* Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Review Guidelines</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Be honest and constructive</li>
                    <li>• Focus on the goal pack content and usefulness</li>
                    <li>• Avoid personal attacks or inappropriate language</li>
                    <li>• Help others make informed decisions</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 border-t border-gray-200 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      {isEditing ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {isEditing ? 'Update Review' : 'Submit Review'}
                    </>
                  )}
                </button>

                {isEditing && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full border border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 transition-colors disabled:bg-red-100 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Delete Review
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal; 
