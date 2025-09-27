'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Calendar,
  Clock,
  Flag,
  FileText,
  Tag,
  Shield,
  Save,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import sharedGoalsService, { CreatePartnerTaskData } from '@/services/sharedGoalsService';
import { PartnerTask } from '@/database/partner-accountability-schema';

interface PartnerTaskFormProps {
  sharedGoalId: string;
  partnershipId: string;
  ownerId: string;
  partnerId: string;
  goalTitle: string;
  onTaskCreated: (task: PartnerTask) => void;
  onClose: () => void;
  isOpen: boolean;
}

const PartnerTaskForm: React.FC<PartnerTaskFormProps> = ({
  sharedGoalId,
  partnershipId,
  ownerId,
  partnerId,
  goalTitle,
  onTaskCreated,
  onClose,
  isOpen
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePartnerTaskData>({
    sharedGoalId,
    partnershipId,
    ownerId,
    partnerId,
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    estimatedTime: '',
    tags: [],
    verificationRequired: true
  });
  const [newTag, setNewTag] = useState('');

  // Priority options
  const priorities = [
    { id: 'low', label: 'Low Priority', color: 'gray', desc: 'Nice to have, no rush' },
    { id: 'medium', label: 'Medium Priority', color: 'blue', desc: 'Important, regular progress' },
    { id: 'high', label: 'High Priority', color: 'red', desc: 'Critical, needs immediate attention' }
  ];

  // Common time estimates
  const timeEstimates = [
    '15 minutes',
    '30 minutes',
    '1 hour',
    '2 hours',
    '4 hours',
    '1 day',
    '2-3 days',
    '1 week',
    'Custom'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      const result = await sharedGoalsService.createPartnerTask(formData);

      if (result) {
        toast.success('Task created successfully!');
        onTaskCreated(result);
        onClose();
        resetForm();
      } else {
        toast.error('Failed to create task. Please try again.');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('An error occurred while creating the task');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sharedGoalId,
      partnershipId,
      ownerId,
      partnerId,
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      estimatedTime: '',
      tags: [],
      verificationRequired: true
    });
    setNewTag('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
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
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Task</h2>
                <p className="text-sm text-gray-600">Add a task to "{goalTitle}"</p>
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

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Research investment options, Complete workout routine"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={255}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/255 characters</p>
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide more details about what needs to be done..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description?.length || 0}/1000 characters</p>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Flag className="w-4 h-4 inline mr-2" />
              Priority Level
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {priorities.map((priority) => (
                <motion.div
                  key={priority.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.priority === priority.id
                      ? `border-${priority.color}-500 bg-${priority.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, priority: priority.id as any }))}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">{priority.label}</h4>
                    <p className="text-xs text-gray-600 mt-1">{priority.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Due Date and Estimated Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Estimated Time
              </label>
              <select
                value={formData.estimatedTime}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select time estimate</option>
                {timeEstimates.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {formData.estimatedTime === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom time estimate"
                  className="w-full p-2 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                />
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Tags (Optional)
            </label>
            <div className="space-y-3">
              {/* Existing Tags */}
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Add New Tag */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag (e.g., urgent, research, call)"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={20}
                />
                <motion.button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Verification Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Verification Settings
            </h4>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-800">Require Partner Verification</h5>
                <p className="text-sm text-gray-600">Your partner must approve this task when you mark it complete</p>
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

            {formData.verificationRequired && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Verification Process:</p>
                    <ul className="mt-1 space-y-1">
                      <li>1. You complete the task and mark it as done</li>
                      <li>2. Your partner gets notified to review the task</li>
                      <li>3. Your partner can approve, reject, or request changes</li>
                      <li>4. Task is marked as verified when approved</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
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
              disabled={loading || !formData.title.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Task</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PartnerTaskForm;