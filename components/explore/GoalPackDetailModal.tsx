'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingCart, Users, MessageCircle, Crown, Gift, Target, Calendar, User as UserIcon, Clock, ThumbsUp } from 'lucide-react';
import { GoalPackWithStats, GoalPackReview, Milestone } from '@/lib/types';
import { getGoalPackReviews, purchaseGoalPack } from '@/src/services/appwrite/goalPackService';
import { createGoal } from '@/src/services/appwrite/database';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image';

interface GoalPackDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalPack: GoalPackWithStats;
  currentUserId?: string;
  onReviewClick: (goalPack: GoalPackWithStats) => void;
  onPurchaseSuccess: () => void;
}

const GoalPackDetailModal: React.FC<GoalPackDetailModalProps> = ({
  isOpen,
  onClose,
  goalPack,
  currentUserId,
  onReviewClick,
  onPurchaseSuccess
}) => {
  const [reviews, setReviews] = useState<GoalPackReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [addingToGoals, setAddingToGoals] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'milestones'>('overview');

  useEffect(() => {
    if (isOpen) {
      loadReviews();
    }
  }, [isOpen, goalPack.id]);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const reviewsData = await getGoalPackReviews(goalPack.id);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handlePurchase = async () => {
    if (!currentUserId) {
      toast.error('Please log in to purchase');
      return;
    }

    try {
      setPurchasing(true);
      await purchaseGoalPack({ goalPackId: goalPack.id, purchasePrice: 0 }, currentUserId);
      toast.success('Goal pack purchased successfully!');
      onPurchaseSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error purchasing goal pack:', error);
      toast.error(error.message || 'Failed to purchase goal pack');
    } finally {
      setPurchasing(false);
    }
  };

  const handleAddToGoals = async () => {
    if (!currentUserId) {
      toast.error('Please log in to add to goals');
      return;
    }

    try {
      setAddingToGoals(true);
      
      // Parse milestones if available
      let milestones: Milestone[] = [];
      if (goalPack.milestones) {
        try {
          milestones = JSON.parse(goalPack.milestones);
        } catch (e) {
          console.error('Error parsing milestones:', e);
        }
      }

      const goalData = {
        title: goalPack.title,
        description: goalPack.description || undefined,
        category: goalPack.category,
        tags: goalPack.tags || undefined,
        milestones: milestones.length > 0 ? JSON.stringify(milestones) : undefined,
        isCompleted: false
      };

      await createGoal(goalData, currentUserId);
      toast.success('Goal pack added to your goals!');
      onClose();
    } catch (error: any) {
      console.error('Error adding to goals:', error);
      toast.error(error.message || 'Failed to add to goals');
    } finally {
      setAddingToGoals(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className={`${starSize} text-yellow-500`} fill="currentColor" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className={`${starSize} text-gray-300`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${starSize} text-yellow-500`} fill="currentColor" />
          </div>
        </div>
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />
      );
    }

    return stars;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            {renderStars(goalPack.averageRating)}
          </div>
          <div className="text-lg font-semibold">{goalPack.averageRating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Rating</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <MessageCircle className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <div className="text-lg font-semibold">{goalPack.totalReviews}</div>
          <div className="text-sm text-gray-600">Reviews</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Users className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <div className="text-lg font-semibold">{goalPack.totalPurchases}</div>
          <div className="text-sm text-gray-600">Users</div>
        </div>
      </div>

      {/* Description */}
      {goalPack.description && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Description</h3>
          <p className="text-gray-700 leading-relaxed">{goalPack.description}</p>
        </div>
      )}

      {/* Details */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium capitalize">{goalPack.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Target Users:</span>
            <span className="font-medium">
              {goalPack.targetUserType === 'all' ? 'All Users' : 
               goalPack.targetUserType === 'student' ? 'Students' : 'Non-Students'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">{format(new Date(goalPack.createdAt), 'MMM d, yyyy')}</span>
          </div>
          {goalPack.tags && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tags:</span>
              <span className="font-medium">{goalPack.tags}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMilestones = () => {
    let milestones: Milestone[] = [];
    if (goalPack.milestones) {
      try {
        milestones = JSON.parse(goalPack.milestones);
      } catch (e) {
        console.error('Error parsing milestones:', e);
      }
    }

    if (milestones.length === 0) {
      return (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No milestones defined for this goal pack</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-500" />
          Milestones ({milestones.length})
        </h3>
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{milestone.title}</h4>
                  {milestone.description && (
                    <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                  )}
                  {milestone.date && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(milestone.date), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReviews = () => {
    if (loadingReviews) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No reviews yet</p>
          {currentUserId && (
            <button
              onClick={() => onReviewClick(goalPack)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Be the first to review
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
          {currentUserId && !goalPack.userReview && (
            <button
              onClick={() => onReviewClick(goalPack)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Write Review
            </button>
          )}
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {review.userProfilePicture ? (
                    <Image
                      src={review.userProfilePicture}
                      alt={review.userName}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{review.userName}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {renderStars(review.rating, 'sm')}
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    {review.userId === currentUserId && (
                      <button
                        onClick={() => onReviewClick(goalPack)}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {review.reviewText && (
                    <p className="text-gray-700 mb-3">{review.reviewText}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button className="flex items-center gap-1 hover:text-gray-700">
                      <ThumbsUp className="w-4 h-4" />
                      Helpful
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isFreePack = goalPack.tags?.toLowerCase().includes('free');

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
                    <div className="flex items-center gap-2 mb-2">
                      {isFreePack && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          <Gift className="w-3 h-3 inline mr-1" />
                          Free
                        </span>
                      )}
                      {goalPack.tags?.toLowerCase().includes('premium') && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                          <Crown className="w-3 h-3 inline mr-1" />
                          Premium
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{goalPack.title}</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {renderStars(goalPack.averageRating, 'sm')}
                      </div>
                      <span className="text-sm text-gray-600">
                        {goalPack.averageRating.toFixed(1)} ({goalPack.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'milestones', label: 'Milestones' },
                  { id: 'reviews', label: 'Reviews' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'milestones' && renderMilestones()}
                {activeTab === 'reviews' && renderReviews()}
              </div>

              {/* Actions */}
              <div className="p-5 border-t border-gray-200 space-y-3">
                {goalPack.isPurchased ? (
                  <button
                    onClick={handleAddToGoals}
                    disabled={addingToGoals}
                    className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300 flex items-center justify-center gap-2"
                  >
                    {addingToGoals ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Adding to Goals...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5" />
                        Add to My Goals
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
                  >
                    {purchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        {isFreePack ? 'Get Free Pack' : 'Purchase Pack'}
                      </>
                    )}
                  </button>
                )}

                {currentUserId && (
                  <button
                    onClick={() => onReviewClick(goalPack)}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {goalPack.userReview ? 'Edit Review' : 'Write Review'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GoalPackDetailModal; 