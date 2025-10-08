'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Star, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { partnershipService, CreatePartnerPreferencesData } from '@/services/appwrite/partnershipService';
import { PartnershipPreferences } from '@/database/partner-accountability-schema';

interface PartnerPreferencesFormProps {
  isOpen: boolean;
  onPreferencesSaved?: (preferences: PartnershipPreferences) => void;
  onClose?: () => void;
  initialData?: PartnershipPreferences | null;
}

const PartnerPreferencesForm: React.FC<PartnerPreferencesFormProps> = ({
  isOpen,
  onPreferencesSaved,
  onClose,
  initialData
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePartnerPreferencesData>({
    userId: user?.id || '',
    preferredPartnerType: 'either',
    supportStyle: [],
    availableCategories: [],
    goalCategories: [],
    timeCommitment: 'flexible',
    experienceLevel: 'beginner',
    timezone: '',
    preferredMeetingTimes: [],
    bio: ''
  });


  // Category options
  const categories = [
    { id: 'schedule', label: 'Schedule & Time Management', icon: '⏰' },
    { id: 'finance', label: 'Finance & Money Goals', icon: '💰' },
    { id: 'career', label: 'Career & Professional Growth', icon: '🚀' },
    { id: 'fitness', label: 'Fitness & Health', icon: '💪' },
    { id: 'tech', label: 'Technology & Programming', icon: '💻' },
    { id: 'business', label: 'Business & Entrepreneurship', icon: '📈' },
    { id: 'education', label: 'Education & Learning', icon: '📚' },
    { id: 'creative', label: 'Creative Arts', icon: '🎨' },
    { id: 'lifestyle', label: 'Lifestyle & Wellness', icon: '🌱' }
  ];


  // Meeting time options
  const meetingTimes = [
    { id: 'early_morning', label: 'Early Morning (6-9 AM)' },
    { id: 'morning', label: 'Morning (9-12 PM)' },
    { id: 'afternoon', label: 'Afternoon (12-5 PM)' },
    { id: 'evening', label: 'Evening (5-8 PM)' },
    { id: 'night', label: 'Night (8-11 PM)' },
    { id: 'late_night', label: 'Late Night (11 PM+)' }
  ];

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        userId: initialData.userId,
        preferredPartnerType: initialData.preferredPartnerType,
        supportStyle: initialData.supportStyle || [],
        availableCategories: initialData.availableCategories || [],
        goalCategories: initialData.goalCategories || [],
        timeCommitment: initialData.timeCommitment,
        experienceLevel: initialData.experienceLevel,
        timezone: initialData.timezone || '',
        preferredMeetingTimes: initialData.preferredMeetingTimes || [],
        bio: initialData.bio || ''
      });
    }
  }, [initialData]);


  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      availableCategories: (prev.availableCategories || []).includes(categoryId)
        ? (prev.availableCategories || []).filter(c => c !== categoryId)
        : [...(prev.availableCategories || []), categoryId]
    }));
  };

  const handleGoalCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      goalCategories: (prev.goalCategories || []).includes(categoryId)
        ? (prev.goalCategories || []).filter(c => c !== categoryId)
        : [...(prev.goalCategories || []), categoryId]
    }));
  };

  const handleMeetingTimeToggle = (timeId: string) => {
    setFormData(prev => ({
      ...prev,
      preferredMeetingTimes: prev.preferredMeetingTimes?.includes(timeId)
        ? prev.preferredMeetingTimes.filter(t => t !== timeId)
        : [...(prev.preferredMeetingTimes || []), timeId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('You must be logged in to save preferences');
      return;
    }

    // Validation
    if (formData.availableCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    if (formData.goalCategories.length === 0) {
      toast.error('Please select at least one goal category');
      return;
    }

    setLoading(true);

    try {
      let result: PartnershipPreferences | null;

      // Ensure userId is set before saving
      const dataToSave = {
        ...formData,
        userId: user.id
      };

      if (initialData) {
        // Update existing preferences
        result = await partnershipService.updatePartnerPreferences(user.id, dataToSave);
      } else {
        // Create new preferences
        result = await partnershipService.createPartnerPreferences(dataToSave);
      }

      if (result) {
        toast.success('Partner preferences saved successfully!');
        onPreferencesSaved?.(result);
        onClose?.();
      } else {
        toast.error('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('An error occurred while saving preferences');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col"
    >
      <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Update' : 'Set Up'} Partner Preferences
            </h2>
            <p className="text-sm text-gray-600">
              Help us find the perfect accountability partner for you
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-5">


        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Star className="w-4 h-4 inline mr-2" />
            Goal Categories (Select your areas of focus)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-2.5 border-2 rounded-lg cursor-pointer transition-colors ${
                  (formData.goalCategories || []).includes(category.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleGoalCategoryToggle(category.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium text-gray-900">{category.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>


        {/* Time Commitment & Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Time Commitment
            </label>
            <select
              value={formData.timeCommitment}
              onChange={(e) => setFormData(prev => ({ ...prev, timeCommitment: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily check-ins</option>
              <option value="weekly">Weekly check-ins</option>
              <option value="flexible">Flexible schedule</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Star className="w-4 h-4 inline mr-2" />
              Experience Level
            </label>
            <select
              value={formData.experienceLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>


        {/* Preferred Meeting Times */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Preferred Meeting Times (Optional)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {meetingTimes.map((time) => (
              <motion.div
                key={time.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-2.5 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.preferredMeetingTimes?.includes(time.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMeetingTimeToggle(time.id)}
              >
                <span className="text-sm font-medium text-gray-900">{time.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio (Optional)
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell potential partners a bit about yourself and your goals..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.bio?.length || 0}/500 characters</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{initialData ? 'Update' : 'Save'} Preferences</span>
              </>
            )}
          </motion.button>
        </div>
        </form>
      </div>
    </motion.div>
    </div>
  );
};

export default PartnerPreferencesForm;