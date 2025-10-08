'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  Clock,
  Target,
  Star,
  Heart,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader,
  Filter,
  Globe,
  Calendar,
  Award,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import partnerMatchingService, { MatchingResult } from '@/services/partnerMatchingService';
import { partnershipService } from '@/services/appwrite/partnershipService';
import { userService } from '@/services/userService';
import { expertService } from '@/services/appwrite/expertService';
import { PartnershipPreferences, Partnership } from '@/database/partner-accountability-schema';

interface PartnerMatchingInterfaceProps {
  onPartnershipCreated?: (partnership: Partnership) => void;
  onClose?: () => void;
}

const PartnerMatchingInterface: React.FC<PartnerMatchingInterfaceProps> = ({
  onPartnershipCreated,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [potentialExperts, setPotentialExperts] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<PartnershipPreferences | null>(null);
  const [matchingInProgress, setMatchingInProgress] = useState(false);

  // Load user preferences
  useEffect(() => {
    loadUserPreferences();
  }, [user?.id]);


  const loadUserPreferences = async () => {
    if (!user?.id) return;

    try {
      const preferences = await partnershipService.getPartnerPreferences(user.id);
      setUserPreferences(preferences);

      if (!preferences) {
        toast.error('Please set up your partner preferences first');
        return;
      }

      if (!preferences.isAvailableForMatching) {
        toast.warning('Your account is not set as available for matching');
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      toast.error('Failed to load your preferences');
    }
  };

  const handleAutoMatch = async () => {
    if (!user?.id || !userPreferences) {
      toast.error('Please set up your preferences first');
      return;
    }

    setMatchingInProgress(true);
    try {
      // Find experts that match user's goal categories
      const experts: any[] = [];
      
      if (userPreferences.goalCategories && userPreferences.goalCategories.length > 0) {
        for (const goalCategory of userPreferences.goalCategories) {
          const categoryExperts = await expertService.getExpertsByCategory(goalCategory);
          experts.push(...categoryExperts);
        }
      }
      
      // Remove duplicates and filter available experts
      const uniqueExperts = experts.filter((expert, index, self) => 
        index === self.findIndex(e => e.id === expert.id) && 
        expert.isAvailableForMatching
      );
      
      if (uniqueExperts.length === 0) {
        toast.error('No experts available for your goal categories. Try manual search.');
        return;
      }
      
      setPotentialExperts(uniqueExperts);
      toast.success(`Found ${uniqueExperts.length} expert(s) matching your goals!`);
      
    } catch (error) {
      console.error('Error finding experts:', error);
      toast.error('Failed to find experts. Please try again.');
    } finally {
      setMatchingInProgress(false);
    }
  };



  const handleRequestPartnership = async (partnerId: string) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // All expert requests are premium_expert partnerships
      const result = await partnerMatchingService.requestSpecificPartnership(user.id, partnerId, 'premium_expert');

      if (result.success && result.partnership) {
        toast.success(result.message);
        onPartnershipCreated?.(result.partnership);
        onClose?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error requesting partnership:', error);
      toast.error('Failed to request partnership');
    } finally {
      setLoading(false);
    }
  };



  if (!userPreferences) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Set Up Your Preferences</h3>
        <p className="text-gray-600 mb-6">You need to set up your partner preferences before you can find accountability partners.</p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Set Up Preferences
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Find Your Expert Coach</h2>
              <p className="text-sm text-gray-600">Connect with experts who can help you achieve your goals</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>
        <div className="p-6">

      {/* Auto Match Section */}
      <div className="bg-purple-50 rounded-lg p-6 mb-6">
        <div className="text-center">
          <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Expert Coaches</h3>
          <p className="text-gray-600 mb-4">
            Get matched with expert coaches based on your goal categories
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAutoMatch}
            disabled={matchingInProgress}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
          >
            {matchingInProgress ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Finding Experts...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Find Expert Coaches</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Auto Match Mode */}
      {mode === 'auto' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Find Your Perfect Match?</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Based on your preferences, we'll find the most compatible accountability partner for you.
            Our algorithm considers your goals, schedule, and support style.
          </p>

          {/* User Preferences Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <h4 className="font-semibold text-gray-900 mb-4">Your Preferences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>Partner Type: {userPreferences.preferredPartnerType.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Time: {userPreferences.timeCommitment}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span>Categories: {userPreferences.availableCategories.map(getCategoryLabel).join(', ')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-gray-500" />
                <span>Experience: {userPreferences.experienceLevel}</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAutoMatch}
            disabled={matchingInProgress || !userPreferences.isAvailableForMatching}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto"
          >
            {matchingInProgress ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Finding Your Partner...</span>
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                <span>Find My Perfect Match</span>
              </>
            )}
          </motion.button>

          {!userPreferences.isAvailableForMatching && (
            <p className="text-yellow-600 mt-4 text-sm">
              Your account is not set as available for matching. Update your preferences to enable matching.
            </p>
          )}
        </motion.div>
      )}

      {/* Manual Search Mode */}
      {mode === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search Filters */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Search Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Filter className="w-4 h-4" />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
                >
                  <select
                    value={searchFilters.category}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any Category</option>
                    <option value="schedule">Schedule</option>
                    <option value="finance">Finance</option>
                    <option value="career">Career</option>
                    <option value="audio_books">Learning</option>
                  </select>

                  <select
                    value={searchFilters.timeCommitment}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, timeCommitment: e.target.value }))}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any Time Commitment</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="flexible">Flexible</option>
                  </select>

                  <select
                    value={searchFilters.experienceLevel}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, experienceLevel: e.target.value }))}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any Experience</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleManualSearch}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search Partners</span>
              </motion.button>

              <button
                onClick={() => setSearchFilters({ category: '', supportStyle: '', timeCommitment: '', partnerType: '', experienceLevel: '' })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div>
            {potentialPartners.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h4>
                <p className="text-gray-600">Search for partners using the filters above</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Potential Partners ({potentialPartners.length})
                  </h3>
                  <button
                    onClick={handleManualSearch}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(mode === 'auto' && potentialExperts.length > 0 ? potentialExperts : potentialPartners).map((partner, index) => (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Award className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {mode === 'auto' && potentialExperts.length > 0 
                                ? `Expert #${index + 1}` 
                                : partnerUserDetails[partner.userId]?.name || `Partner #${index + 1}`}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {mode === 'auto' && potentialExperts.length > 0 
                                ? `${partner.yearsOfExperience} years experience` 
                                : `${partner.experienceLevel} level`}
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${mode === 'auto' && potentialExperts.length > 0 ? 'bg-purple-100 text-purple-800' : getCompatibilityColor(compatibilityScores[index])}`}>
                          {mode === 'auto' && potentialExperts.length > 0 ? 'Expert' : `${compatibilityScores[index]}% match`}
                        </div>
                      </div>

                      {partner.bio && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{partner.bio}</p>
                      )}

                      <div className="space-y-2 mb-4">
                        {mode === 'auto' && potentialExperts.length > 0 ? (
                          <>
                            <div className="flex items-center space-x-2 text-sm">
                              <Target className="w-4 h-4 text-gray-500" />
                              <span>{partner.expertiseAreas?.join(', ') || 'Expert'}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Star className="w-4 h-4 text-gray-500" />
                              <span>Rating: {partner.rating?.toFixed(1) || '0.0'}/5.0</span>
                            </div>
                            {partner.hourlyRate && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Award className="w-4 h-4 text-gray-500" />
                                <span>${partner.hourlyRate}/hour</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2 text-sm">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span>{partner.totalClientsHelped || 0} clients helped</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{partner.timeCommitment} commitment</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Target className="w-4 h-4 text-gray-500" />
                              <span>{partner.availableCategories.map(getCategoryLabel).join(', ')}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Star className="w-4 h-4 text-gray-500" />
                              <span>{partner.supportStyle?.map(getSupportStyleLabel).join(', ') || 'N/A'}</span>
                            </div>
                            {partner.timezone && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Globe className="w-4 h-4 text-gray-500" />
                                <span>{partner.timezone}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRequestPartnership(mode === 'auto' && potentialExperts.length > 0 ? partner.userId : partner.userId)}
                          className={`flex-1 px-3 py-2 text-white rounded-lg transition-colors text-sm ${
                            mode === 'auto' && potentialExperts.length > 0 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {mode === 'auto' && potentialExperts.length > 0 ? 'Request Expert' : 'Request Partnership'}
                        </motion.button>
                        <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        {mode === 'auto' && potentialExperts.length > 0 
                          ? 'Expert available for your goal categories' 
                          : getCompatibilityLabel(compatibilityScores[index])}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </div>
    </div>
    </div>
  );
};

export default PartnerMatchingInterface;