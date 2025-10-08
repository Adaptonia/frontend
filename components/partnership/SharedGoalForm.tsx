'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Calendar,
  Users,
  CheckCircle,
  FileText,
  Settings,
  Save,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import sharedGoalsService, { CreateSharedGoalData } from '@/services/sharedGoalsService';
import { SharedGoal } from '@/database/partner-accountability-schema';

interface SharedGoalFormProps {
  partnershipId: string;
  ownerId: string;
  partnerId: string;
  partnerName?: string;
  onGoalCreated: (goal: SharedGoal) => void;
  onClose: () => void;
  isOpen: boolean;
}

const SharedGoalForm: React.FC<SharedGoalFormProps> = ({
  partnershipId,
  ownerId,
  partnerId,
  partnerName,
  onGoalCreated,
  onClose,
  isOpen
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSharedGoalData>({
    partnershipId,
    ownerId,
    partnerId,
    title: '',
    description: '',
    category: 'schedule',
    deadline: '',
    supportStyle: 'collaborative',
    verificationRequired: true,
    reminderEnabled: true
  });

  // Category options
  const categories = [
    { id: 'schedule', label: 'Schedule & Time Management', icon: '⏰', color: 'purple' },
    { id: 'finance', label: 'Finance & Money Goals', icon: '💰', color: 'green' },
    { id: 'career', label: 'Career & Professional Growth', icon: '🚀', color: 'blue' },
    { id: 'audio_books', label: 'Learning & Audio Books', icon: '📚', color: 'yellow' }
  ];

  // Support style options
  const supportStyles = [
    { id: 'encouraging', label: 'Encouraging & Motivational', desc: 'Focus on positive reinforcement' },
    { id: 'structured', label: 'Structured & Organized', desc: 'Clear milestones and deadlines' },
    { id: 'flexible', label: 'Flexible & Adaptive', desc: 'Adjust as needed along the way' },
    { id: 'accountability', label: 'Strict Accountability', desc: 'Regular check-ins and firm deadlines' },
    { id: 'collaborative', label: 'Collaborative & Teamwork', desc: 'Work together on shared tasks' },
    { id: 'independent', label: 'Independent Check-ins', desc: 'Update each other periodically' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    if (!formData.description?.trim()) {
      toast.error('Please enter a goal description');
      return;
    }

    setLoading(true);
    try {
      const result = await sharedGoalsService.createSharedGoal(formData);

      if (result) {
        toast.success('Shared goal created successfully!');
        onGoalCreated(result);
        onClose();
        resetForm();
      } else {
        toast.error('Failed to create shared goal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating shared goal:', error);
      toast.error('An error occurred while creating the goal');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      partnershipId,
      ownerId,
      partnerId,
      title: '',
      description: '',
      category: 'schedule',
      deadline: '',
      supportStyle: 'collaborative',
      verificationRequired: true,
      reminderEnabled: true
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Shared Goal</h2>
                <p className="text-sm text-gray-600">Set a goal that you and {partnerName || 'your partner'} will work on together</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Goal Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Goal Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Save $5,000 for emergency fund, Exercise 4 times per week"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={255}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/255 characters</p>
          </div>

          {/* Goal Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your goal in detail. What exactly do you want to achieve? How will you know when you've succeeded?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              maxLength={1000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description?.length || 0}/1000 characters</p>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Settings className="w-4 h-4 inline mr-2" />
              Category
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.category === category.id
                      ? `border-${category.color}-500 bg-${category.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, category: category.id as any }))}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium text-gray-900">{category.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Deadline and Support Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Deadline (Optional)
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Support Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Support Style
              </label>
              <select
                value={formData.supportStyle}
                onChange={(e) => setFormData(prev => ({ ...prev, supportStyle: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {supportStyles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {supportStyles.find(s => s.id === formData.supportStyle)?.desc}
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Accountability Settings
            </h4>
            <div className="space-y-3">

              {/* Verification Required */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-800">Partner Verification Required</h5>
                  <p className="text-sm text-gray-600">{partnerName || 'Your partner'} must verify task completion</p>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData(prev => ({ ...prev, verificationRequired: !prev.verificationRequired }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.verificationRequired ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <motion.span
                    animate={{
                      x: formData.verificationRequired ? 20 : 2
                    }}
                    className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                  />
                </motion.button>
              </div>

              {/* Reminders */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-800">Email Reminders</h5>
                  <p className="text-sm text-gray-600">Get reminder emails for this goal</p>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData(prev => ({ ...prev, reminderEnabled: !prev.reminderEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.reminderEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <motion.span
                    animate={{
                      x: formData.reminderEnabled ? 20 : 2
                    }}
                    className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                  />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Shared Goal Benefits</h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Both you and {partnerName || 'your partner'} can view and track this goal</li>
                  <li>• You can create tasks that {partnerName || 'your partner'} can verify</li>
                  <li>• Progress is shared and visible to both partners</li>
                  <li>• Get accountability and motivation from {partnerName || 'your partner'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.description?.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Shared Goal</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SharedGoalForm;