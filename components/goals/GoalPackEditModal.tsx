'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Tag as TagIcon, Bell as BellIcon, Settings, Flag, Loader2, Edit3, Save, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { GoalPack, Milestone, ModalTab } from '@/lib/types';
import MilestoneComponent from './MilestoneComponent';
import { createGoal } from '@/services/appwrite/database';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
// Removed Select imports - using buttons instead

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

// Header component with title and done button
const ModalHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="flex items-center justify-between mb-4 px-5 pt-5">
    <h2 className="text-xl font-semibold">{title}</h2>
    <button onClick={onBack} className="text-blue-500 font-medium">
      Done
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
  const [reminderSettings, setReminderSettings] = useState<{
    enabled: boolean;
    time: string;
    date: string;
    duration?: number; // Added for daily reminders
  }>({
    enabled: false,
    time: "09:00", // This will be locked at 9 AM
    date: format(new Date(), 'yyyy-MM-dd'),
    duration: 30 // Default to 30 days
  });
  
  // Drag to close functionality
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (goalPack) {
      setTitle(goalPack.title || '');
      setDescription(goalPack.description || '');
      setSelectedTag(goalPack.tags || '');
      
        try {
          const parsedMilestones = goalPack.milestones ? JSON.parse(goalPack.milestones) : [];
          setMilestones(parsedMilestones);
        } catch (e) {
          console.error("Failed to parse milestones", e);
          setMilestones([]);
        }
      } else {
        // Reset fields if no goal pack is provided (though this case is unlikely)
        setTitle('');
        setDescription('');
        setSelectedTag('');
        setMilestones([]);
      }
      
      // Reset fields that are not part of the goal pack template
      setSelectedDate('');
      setReminder('');
      setLocation('');
      setValidationError('');

      // Reset the view to the main tab whenever the modal is freshly opened.
      setActiveTab('main');
    }
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

  // Drag to close handlers
  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setDragY(0);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = clientY - startY;
    // Only allow downward dragging
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Close modal if dragged down more than 100px
    if (dragY > 100) {
      onClose();
    } else {
      // Snap back to original position
      setDragY(0);
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only start drag if touching the top 20px of the modal
    const touchY = e.touches[0].clientY;
    const modalTop = e.currentTarget.getBoundingClientRect().top;
    if (touchY - modalTop <= 20) {
      handleDragStart(touchY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleDragMove(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Mouse event handlers (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag if clicking the top 20px of the modal
    const modalTop = e.currentTarget.getBoundingClientRect().top;
    if (e.clientY - modalTop <= 20) {
      handleDragStart(e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Add global mouse move and up listeners when dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startY, dragY]);

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
        reminderSettings: reminderSettings.enabled ? JSON.stringify(reminderSettings) : undefined,
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

  // Prevent modal from closing when reminderSettings changes
  const handleReminderSettingsChange = (newSettings: Partial<typeof reminderSettings>) => {
    setReminderSettings(prev => ({...prev, ...newSettings}));
  };

  // Main tab content with editable fields
  const renderMainTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-5">
        {/* Drag handle */}
        <div className="flex items-center justify-center mb-5">
          <div 
            className={`w-16 h-1 rounded-full cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'bg-blue-400 w-20 h-1.5' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
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
          className={`w-full mb-2 text-xl font-medium border-none outline-none mobile-input-fix ${validationError ? 'text-red-500' : ''}`}
        />
        {validationError && <p className="text-red-500 text-sm mb-4">{validationError}</p>}
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Edit description or add your personal notes..."
          className="w-full min-h-[150px] mb-6 text-gray-500 border-none outline-none resize-none mobile-input-fix"
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

        {/* Meeting/Resource Link */}
                  {goalPack?.link && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-sm font-medium text-green-800">Meeting/Resource Link</span>
            </div>
            <p className="text-sm text-green-600 mb-3">
              Access the related meeting or resource for this goal pack
            </p>
            <a
                              href={goalPack.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
                              {goalPack.link.includes('meet.google.com') ? 'Join Google Meet' :
                goalPack.link.includes('zoom.us') ? 'Join Zoom Meeting' :
                goalPack.link.includes('teams.microsoft.com') ? 'Join Teams Meeting' :
               'Open Resource Link'}
            </a>
          </div>
        )}
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
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return (
      <div className="h-full flex flex-col">
        <ModalHeader title="Deadline" onBack={() => setActiveTab('main')} />
        
        <div className="px-5 pb-5 flex-1">
          {/* Quick select buttons */}
          <div className="space-y-3 mb-6">
            <button 
              onClick={() => {
                setSelectedDate(today.toISOString());
                setActiveTab('main');
              }}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar size={18} className="text-blue-500" />
                </div>
                <span className="font-medium">Today</span>
              </div>
              <span className="text-gray-400">{format(today, 'MMM d')}</span>
            </button>
            
            <button 
              onClick={() => {
                setSelectedDate(tomorrow.toISOString());
                setActiveTab('main');
              }}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar size={18} className="text-orange-500" />
                </div>
                <span className="font-medium">Tomorrow</span>
              </div>
              <span className="text-gray-400">{format(tomorrow, 'MMM d')}</span>
            </button>
            
            <button 
              onClick={() => {
                setSelectedDate(nextWeek.toISOString());
                setActiveTab('main');
              }}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar size={18} className="text-green-500" />
                </div>
                <span className="font-medium">Next week</span>
              </div>
              <span className="text-gray-400">{format(nextWeek, 'MMM d')}</span>
            </button>
          </div>

          {/* Calendar */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-4">Or pick a custom date</h3>
            <input
              type="date"
              className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDate ? selectedDate.split('T')[0] : ''}
              onChange={(e) => {
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                  setSelectedDate(date.toISOString());
                  setActiveTab('main');
                }
              }}
              min={format(today, 'yyyy-MM-dd')}
            />
          </div>
        </div>
      </div>
    );
  };

  // Tag selection screen
  const renderTagTab = () => (
    <div className="h-full flex flex-col">
      <ModalHeader title="Tag" onBack={() => setActiveTab('main')} />
      
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

  // Reminder settings screen
  const renderReminderTab = () => (
    <div className="h-full flex flex-col">
      <ModalHeader title="Reminder" onBack={() => setActiveTab('main')} />
      
      <div className="px-5 pb-5 flex-1">
        {/* Enable/Disable Reminders Toggle */}
        <div className="flex items-center justify-between mb-6 p-2 rounded-lg bg-gray-50">
          <div className="flex items-center">
            <div className="mr-3 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BellIcon size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Enable Daily Reminders</p>
              <p className="text-xs text-gray-500">Get daily notifications at 9:00 AM</p>
            </div>
          </div>
          <button 
            onClick={() => handleReminderSettingsChange({enabled: !reminderSettings.enabled})}
            className={`w-12 h-6 rounded-full relative ${reminderSettings.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span 
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                reminderSettings.enabled ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        
        {reminderSettings.enabled && (
          <div className="space-y-5 animate-in fade-in-50">
            {/* Reminder Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="mr-2" size={16} />
                Start Date
              </label>
              <input
                type="date"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={reminderSettings.date}
                onChange={(e) => handleReminderSettingsChange({date: e.target.value})}
              />
              <p className="text-xs text-gray-500">When should the daily reminders start?</p>
            </div>
            
            {/* Locked Reminder Time - 9 AM */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Clock className="mr-2" size={16} />
                Reminder Time
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">9:00 AM</span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Fixed Time</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">Time is locked at 9:00 AM for the free plan</p>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="mr-2" size={16} />
                Reminder Duration
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleReminderSettingsChange({duration: 7})}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    reminderSettings.duration === 7 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  7 days
                </button>
                <button
                  onClick={() => handleReminderSettingsChange({duration: 14})}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    reminderSettings.duration === 14 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  14 days
                </button>
                <button
                  onClick={() => handleReminderSettingsChange({duration: 21})}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    reminderSettings.duration === 21 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  21 days
                </button>
                <button
                  onClick={() => handleReminderSettingsChange({duration: 30})}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    reminderSettings.duration === 30 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  30 days (Recommended)
                </button>
                <button
                  onClick={() => handleReminderSettingsChange({duration: 60})}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    reminderSettings.duration === 60 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  60 days
                </button>
                <button
                  onClick={() => handleReminderSettingsChange({duration: 90})}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    reminderSettings.duration === 90 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  90 days
                </button>
              </div>
              <p className="text-xs text-gray-500">How long should we send daily reminders?</p>
            </div>
            
            {/* Preview Section */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 mt-6">
              <h4 className="font-medium mb-2 text-blue-800">📅 Reminder Schedule</h4>
              <div className="text-sm text-blue-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Start Date:</span>
                  <span className="font-medium">
                    {(() => {
                      try {
                        if (!reminderSettings.date) {
                          return 'No date selected';
                        }
                        const date = new Date(reminderSettings.date);
                        if (isNaN(date.getTime())) {
                          return 'Invalid date';
                        }
                        return format(date, 'MMM d, yyyy');
                      } catch (error) {
                        console.error('Date formatting error:', error);
                        return 'Invalid date';
                      }
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>End Date:</span>
                  <span className="font-medium">
                    {(() => {
                      try {
                        if (!reminderSettings.date) {
                          return 'No date selected';
                        }
                        const startDate = new Date(reminderSettings.date);
                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + (reminderSettings.duration || 30) - 1);
                        if (isNaN(endDate.getTime())) {
                          return 'Invalid date';
                        }
                        return format(endDate, 'MMM d, yyyy');
                      } catch (error) {
                        console.error('Date formatting error:', error);
                        return 'Invalid date';
                      }
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Time:</span>
                  <span className="font-medium">9:00 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Reminders:</span>
                  <span className="font-medium text-blue-700">{reminderSettings.duration || 30} days</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Done button */}
      {reminderSettings.enabled && (
        <div className="mt-auto p-5 border-t">
          <button 
            onClick={() => {
              try {
                // Set the reminder date from the reminder settings (locked at 9 AM)
                if (reminderSettings.date) {
                  // Create date in local time zone at 9 AM
                  const reminderDate = new Date(reminderSettings.date);
                  reminderDate.setHours(9, 0, 0, 0); // Always 9:00 AM

                  if (!isNaN(reminderDate.getTime())) {
                    // Store in ISO format (will be converted to UTC)
                    setReminder(reminderDate.toISOString());
                    
                    const duration = reminderSettings.duration || 30;
                    toast.success(`Daily reminders set for ${duration} days at 9:00 AM`, {
                      description: `Starting ${reminderDate.toLocaleDateString()}`
                    });
                  } else {
                    toast.error('Invalid reminder date');
                    return;
                  }
                } else {
                  toast.error('Please set a start date for reminders');
                  return;
                }
              } catch (error) {
                console.error('Error setting reminder:', error);
                toast.error('Failed to set reminder');
                return;
              }
              setActiveTab('main');
            }}
            className="w-full py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600"
          >
            Set Daily Reminders
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'date':
        return renderDateTab();
      case 'tag':
        return renderTagTab();
      case 'reminder':
        return renderReminderTab();
      default:
        return renderMainTab();
    }
  };

  if (!goalPack) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay */}
          <motion.div 
            className="fixed inset-0 bg-black/35 bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          
          {/* Modal container */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
            <motion.div 
              ref={modalRef}
              className="bg-white rounded-t-3xl shadow-xl h-[90vh] overflow-y-auto flex flex-col w-full"
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } }}
              exit={{ y: "100%" }}
              style={{
                transform: `translateY(${dragY}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
            >
              {renderContent()}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GoalPackEditModal; 
