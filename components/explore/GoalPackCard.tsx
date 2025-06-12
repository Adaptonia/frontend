'use client';

import React from 'react';
import { Star, ShoppingCart, Eye, Users, MessageCircle, Crown, Gift, Clock } from 'lucide-react';
import { GoalPackWithStats } from '@/lib/types';
import { format } from 'date-fns';

interface GoalPackCardProps {
  goalPack: GoalPackWithStats;
  onCardClick: (goalPack: GoalPackWithStats) => void;
  onReviewClick: (goalPack: GoalPackWithStats) => void;
  currentUserId?: string;
}

const GoalPackCard: React.FC<GoalPackCardProps> = ({
  goalPack,
  onCardClick,
  onReviewClick,
  currentUserId
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'finance':
        return '💰';
      case 'schedule':
        return '📅';
      case 'career':
        return '💼';
      case 'audio_books':
        return '🎧';
      default:
        return '🎯';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'finance':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'schedule':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'career':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'audio_books':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className={`${starSize} text-yellow-500`} fill="currentColor" />
      );
    }

    // Half star
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

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />
      );
    }

    return stars;
  };

  const isFreePack = goalPack.tags?.toLowerCase().includes('free');
  const isPremium = goalPack.tags?.toLowerCase().includes('premium');
  const isPopular = goalPack.tags?.toLowerCase().includes('popular');
  const isNew = goalPack.tags?.toLowerCase().includes('new');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header with badges */}
      <div className="relative">
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getCategoryIcon(goalPack.category)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(goalPack.category)}`}>
                  {goalPack.category.charAt(0).toUpperCase() + goalPack.category.slice(1)}
                </span>
                
                {/* Special badges */}
                {isFreePack && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                    <Gift className="w-3 h-3 inline mr-1" />
                    Free
                  </span>
                )}
                
                {isPremium && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                    <Crown className="w-3 h-3 inline mr-1" />
                    Premium
                  </span>
                )}
                
                {isPopular && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                    🔥 Popular
                  </span>
                )}
                
                {isNew && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                    <Clock className="w-3 h-3 inline mr-1" />
                    New
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {goalPack.title}
              </h3>
              
              {goalPack.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {goalPack.description}
                </p>
              )}
            </div>
          </div>

          {/* Rating and stats */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  {renderStars(goalPack.averageRating)}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {goalPack.averageRating > 0 ? goalPack.averageRating.toFixed(1) : 'No rating'}
                </span>
                <span className="text-sm text-gray-500">
                  ({goalPack.totalReviews})
                </span>
              </div>
            </div>

            {/* Purchase count */}
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{goalPack.totalPurchases} users</span>
            </div>
          </div>

          {/* Target user type */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              For: <span className="font-medium">
                {goalPack.targetUserType === 'all' ? 'All Users' : 
                 goalPack.targetUserType === 'student' ? 'Students' : 'Non-Students'}
              </span>
            </span>
            
            <span className="text-xs text-gray-500">
              {format(new Date(goalPack.createdAt), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onCardClick(goalPack)}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            
            {currentUserId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewClick(goalPack);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                {goalPack.userReview ? 'Edit Review' : 'Review'}
              </button>
            )}
          </div>

          {/* Purchase status */}
          {goalPack.isPurchased && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <ShoppingCart className="w-4 h-4" />
                <span className="font-medium">Purchased</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalPackCard; 