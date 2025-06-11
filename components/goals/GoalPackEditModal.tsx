'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Tag as TagIcon, Bell as BellIcon, Settings, Flag, Loader2, Edit3, Save, X } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { GoalPack, Milestone, ModalTab } from '@/lib/types';
import MilestoneComponent from './MilestoneComponent';
import { createGoal } from '@/src/services/appwrite/database';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface GoalPackEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (savedGoal: any) => void;
  goalPack: GoalPack | null;
}

// Helper function to format dates nicely
const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

// Action button component
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  selected?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, selected }) => {
  const displayLabel = label && label.includes('T00:00:00') 
    ? formatDisplayDate(label)
    : label;
    
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-1 py-1 rounded-md border-2 text-xs w-full ${
        selected ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-700'
      }`}
    >
      {icon}
      <span>{displayLabel}</span>
    </button>
  );
};

// Header component with title and save button
const ModalHeader: React.FC<{ title: string; onSave: () => void; isSaving: boolean }> = ({ 
  title, 
  onSave, 
  isSaving 
}) => (
  <div className="flex items-center justify-between mb-4 px-5 pt-5">
    <h2 className="text-xl font-semibold">{title}</h2>
    <button 
      onClick={onSave} 
      disabled={isSaving}
      className="flex items-center gap-2 text-white bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          Save Goal
        </>
      )}
    </button>
  </div>
);

const GoalPackEditModal: React.FC<GoalPackEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  goalPack
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ModalTab>('main');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [reminder, setReminder] = useState('');
  const [location, setLocation] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize form with goal pack data when modal opens
  useEffect(() => {
    if (isOpen && goalPack) {
      setTitle(goalPack.title || '');
      setDescription(goalPack.description || '');
      setSelectedTag(goalPack.tags || '');
      
      // Parse and set milestones
      if (goalPack.milestones) {
        try {
          const parsedMilestones = JSON.parse(goalPack.milestones);
          setMilestones(parsedMilestones);
        } catch (e) {
          console.error("Failed to parse milestones", e);
          setMilestones([]);
        }
      } else {
        setMilestones([]);
      }
      
      // Reset other fields
      setSelectedDate('');
      setReminder('');
      setLocation('');
      setValidationError('');
    }
    
    setActiveTab('main');
  }, [isOpen, goalPack]);

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
      setValidationError("Please enter a goal title");
      return;
    }

    if (!user?.id || !goalPack) {
      setValidationError("User not authenticated or no goal pack selected");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create goal from the edited goal pack
      const goalData = {
        title,
        description: description || undefined,
        category: goalPack.category,
        deadline: selectedDate || undefined,
        tags: selectedTag || undefined,
        reminderDate: reminder || undefined,
        location: location || undefined,
        milestones: milestones.length > 0 ? JSON.stringify(milestones) : undefined,
        isCompleted: false
      };
      
      const result = await createGoal(goalData, user.id);
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Goal Created! 🎉</span>
          <span className="text-sm text-gray-600">
            "{title}" has been added to your goals
          </span>
        </div>
      );
      
      onClose();
      if (onSave && result) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error creating goal from pack:', error);
      toast.error(`Failed to create goal: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Main tab content with editable fields
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
        
        {/* Goal Pack Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Customizing Goal Pack</span>
          </div>
          <p className="text-sm text-blue-600">
            Edit this template to fit your needs. Your changes won't affect the original template.
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex overflow-x-auto gap-3 mb-6 pb-2 w-full">
          <ActionButton 
            icon={<Calendar size={16} />} 
            label={selectedDate ? formatDisplayDate(selectedDate) : 'Deadline'} 
            onClick={() => setActiveTab('date')}
            selected={!!selectedDate}
          />
          
          <ActionButton 
            icon={<TagIcon size={16} />} 
            label={selectedTag || 'Tag'} 
            onClick={() => setActiveTab('tag')}
            selected={!!selectedTag}
          />
          
          <ActionButton 
            icon={<BellIcon size={16} />} 
            label={reminder || 'Reminders'} 
            onClick={() => setActiveTab('reminder')}
            selected={!!reminder}
          />
        </div>
        
        {/* Editable input fields */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Edit goal title..."
          className={`w-full mb-2 text-xl font-medium border-none outline-none ${validationError ? 'text-red-500' : ''}`}
        />
        {validationError && <p className="text-red-500 text-sm mb-4">{validationError}</p>}
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Edit description or add your personal notes..."
          className="w-full min-h-[150px] mb-6 text-gray-500 border-none outline-none resize-none"
        />
        
        {/* Editable Milestone Component */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">Milestones</h3>
            <span className="text-sm text-gray-500">Click to edit ({milestones.length} items)</span>
          </div>
          <MilestoneComponent
            milestones={milestones}
            onMilestonesChange={setMilestones}
          />
        </div>
      </div>
      
      {/* Save button - fixed at bottom */}
      <div className="mt-auto p-5 border-t">
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 text-gray-600 bg-gray-100 rounded-full font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="flex-1 py-4 text-white bg-blue-500 rounded-full font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Create My Goal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Date selection screen (same as original GoalFormModal)
  const renderDateTab = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekend = new Date(today);
    const daysUntilWeekend = 6 - today.getDay();
    weekend.setDate(today.getDate() + daysUntilWeekend);
    
    const formatButtonDate = (date: Date) => {
      return format(date, 'EEE, MMM d');
    };
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 px-5 pt-5">
          <h2 className="text-xl font-semibold">Deadline</h2>
          <button onClick={() => setActiveTab('main')} className="text-blue-500 font-medium">
            Done
          </button>
        </div>
        
        <div className="px-5 pb-5 flex-1">
          <div className="space-y-3 mb-6">
            <button 
              onClick={() => {
                const todayStr = format(today, 'yyyy-MM-dd');
                setSelectedDate(todayStr);
                setActiveTab('main');
              }}
              className={`flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded-lg ${selectedDate === format(today, 'yyyy-MM-dd') ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-md bg-yellow-100 flex items-center justify-center">
                  <Calendar size={20} className="text-yellow-500" />
                </div>
                <span className="font-medium">Today</span>
              </div>
              <span className="text-gray-400">{formatButtonDate(today)}</span>
            </button>
            
            <button 
              onClick={() => {
                const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
                setSelectedDate(tomorrowStr);
                setActiveTab('main');
              }}
              className={`flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded-lg ${selectedDate === format(tomorrow, 'yyyy-MM-dd') ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-md bg-orange-100 flex items-center justify-center">
                  <Calendar size={20} className="text-orange-500" />
                </div>
                <span className="font-medium">Tomorrow</span>
              </div>
              <span className="text-gray-400">{formatButtonDate(tomorrow)}</span>
            </button>
            
            <button 
              onClick={() => {
                const weekendStr = format(weekend, 'yyyy-MM-dd');
                setSelectedDate(weekendStr);
                setActiveTab('main');
              }}
              className={`flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded-lg ${selectedDate === format(weekend, 'yyyy-MM-dd') ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-md bg-green-100 flex items-center justify-center">
                  <Calendar size={20} className="text-green-500" />
                </div>
                <span className="font-medium">This Weekend</span>
              </div>
              <span className="text-gray-400">{formatButtonDate(weekend)}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Tag selection screen
  const renderTagTab = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-5 pt-5">
        <h2 className="text-xl font-semibold">Tag</h2>
        <button onClick={() => setActiveTab('main')} className="text-blue-500 font-medium">
          Done
        </button>
      </div>
      
      <div className="px-5 pb-5 flex-1">
        <button 
          onClick={() => {
            setSelectedTag('High Priority');
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg mb-3 ${selectedTag === 'High Priority' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-red-500" size={20} />
          </div>
          <span className="text-red-500 font-medium">High Priority</span>
        </button>
        
        <button 
          onClick={() => {
            setSelectedTag('Personal Goal');
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg mb-3 ${selectedTag === 'Personal Goal' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-blue-500" size={20} />
          </div>
          <span className="text-blue-500 font-medium">Personal Goal</span>
        </button>
        
        <button 
          onClick={() => {
            setSelectedTag('From Template');
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg ${selectedTag === 'From Template' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-green-500" size={20} />
          </div>
          <span className="text-green-500 font-medium">From Template</span>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'date':
        return renderDateTab();
      case 'tag':
        return renderTagTab();
      default:
        return renderMainTab();
    }
  };

  if (!goalPack) return null;

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

export default GoalPackEditModal; 