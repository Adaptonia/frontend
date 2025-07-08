'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Tag as TagIcon, Bell as BellIcon, Settings, Flag, Loader2, Users, Eye, EyeOff, X, Save, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { GoalPackModalProps, CreateGoalPackRequest, Milestone, ModalTab, GoalPack, UserType } from '@/lib/types';
import MilestoneComponent from '../goals/MilestoneComponent';
import { createGoalPack, updateGoalPack } from '@/services/appwrite/goalPackService';
import { useAuth } from '@/context/AuthContext';

// Action button component
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  selected?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, selected }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-1 py-1 rounded-md border-2 text-xs w-full ${
        selected ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// Header component
const ModalHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="flex items-center justify-between mb-4 px-5 pt-5">
    <h2 className="text-xl font-semibold">{title}</h2>
    <button onClick={onBack} className="text-blue-500 font-medium">
      Done
    </button>
  </div>
);

const GoalPackModal: React.FC<GoalPackModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create'
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ModalTab>('main');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'schedule',
    targetUserType: 'all' as UserType | 'all',
    tags: '',
    milestones: '[]',
    isActive: true,
    link: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      // Edit mode - populate form with existing data
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'schedule',
        targetUserType: initialData.targetUserType || 'all',
        tags: initialData.tags || '',
        milestones: initialData.milestones || '[]',
        isActive: initialData.isActive ?? true,
                  link: initialData.link || ''
      });
      
      // Set milestones if available
      if (initialData.milestones) {
        try {
          const parsedMilestones = JSON.parse(initialData.milestones as string);
          setFormData(prev => ({ ...prev, milestones: JSON.stringify(parsedMilestones) }));
        } catch (e) {
          console.error("Failed to parse milestones", e);
          setFormData(prev => ({ ...prev, milestones: '[]' }));
        }
      } else {
        setFormData(prev => ({ ...prev, milestones: '[]' }));
      }
    } else if (isOpen && !initialData) {
      // Create mode - reset form
      setFormData({
        title: '',
        description: '',
        category: 'schedule',
        targetUserType: 'all',
        tags: '',
        milestones: '[]',
        isActive: true,
        link: ''
      });
    }
    
    setActiveTab('main');
  }, [isOpen, initialData]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.link && !isValidUrl(formData.link)) {
      newErrors.link = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user?.id) return;

    setIsSubmitting(true);

    try {
      const goalPackData = {
        ...formData,
        category: formData.category as 'schedule' | 'finance' | 'career' | 'audio_books',
        targetUserType: formData.targetUserType as 'all' | 'student' | 'non-student',
        milestones: formData.milestones || '[]'
      };

      let savedGoalPack;
      
      if (mode === 'edit' && initialData?.id) {
        savedGoalPack = await updateGoalPack(initialData.id, goalPackData);
        toast.success('Goal pack updated successfully! 🎉');
      } else {
        savedGoalPack = await createGoalPack(goalPackData, user.id);
        toast.success('Goal pack created successfully! 🎉');
      }

      onSave?.(savedGoalPack);
      onClose();
    } catch (error) {
      console.error('Error saving goal pack:', error);
      toast.error(`Failed to ${mode} goal pack. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Main tab content
  const renderMainTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-5">
        {/* Drag handle */}
        <div className="flex items-center justify-center mb-5">
          <div 
            className="w-16 h-1 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition-colors" 
            onClick={onClose}
          ></div>
        </div>
        
        {/* Action buttons */}
        <div className="flex overflow-x-auto gap-3 mb-6 pb-2 w-full">
          <ActionButton 
            icon={<Users size={16} />} 
            label={formData.targetUserType === 'all' ? 'All Users' : formData.targetUserType === 'student' ? 'Students' : 'Non-Students'} 
            onClick={() => setActiveTab('target')}
            selected={true}
          />
          
          <ActionButton 
            icon={<TagIcon size={16} />} 
            label={formData.tags || 'Tag'} 
            onClick={() => setActiveTab('tag')}
            selected={!!formData.tags}
          />
          
          <ActionButton 
            icon={formData.isActive ? <Eye size={16} /> : <EyeOff size={16} />} 
            label={formData.isActive ? 'Active' : 'Inactive'} 
            onClick={() => handleInputChange('isActive', !formData.isActive)}
            selected={formData.isActive}
          />
        </div>
        
        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="schedule">Schedule</option>
            <option value="finance">Finance</option>
            <option value="career">Career</option>
            <option value="audio_books">Audio Books</option>
          </select>
        </div>
        
        {/* Input fields */}
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g. Student Financial Planning Pack"
          className={`w-full mb-2 text-xl font-medium border-none outline-none ${errors.title ? 'text-red-500' : ''}`}
        />
        {errors.title && <p className="text-red-500 text-sm mb-4">{errors.title}</p>}
        
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Description of this goal pack..."
          className="w-full min-h-[150px] mb-6 text-gray-500 border-none outline-none resize-none"
        />
        {errors.description && <p className="text-red-500 text-sm mb-4">{errors.description}</p>}
        
        {/* Meeting/Resource Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LinkIcon className="inline w-4 h-4 mr-1" />
            Meeting/Resource Link
          </label>
          <input
            type="url"
            value={formData.link}
            onChange={(e) => handleInputChange('link', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.link ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://meet.google.com/abc-xyz or any resource link"
          />
          {errors.link && (
            <p className="text-red-500 text-sm mt-1">{errors.link}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Optional: Add a Google Meet link, Zoom link, or any resource URL related to this goal pack.
          </p>
        </div>
        
        {/* Milestone Component - Show after description is written */}
        {formData.description.trim() && (
          <MilestoneComponent
            milestones={JSON.parse(formData.milestones)}
            onMilestonesChange={(newMilestones) => handleInputChange('milestones', JSON.stringify(newMilestones))}
          />
        )}
      </div>
      
      {/* Save button - fixed at bottom */}
      <div className="mt-auto p-5 border-t">
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full py-4 text-white bg-blue-500 rounded-full font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {mode === 'edit' ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            mode === 'edit' ? 'Update Goal Pack' : 'Create Goal Pack'
          )}
        </button>
      </div>
    </div>
  );

  // Target user type selection tab
  const renderTargetTab = () => (
    <div className="h-full flex flex-col">
      <ModalHeader title="Target Users" onBack={() => setActiveTab('main')} />
      
      <div className="px-5 pb-5 flex-1">
        <div className="space-y-3">
          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, targetUserType: 'all' }));
              setActiveTab('main');
            }}
            className={`flex items-center justify-between w-full p-4 rounded-lg border-2 ${
              formData.targetUserType === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-blue-500" />
              <div className="text-left">
                <p className="font-medium">All Users</p>
                <p className="text-sm text-gray-500">Available to both students and non-students</p>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, targetUserType: 'student' }));
              setActiveTab('main');
            }}
            className={`flex items-center justify-between w-full p-4 rounded-lg border-2 ${
              formData.targetUserType === 'student' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-green-500" />
              <div className="text-left">
                <p className="font-medium">Students Only</p>
                <p className="text-sm text-gray-500">Only available to users marked as students</p>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, targetUserType: 'non-student' }));
              setActiveTab('main');
            }}
            className={`flex items-center justify-between w-full p-4 rounded-lg border-2 ${
              formData.targetUserType === 'non-student' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-purple-500" />
              <div className="text-left">
                <p className="font-medium">Working Professionals</p>
                <p className="text-sm text-gray-500">Only available to working professionals</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // Tag selection screen  
  const renderTagTab = () => (
    <div className="h-full flex flex-col">
      <ModalHeader title="Tag" onBack={() => setActiveTab('main')} />
      
      <div className="px-5 pb-5 flex-1">
        <button 
          onClick={() => {
            setFormData(prev => ({ ...prev, tags: 'Popular' }));
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg mb-3 ${formData.tags === 'Popular' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-green-500" size={20} />
          </div>
          <span className="text-green-500 font-medium">Popular</span>
        </button>
        
        <button 
          onClick={() => {
            setFormData(prev => ({ ...prev, tags: 'New' }));
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg mb-3 ${formData.tags === 'New' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-blue-500" size={20} />
          </div>
          <span className="text-blue-500 font-medium">New</span>
        </button>
        
        <button 
          onClick={() => {
            setFormData(prev => ({ ...prev, tags: 'Recommended' }));
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg ${formData.tags === 'Recommended' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-purple-500" size={20} />
          </div>
          <span className="text-purple-500 font-medium">Recommended</span>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'target':
        return renderTargetTab();
      case 'tag':
        return renderTagTab();
      default:
        return renderMainTab();
    }
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { y: "100%" },
    visible: { y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/35 bg-opacity-50 z-40"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
        onClick={onClose}
      />
      <motion.div 
        ref={modalRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl h-[90vh] overflow-y-auto flex flex-col"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'edit' ? 'Edit Goal Pack' : 'Create New Goal Pack'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {renderContent()}
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoalPackModal; 
