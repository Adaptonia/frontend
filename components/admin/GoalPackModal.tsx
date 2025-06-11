'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Tag as TagIcon, Bell as BellIcon, Settings, Flag, Loader2, Users, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { GoalPackModalProps, CreateGoalPackRequest, Milestone, ModalTab } from '@/lib/types';
import MilestoneComponent from '../goals/MilestoneComponent';
import { createGoalPack, updateGoalPack } from '@/src/services/appwrite/goalPackService';
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'finance' | 'schedule' | 'career' | 'audio_books'>('finance');
  const [targetUserType, setTargetUserType] = useState<'student' | 'non-student' | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      // Edit mode - populate form with existing data
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category);
      setTargetUserType(initialData.targetUserType);
      setSelectedTag(initialData.tags || '');
      setIsActive(initialData.isActive);
      
      // Set milestones if available
      if (initialData.milestones) {
        try {
          const parsedMilestones = JSON.parse(initialData.milestones as string);
          setMilestones(parsedMilestones);
        } catch (e) {
          console.error("Failed to parse milestones", e);
          setMilestones([]);
        }
      } else {
        setMilestones([]);
      }
    } else if (isOpen && !initialData) {
      // Create mode - reset form
      setTitle('');
      setDescription('');
      setCategory('finance');
      setTargetUserType('all');
      setSelectedTag('');
      setMilestones([]);
      setIsActive(true);
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

  const handleSave = async () => {
    setValidationError('');
    
    if (!title.trim()) {
      setValidationError("Please enter a goal pack title");
      return;
    }

    if (!user?.id) {
      setValidationError("User not authenticated");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const goalPackData: CreateGoalPackRequest = {
        title,
        description: description || undefined,
        category,
        targetUserType,
        tags: selectedTag || undefined,
        milestones: milestones.length > 0 ? JSON.stringify(milestones) : undefined,
        isActive
      };
      
      let result;
      
      if (mode === 'edit' && initialData?.id) {
        result = await updateGoalPack(initialData.id, goalPackData);
        toast.success('Goal pack updated successfully');
      } else {
        result = await createGoalPack(goalPackData, user.id);
        toast.success('Goal pack created successfully');
      }
      
      onClose();
      if (onSave && result) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error saving goal pack:', error);
      toast.error(`Failed to save goal pack: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
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
            label={targetUserType === 'all' ? 'All Users' : targetUserType === 'student' ? 'Students' : 'Non-Students'} 
            onClick={() => setActiveTab('target')}
            selected={true}
          />
          
          <ActionButton 
            icon={<TagIcon size={16} />} 
            label={selectedTag || 'Tag'} 
            onClick={() => setActiveTab('tag')}
            selected={!!selectedTag}
          />
          
          <ActionButton 
            icon={isActive ? <Eye size={16} /> : <EyeOff size={16} />} 
            label={isActive ? 'Active' : 'Inactive'} 
            onClick={() => setIsActive(!isActive)}
            selected={isActive}
          />
        </div>
        
        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as 'finance' | 'schedule' | 'career' | 'audio_books')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="finance">Finance</option>
            <option value="schedule">Schedule</option>
            <option value="career">Career</option>
            <option value="audio_books">Audio Books</option>
          </select>
        </div>
        
        {/* Input fields */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Student Financial Planning Pack"
          className={`w-full mb-2 text-xl font-medium border-none outline-none ${validationError ? 'text-red-500' : ''}`}
        />
        {validationError && <p className="text-red-500 text-sm mb-4">{validationError}</p>}
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description of this goal pack..."
          className="w-full min-h-[150px] mb-6 text-gray-500 border-none outline-none resize-none"
        />
        
        {/* Milestone Component - Show after description is written */}
        {description.trim() && (
          <MilestoneComponent
            milestones={milestones}
            onMilestonesChange={setMilestones}
          />
        )}
      </div>
      
      {/* Save button - fixed at bottom */}
      <div className="mt-auto p-5 border-t">
        <button 
          onClick={handleSave} 
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
              setTargetUserType('all');
              setActiveTab('main');
            }}
            className={`flex items-center justify-between w-full p-4 rounded-lg border-2 ${
              targetUserType === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
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
              setTargetUserType('student');
              setActiveTab('main');
            }}
            className={`flex items-center justify-between w-full p-4 rounded-lg border-2 ${
              targetUserType === 'student' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
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
              setTargetUserType('non-student');
              setActiveTab('main');
            }}
            className={`flex items-center justify-between w-full p-4 rounded-lg border-2 ${
              targetUserType === 'non-student' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-purple-500" />
              <div className="text-left">
                <p className="font-medium">Non-Students Only</p>
                <p className="text-sm text-gray-500">Only available to non-student users</p>
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
            setSelectedTag('Popular');
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg mb-3 ${selectedTag === 'Popular' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-green-500" size={20} />
          </div>
          <span className="text-green-500 font-medium">Popular</span>
        </button>
        
        <button 
          onClick={() => {
            setSelectedTag('New');
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg mb-3 ${selectedTag === 'New' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-blue-500" size={20} />
          </div>
          <span className="text-blue-500 font-medium">New</span>
        </button>
        
        <button 
          onClick={() => {
            setSelectedTag('Recommended');
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg ${selectedTag === 'Recommended' ? 'bg-gray-50' : ''}`}
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
            {renderContent()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GoalPackModal; 