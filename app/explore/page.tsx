'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, ShoppingCart, Eye, Users, Calendar, BarChart3, BookOpen, User, Heart, MessageCircle, TrendingUp, Award, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getGoalPacksWithStats } from '@/services/appwrite/goalPackService';
import { GoalPackWithStats } from '@/lib/types';
import { toast } from 'sonner';
import BottomNav from '@/components/dashboard/BottomNav';
import GoalPackCard from '@/components/explore/GoalPackCard';
import GoalPackDetailModal from '@/components/explore/GoalPackDetailModal';
import ReviewModal from '@/components/explore/ReviewModal';

const ExplorePage = () => {
  const { user } = useAuth();
  const [goalPacks, setGoalPacks] = useState<GoalPackWithStats[]>([]);
  const [filteredGoalPacks, setFilteredGoalPacks] = useState<GoalPackWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'price'>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGoalPack, setSelectedGoalPack] = useState<GoalPackWithStats | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingGoalPack, setReviewingGoalPack] = useState<GoalPackWithStats | null>(null);

  const categories = [
    { id: 'all', name: 'All', icon: '🎯', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'finance', name: 'Finance', icon: '💰', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'schedule', name: 'Schedule', icon: '📅', color: 'bg-teal-100 text-teal-700 border-teal-200' },
    { id: 'career', name: 'Career', icon: '💼', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'audio_books', name: 'Audio Books', icon: '🎧', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  ];

  useEffect(() => {
    loadGoalPacks();
  }, [user]);

  useEffect(() => {
    filterAndSortGoalPacks();
  }, [goalPacks, searchQuery, selectedCategory, sortBy]);

  const loadGoalPacks = async () => {
    try {
      setLoading(true);
      const data = await getGoalPacksWithStats(user?.id);
      setGoalPacks(data.filter(pack => pack.isActive)); // Only show active packs
    } catch (error) {
      console.error('Error loading goal packs:', error);
      toast.error('Failed to load goal packs');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortGoalPacks = () => {
    let filtered = goalPacks;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(pack =>
        pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pack.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pack.tags?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(pack => pack.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.totalPurchases - a.totalPurchases);
        break;
      case 'rating':
        filtered.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price':
        // For now, sort by free first, then by popularity
        filtered.sort((a, b) => {
          // Free packs first
          if (a.tags?.includes('Free') && !b.tags?.includes('Free')) return -1;
          if (!a.tags?.includes('Free') && b.tags?.includes('Free')) return 1;
          return b.totalPurchases - a.totalPurchases;
        });
        break;
    }

    setFilteredGoalPacks(filtered);
  };

  const handleGoalPackClick = (goalPack: GoalPackWithStats) => {
    setSelectedGoalPack(goalPack);
    setIsDetailModalOpen(true);
  };

  const handleReviewClick = (goalPack: GoalPackWithStats) => {
    setReviewingGoalPack(goalPack);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    // Reload goal packs to get updated stats
    loadGoalPacks();
  };

  const renderStats = () => {
    const totalPacks = goalPacks.length;
    const totalReviews = goalPacks.reduce((sum, pack) => sum + pack.totalReviews, 0);
    const averageRating = goalPacks.length > 0 
      ? goalPacks.reduce((sum, pack) => sum + pack.averageRating, 0) / goalPacks.length 
      : 0;

    return (
      <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Award className="w-5 h-5 text-yellow-500 mr-2" />
          Explore Stats
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalPacks}</div>
            <div className="text-sm text-gray-600">Goal Packs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalReviews}</div>
            <div className="text-sm text-gray-600">Reviews</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500 mr-1" fill="currentColor" />
              <span className="text-2xl font-bold text-yellow-600">{averageRating.toFixed(1)}</span>
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading goal packs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Explore Goal Packs</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search goal packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories - Always Visible */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
            <div className="flex overflow-x-auto gap-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 border ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : `${category.color} hover:shadow-sm`
                  }`}
                >
                  <span className="mr-2 text-base">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          {showFilters && (
            <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                  <option value="price">Price (Free First)</option>
                </select>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      // Filter for free packs only
                      const filtered = goalPacks.filter(pack => 
                        pack.tags?.toLowerCase().includes('free')
                      );
                      setFilteredGoalPacks(filtered);
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    🎁 Free Only
                  </button>
                  <button
                    onClick={() => {
                      // Filter for highly rated packs
                      const filtered = goalPacks.filter(pack => pack.averageRating >= 4.0);
                      setFilteredGoalPacks(filtered);
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    ⭐ 4+ Stars
                  </button>
                  <button
                    onClick={() => {
                      // Filter for popular packs
                      const filtered = goalPacks.filter(pack => pack.totalPurchases >= 5);
                      setFilteredGoalPacks(filtered);
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    🔥 Popular
                  </button>
                  <button
                    onClick={() => {
                      // Reset filters
                      setSearchQuery('');
                      setSelectedCategory('all');
                      filterAndSortGoalPacks();
                    }}
                    className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left"
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Stats */}
        {renderStats()}

        {/* Current Filter Indicator */}
        {(selectedCategory !== 'all' || searchQuery.trim()) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-700">
                  Showing {filteredGoalPacks.length} of {goalPacks.length} goal packs
                </span>
                {selectedCategory !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Category: {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Search: "{searchQuery}"
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {/* Goal Packs Grid */}
        {filteredGoalPacks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No goal packs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Show all goal packs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGoalPacks.map((goalPack) => (
              <GoalPackCard
                key={goalPack.id}
                goalPack={goalPack}
                onCardClick={handleGoalPackClick}
                onReviewClick={handleReviewClick}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Goal Pack Detail Modal */}
      {selectedGoalPack && (
        <GoalPackDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedGoalPack(null);
          }}
          goalPack={selectedGoalPack}
          currentUserId={user?.id}
          onReviewClick={handleReviewClick}
          onPurchaseSuccess={loadGoalPacks}
        />
      )}

      {/* Review Modal */}
      {reviewingGoalPack && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewingGoalPack(null);
          }}
          goalPack={reviewingGoalPack}
          currentUserId={user?.id || ''}
          currentUserName={user?.name || 'Anonymous'}
          currentUserProfilePicture={user?.profilePicture}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default ExplorePage; 
