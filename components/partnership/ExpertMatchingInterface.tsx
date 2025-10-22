'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Award,
  Star,
  MessageSquare,
  Loader,
  Users,
  Target,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { partnershipService } from '@/services/appwrite/partnershipService';
import { expertService } from '@/services/appwrite/expertService';
import { getUserById } from '@/services/appwrite/userService';
import { PartnershipPreferences, Partnership } from '@/database/partner-accountability-schema';

interface ExpertMatchingInterfaceProps {
  onPartnershipCreated?: (partnership: Partnership) => void;
  onClose?: () => void;
}

const ExpertMatchingInterface: React.FC<ExpertMatchingInterfaceProps> = ({
  onPartnershipCreated,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [potentialExperts, setPotentialExperts] = useState<any[]>([]);
  const [expertUserDetails, setExpertUserDetails] = useState<{[key: string]: any}>({});
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
      console.log('🔍 User preferences:', userPreferences);
      console.log('🎯 Goal categories:', userPreferences.goalCategories);
      
      // Find experts that match user's goal categories
      const experts: any[] = [];
      
      if (userPreferences.goalCategories && userPreferences.goalCategories.length > 0) {
        console.log('✅ User has goal categories, searching for experts...');
        for (const goalCategory of userPreferences.goalCategories) {
          console.log('🔍 Searching for experts in category:', goalCategory);
          const categoryExperts = await expertService.getExpertsByCategory(goalCategory);
          console.log('📊 Found experts for category:', goalCategory, categoryExperts.length);
          experts.push(...categoryExperts);
        }
      } else {
        console.log('❌ No goal categories found in user preferences');
        toast.error('Please set your goal categories in your preferences first.');
        return;
      }
      
      // Remove duplicates and filter available experts
      const uniqueExperts = experts.filter((expert, index, self) => 
        index === self.findIndex(e => e.id === expert.id) && 
        expert.isAvailableForMatching
      );
      
      if (uniqueExperts.length === 0) {
        toast.error('No experts available for your goal categories. Please update your preferences.');
        return;
      }
      
      setPotentialExperts(uniqueExperts);
      
      // Fetch expert user details
      await fetchExpertUserDetails(uniqueExperts);
      
      toast.success(`Found ${uniqueExperts.length} expert(s) matching your goals!`);
      
    } catch (error) {
      console.error('Error finding experts:', error);
      toast.error('Failed to find experts. Please try again.');
    } finally {
      setMatchingInProgress(false);
    }
  };

  const fetchExpertUserDetails = async (experts: any[]) => {
    const userDetails: {[key: string]: any} = {};
    
    console.log('🔍 Fetching user details for experts:', experts.map(e => e.userId));
    
    for (const expert of experts) {
      try {
        console.log('🔍 Fetching user details for expert:', expert.userId);
        const userResult = await getUserById(expert.userId);
        console.log('📊 User result:', userResult);
        
        if (userResult.success && userResult.data) {
          userDetails[expert.userId] = userResult.data;
          console.log('✅ User details stored:', userResult.data.name);
        } else {
          console.log('❌ Failed to get user details for:', expert.userId);
        }
      } catch (error) {
        console.error(`Error fetching user details for ${expert.userId}:`, error);
      }
    }
    
    console.log('📦 Final expert user details:', userDetails);
    setExpertUserDetails(userDetails);
  };

  const handleJoinExpert = async (expertId: string) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Directly create partnership with expert (auto-approved)
      const result = await partnershipService.createPartnership(
        user.id,
        expertId,
        'premium_expert',
        {
          supportStyle: userPreferences?.supportStyle || [],
          categories: userPreferences?.availableCategories || [],
          timeCommitment: userPreferences?.timeCommitment || 'flexible',
        }
      );

      if (result) {
        // Send expert class specific email notifications
        try {
          const partnerNotificationService = (await import('@/services/partnerNotificationService')).default;

          // Send specialized emails for expert class joining
          // studentId = current user (mentee), expertId = the expert they're joining
          await partnerNotificationService.notifyExpertClassJoined(
            result.id,
            user.id, // student/mentee
            expertId // expert/mentor
          );
          console.log('✅ Expert class email notifications sent to both student and expert');
        } catch (error) {
          console.error('❌ Failed to send email notifications:', error);
          // Don't fail the partnership creation if email fails
        }

        toast.success('Successfully joined expert class!');
        onPartnershipCreated?.(result);
        onClose?.();
      } else {
        toast.error('Failed to join expert class');
      }
    } catch (error) {
      console.error('Error joining expert:', error);
      toast.error('Failed to join expert class');
    } finally {
      setLoading(false);
    }
  };

  if (!userPreferences) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Set Up Your Preferences</h3>
        <p className="text-gray-600 mb-4">Please set up your partner preferences first</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Close
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

          {/* Expert Results */}
          {potentialExperts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Available Expert Coaches ({potentialExperts.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {potentialExperts.map((expert, index) => (
                  <motion.div
                    key={expert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {expertUserDetails[expert.userId]?.name || `Expert #${index + 1}`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {expert.yearsOfExperience} years experience
                          </p>
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Expert
                      </div>
                    </div>

                    {expert.bio && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{expert.bio}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span>{expert.expertiseAreas?.join(', ') || 'Expert'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Star className="w-4 h-4 text-gray-500" />
                        <span>Rating: {expert.rating?.toFixed(1) || '0.0'}/5.0</span>
                      </div>
                      {expert.hourlyRate && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Award className="w-4 h-4 text-gray-500" />
                          <span>${expert.hourlyRate}/hour</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{expert.totalClientsHelped || 0} clients helped</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleJoinExpert(expert.userId)}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                    >
                      {loading ? 'Joining...' : 'Join Class'}
                    </motion.button>

                    <div className="mt-2 text-xs text-gray-500">
                      Expert available for your goal categories
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertMatchingInterface;
