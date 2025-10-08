'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Save,
  XCircle,
  Plus,
  Trash2,
  Star,
  Award,
  Clock,
  DollarSign,
  Globe,
  Users,
  Target,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { expertService, CreateExpertProfileData } from '@/services/appwrite/expertService';
import { ExpertProfile } from '@/database/partner-accountability-schema';

interface ExpertProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated?: (profile: ExpertProfile) => void;
  existingProfile?: ExpertProfile | null;
}

const ExpertProfileForm: React.FC<ExpertProfileFormProps> = ({
  isOpen,
  onClose,
  onProfileCreated,
  existingProfile
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateExpertProfileData>({
    userId: user?.id || '',
    expertiseAreas: [],
    yearsOfExperience: 0,
    certifications: [],
    specializations: [],
    hourlyRate: undefined,
    availability: {
      timeSlots: [],
      timezone: '',
      maxClients: 5
    },
    bio: '',
    achievements: [],
    isAvailableForMatching: true,
    successStories: []
  });

  // Local state for years of experience input to allow clearing
  const [yearsInput, setYearsInput] = useState<string>('0');
  
  // Local state for max clients input to allow clearing
  const [maxClientsInput, setMaxClientsInput] = useState<string>('5');

  // Initialize form data when existing profile is loaded
  useEffect(() => {
    if (existingProfile) {
      console.log('Loading existing profile data:', existingProfile);
      
      setFormData({
        userId: existingProfile.userId,
        expertiseAreas: existingProfile.expertiseAreas || [],
        yearsOfExperience: existingProfile.yearsOfExperience || 0,
        certifications: existingProfile.certifications || [],
        specializations: existingProfile.specializations || [],
        hourlyRate: existingProfile.hourlyRate,
        availability: existingProfile.availability || {
          timeSlots: [],
          timezone: '',
          maxClients: 5
        },
        bio: existingProfile.bio || '',
        achievements: existingProfile.achievements || [],
        isAvailableForMatching: existingProfile.isAvailableForMatching !== undefined ? existingProfile.isAvailableForMatching : true,
        successStories: existingProfile.successStories || [],
      });
      
      setYearsInput((existingProfile.yearsOfExperience || 0).toString());
      setMaxClientsInput((existingProfile.availability?.maxClients || 5).toString());
    }
  }, [existingProfile]);

  // Expertise areas options
  const expertiseOptions = [
    { id: 'finance', label: 'Finance & Investment', icon: '💰' },
    { id: 'career', label: 'Career Development', icon: '🚀' },
    { id: 'fitness', label: 'Fitness & Health', icon: '💪' },
    { id: 'tech', label: 'Technology & Programming', icon: '💻' },
    { id: 'business', label: 'Business & Entrepreneurship', icon: '📈' },
    { id: 'education', label: 'Education & Learning', icon: '📚' },
    { id: 'creative', label: 'Creative Arts', icon: '🎨' },
    { id: 'lifestyle', label: 'Lifestyle & Wellness', icon: '🌱' }
  ];

  // Time slots options
  const timeSlotOptions = [
    'Early Morning (6-9 AM)',
    'Morning (9-12 PM)',
    'Afternoon (12-5 PM)',
    'Evening (5-8 PM)',
    'Night (8-11 PM)',
    'Late Night (11 PM+)'
  ];

  // Timezone options
  const timezoneOptions = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

  const handleExpertiseToggle = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.includes(areaId)
        ? prev.expertiseAreas.filter(a => a !== areaId)
        : [...prev.expertiseAreas, areaId]
    }));
  };

  const handleTimeSlotToggle = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: prev.availability.timeSlots.includes(slot)
          ? prev.availability.timeSlots.filter(s => s !== slot)
          : [...prev.availability.timeSlots, slot]
      }
    }));
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const updateCertification = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => i === index ? value : cert)
    }));
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const addAchievement = () => {
    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, '']
    }));
  };

  const updateAchievement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.map((achievement, i) => i === index ? value : achievement)
    }));
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const addSuccessStory = () => {
    setFormData(prev => ({
      ...prev,
      successStories: [...prev.successStories, '']
    }));
  };

  const updateSuccessStory = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      successStories: prev.successStories.map((story, i) => i === index ? value : story)
    }));
  };

  const removeSuccessStory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      successStories: prev.successStories.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('You must be logged in to create an expert profile');
      return;
    }

    // Validation
    if (formData.expertiseAreas.length === 0) {
      toast.error('Please select at least one expertise area');
      return;
    }

    if (formData.bio.trim().length < 50) {
      toast.error('Please provide a detailed bio (at least 50 characters)');
      return;
    }

    if (formData.availability.timeSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    if (!formData.availability.timezone) {
      toast.error('Please select your timezone');
      return;
    }

    setLoading(true);

    try {
      let result: ExpertProfile;

      if (existingProfile) {
        // Update existing profile
        result = await expertService.updateExpertProfile(user.id, formData);
      } else {
        // Create new profile
        result = await expertService.createExpertProfile(formData);
      }

      if (result) {
        toast.success(existingProfile ? 'Expert profile updated successfully!' : 'Expert profile created successfully!');
        onProfileCreated?.(result);
        onClose();
      } else {
        toast.error('Failed to save expert profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving expert profile:', error);
      toast.error('An error occurred while saving your expert profile');
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
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {existingProfile ? 'Update' : 'Create'} Expert Profile
              </h2>
              <p className="text-sm text-gray-600">
                Set up your expert profile to help others achieve their goals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Expertise Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Target className="w-4 h-4 inline mr-2" />
                Expertise Areas (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {expertiseOptions.map((area) => (
                  <motion.div
                    key={area.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.expertiseAreas.includes(area.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleExpertiseToggle(area.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{area.icon}</span>
                      <span className="font-medium text-gray-900">{area.label}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Experience & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsInput}
                  onChange={(e) => {
                    setYearsInput(e.target.value);
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      setFormData(prev => ({ ...prev, yearsOfExperience: value }));
                    }
                  }}
                  onBlur={() => {
                    // Ensure we have a valid number on blur
                    const value = parseInt(yearsInput);
                    if (isNaN(value) || value < 0) {
                      setYearsInput('0');
                      setFormData(prev => ({ ...prev, yearsOfExperience: 0 }));
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate (Optional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || undefined }))}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4 inline mr-2" />
                Certifications
              </label>
              <div className="space-y-2">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => updateCertification(index, e.target.value)}
                      placeholder="Enter certification name"
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCertification}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Certification</span>
                </button>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about your expertise, experience, and how you help people achieve their goals..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={4}
                required
                minLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/50 characters minimum</p>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Clock className="w-4 h-4 inline mr-2" />
                Availability
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.availability.timezone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      availability: { ...prev.availability, timezone: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Select your timezone</option>
                    {timezoneOptions.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Clients
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxClientsInput}
                    onChange={(e) => {
                      setMaxClientsInput(e.target.value);
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1) {
                        setFormData(prev => ({
                          ...prev,
                          availability: { ...prev.availability, maxClients: value }
                        }));
                      }
                    }}
                    onBlur={() => {
                      // Ensure we have a valid number on blur
                      const value = parseInt(maxClientsInput);
                      if (isNaN(value) || value < 1) {
                        setMaxClientsInput('1');
                        setFormData(prev => ({
                          ...prev,
                          availability: { ...prev.availability, maxClients: 1 }
                        }));
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time Slots
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {timeSlotOptions.map((slot) => (
                    <motion.div
                      key={slot}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-2 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.availability.timeSlots.includes(slot)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTimeSlotToggle(slot)}
                    >
                      <span className="text-sm font-medium text-gray-900">{slot}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Star className="w-4 h-4 inline mr-2" />
                Key Achievements
              </label>
              <div className="space-y-2">
                {formData.achievements.map((achievement, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={achievement}
                      onChange={(e) => updateAchievement(index, e.target.value)}
                      placeholder="Enter achievement"
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeAchievement(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAchievement}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Achievement</span>
                </button>
              </div>
            </div>

            {/* Success Stories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Success Stories
              </label>
              <div className="space-y-2">
                {formData.successStories.map((story, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={story}
                      onChange={(e) => updateSuccessStory(index, e.target.value)}
                      placeholder="Describe a success story..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={() => removeSuccessStory(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSuccessStory}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Success Story</span>
                </button>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Available for Matching</h4>
                <p className="text-sm text-gray-600">Allow users to be matched with you</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isAvailableForMatching: !prev.isAvailableForMatching }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isAvailableForMatching ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    formData.isAvailableForMatching ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{existingProfile ? 'Update' : 'Create'} Profile</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExpertProfileForm;

