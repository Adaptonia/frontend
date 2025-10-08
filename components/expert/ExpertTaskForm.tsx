'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, FileText, Clock, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { expertTaskService, CreateExpertTaskData } from '@/services/appwrite/expertTaskService';
import { useAuth } from '@/context/AuthContext';

interface ExpertTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  onSendNotification?: (taskId: string) => void;
}

const ExpertTaskForm: React.FC<ExpertTaskFormProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  onSendNotification
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    isActive: true
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    dueDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Clear previous errors
    setErrors({ title: '', description: '', dueDate: '' });

    // Enhanced validation
    let hasErrors = false;
    const newErrors = { title: '', description: '', dueDate: '' };

    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a task title';
      hasErrors = true;
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a task description';
      hasErrors = true;
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Please select a due date';
      hasErrors = true;
    } else {
      // Validate date is in the future
      const selectedDate = new Date(formData.dueDate);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.dueDate = 'Due date must be in the future';
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const taskData: CreateExpertTaskData = {
        expertId: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: new Date(formData.dueDate).toISOString(),
        isActive: formData.isActive
      };

      const task = await expertTaskService.createExpertTask(taskData);
      
      toast.success('Task created successfully!');
      onTaskCreated();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        isActive: true
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.dueDate) {
      toast.error('Please fill in all required fields first');
      return;
    }

    setSendingNotification(true);
    try {
      // Create task first
      const taskData: CreateExpertTaskData = {
        expertId: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: new Date(formData.dueDate).toISOString(),
        isActive: formData.isActive
      };

      const task = await expertTaskService.createExpertTask(taskData);
      
      // Send notification to all members
      if (onSendNotification) {
        await onSendNotification(task.id);
      }
      
      toast.success('Task created and notification sent to all members!');
      onTaskCreated();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        isActive: true
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating task and sending notification:', error);
      toast.error('Failed to create task and send notification. Please try again.');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create Expert Task</h2>
              <p className="text-sm text-gray-600">Assign tasks to your class members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter task title..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what members need to do..."
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Due Date *
              </label>
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  errors.dueDate ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Task is active (members can see and submit)
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <Clock className="w-4 h-4 inline mr-1" />
            Members will be notified when task is created
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Task'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendNotification}
              disabled={sendingNotification || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{sendingNotification ? 'Sending...' : 'Create & Notify'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExpertTaskForm;
