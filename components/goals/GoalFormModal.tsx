'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Tag as TagIcon, Bell as BellIcon, Settings, Flag, Loader2, MapPin, Clock, Check } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ActionButtonProps, CreateGoalRequest, GoalFormModalProps, ModalTab, PremiumFeatureModalProps, Milestone, Goal } from '@/lib/types';
import MilestoneComponent from './MilestoneComponent';
import { reminderService } from '@/services/appwrite/reminderService';
import { useRouter } from 'next/navigation';
import { createGoal } from '@/services/appwrite/database';
import { updateGoal } from '@/services/appwrite';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
// Remove the Select imports
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"

// Helper function to format dates nicely
const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy'); // Format as "Jan 1, 2023"
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

// Action button component
const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, selected }) => {
  // Format date if it looks like an ISO date string
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

const PremiumFeatureModal: React.FC<PremiumFeatureModalProps> = ({
  title,
  description,
  icon,
  onClose
}) => {
  const router = useRouter();

  const handleUpgradeClick = () => {
    onClose();
    router.push('/premium');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <button onClick={onClose} className="p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {typeof icon === 'string' ? (
          <Image 
            src={icon} 
            alt={title} 
            width={120} 
            height={120} 
            className="mb-6" 
          />
        ) : (
          <div className="mb-6 w-32 h-32 flex items-center justify-center">
            {icon}
          </div>
        )}
        
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-10">{description}</p>
      </div>
      
      <div className="p-5 flex flex-col gap-3">
        <button 
          onClick={handleUpgradeClick}
          className="w-full py-4 text-white bg-blue-500 rounded-full font-medium hover:bg-blue-600 transition-colors"
        >
          Upgrade Now
        </button>
        
        <button 
          onClick={onClose}
          className="w-full py-4 text-blue-500 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

interface GoalFormData {
  id?: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  milestones: Milestone[];
  reminderSettings: {
    enabled: boolean;
    time: string;
    date: string;
    duration?: number; // Added for daily reminders
  };
}

// Main component
const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  category = 'finance',
  mode = 'create'
}) => {
  
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ModalTab>('main');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(initialData?.deadline);
  const [selectedTag, setSelectedTag] = useState('');
  const [reminder, setReminder] = useState<string | undefined>(initialData?.reminderDate);
  const [location, setLocation] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<{
    title: string;
    description: string;
    icon: React.ReactNode | string;
  } | null>(null);
  
  const [reminderSettings, setReminderSettings] = useState<GoalFormData['reminderSettings']>(() => {
    try {
      if (initialData?.reminderSettings) {
        const parsed = JSON.parse(initialData.reminderSettings as string);
        return {
          enabled: parsed.enabled || false,
          time: parsed.time || '09:00', // This will be locked at 9 AM
          date: parsed.date || format(new Date(), 'yyyy-MM-dd'),
          duration: parsed.duration || 30 // Default to 30 days
        };
      }
    } catch (error) {
      console.error('Error parsing initial reminder settings:', error);
    }
    
    // Default settings
    return {
      enabled: false,
      time: '09:00', // This will be locked at 9 AM
      date: format(new Date(), 'yyyy-MM-dd'),
      duration: 30 // Default to 30 days
    };
  });
  
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setSelectedDate(initialData.deadline || '');
      setSelectedTag(initialData.tags || '');
      setReminder(initialData.reminderDate || '');
      setLocation(initialData.location || '');
      
        try {
          const parsedMilestones = initialData.milestones ? JSON.parse(initialData.milestones as string) : [];
          setMilestones(parsedMilestones);
        } catch (e) {
          console.error("Failed to parse milestones", e);
        setMilestones([]);
      }
      
        try {
          const parsedSettings = initialData.reminderSettings ? JSON.parse(initialData.reminderSettings as string) : {};
          setReminderSettings({
            enabled: parsedSettings.enabled || false,
            time: parsedSettings.time || '09:00',
            date: parsedSettings.date || format(new Date(), 'yyyy-MM-dd'),
            duration: parsedSettings.duration || 30,
          });
        } catch (e) {
          console.error("Failed to parse reminder settings", e);
        }
      } else {
      setTitle('');
      setDescription('');
      setSelectedDate('');
      setSelectedTag('');
      setReminder('');
      setLocation('');
      setMilestones([]);
      setReminderSettings({
        enabled: false,
        time: "09:00",
          date: new Date().toISOString().split('T')[0],
          duration: 30,
      });
    }
    setActiveTab('main');
    setPremiumFeature(null);
    setShowOptionsDropdown(false);
    }
  }, [isOpen, initialData]);

  // Separate effect for managing body scroll
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

  // Separate effect for dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOptionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Prevent modal from closing when reminderSettings changes
  const handleReminderSettingsChange = (newSettings: Partial<GoalFormData['reminderSettings']>) => {
    setReminderSettings(prev => ({...prev, ...newSettings}));
  };

  // Month navigation helpers
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    
    return date >= today && date <= sixMonthsFromNow;
  };

  const handleSubmit = async (data: GoalFormData) => {
    if (!user) {
      toast.error("You must be logged in to save a goal.");
      return;
    }
    try {
      setIsSubmitting(true);

      const compactReminderSettings = data.reminderSettings.enabled ? {
        e: data.reminderSettings.enabled,
        t: data.reminderSettings.time,
        d: data.reminderSettings.date,
        du: data.reminderSettings.duration,
      } : { e: false };

      const processReminders = async (goalId: string) => {
        if (data.reminderSettings.enabled) {
          if (!user.id || !user.email) {
            toast.error('Goal saved but failed to schedule reminders - missing user data');
            return;
          }
          
          try {
            const { date, duration, time } = data.reminderSettings;
            
            if (date && time) {
              const [hours, minutes] = time.split(':').map(Number);
              const reminderDate = new Date(date);
              reminderDate.setHours(hours, minutes, 0, 0);

              // FOR DEBUGGING: Set reminder time to 10 seconds ago in development
              if (process.env.NODE_ENV === 'development') {
                console.log('DEV MODE: Setting reminder to 10 seconds in the past for immediate check.');
                reminderDate.setSeconds(reminderDate.getSeconds() - 10);
              }
              
              if (reminderDate > new Date() || process.env.NODE_ENV === 'development') {
                await reminderService.createRecurringReminder({
                  goalId: goalId,
                  userId: user.id,
                  userEmail: user.email,
                  userName: user.name || user.email,
                  title: 'Goal Reminder',
                  description: `Time to work on: ${data.title}`,
                  sendAt: reminderDate.toISOString()
                }, duration || 30);
                
                toast.success(`Reminders scheduled for ${duration || 30} days! 🚀`);
              }
            }
          } catch (error) {
            console.error('Failed to create reminders:', error);
            toast.error('Goal saved but failed to schedule reminders');
          }
        }
      };

      if (data.id) {
        await updateGoal(data.id, {
          title: data.title,
          description: data.description,
          category: data.category as any,
          deadline: data.dueDate,
          milestones: JSON.stringify(data.milestones),
          reminderSettings: JSON.stringify(compactReminderSettings)
        });
        toast.success('Goal updated successfully!');
        await processReminders(data.id);

        const updatedGoal: Goal = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category as any,
          deadline: data.dueDate,
          milestones: JSON.stringify(data.milestones),
          reminderSettings: JSON.stringify(compactReminderSettings),
          userId: user?.id || '',
          createdAt: initialData?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isCompleted: false
        };
        onSave?.(updatedGoal);

      } else {
        const goalData: CreateGoalRequest = {
          title: data.title,
          description: data.description,
          category: data.category as any,
          deadline: data.dueDate,
          milestones: JSON.stringify(data.milestones),
          reminderSettings: JSON.stringify(compactReminderSettings)
        };
        
        const newGoal = await createGoal(goalData, user?.id || '');
        toast.success('Goal created successfully!');
        await processReminders(newGoal.id);

        const createdGoal: Goal = {
          id: newGoal.id,
          title: data.title,
          description: data.description,
          category: data.category as any,
          deadline: data.dueDate,
          milestones: JSON.stringify(data.milestones),
          reminderSettings: JSON.stringify(compactReminderSettings),
          userId: user?.id || '',
          createdAt: newGoal.createdAt || new Date().toISOString(),
          updatedAt: newGoal.updatedAt || new Date().toISOString(),
          isCompleted: false
        };
        onSave?.(createdGoal);
      }

      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Failed to save goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMainTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-5">
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
        
        <div className="flex overflow-x-auto gap-3 mb-6 pb-2 w-full">
          <ActionButton 
            icon={<Calendar size={16} />} 
            label={selectedDate ? formatDisplayDate(selectedDate) : 'Date'} 
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
          
          <div className="" ref={dropdownRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsDropdown(!showOptionsDropdown);
              }}
              className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full"
            >
              <Settings size={16} />
            </button>
            
            {showOptionsDropdown && (
              <>
                <div className="fixed inset-0 bg-black/5 " onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsDropdown(false);
                }} />
                
                <div className="absolute left-[68%] transform -translate-x-1/2 p-1 bg-white rounded-md shadow-[0_2px_15px_rgba(0,0,0,0.1)] w-[220px] z-50">
                  <div 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptionsDropdown(false);
                      setActiveTab('target');
                      setPremiumFeature(null);
                    }}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-800 text-xs">Deadline</span>
                    </div>
                    <span className="text-amber-400">⭐</span>
                  </div>
                  
                  <div 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptionsDropdown(false);
                      setActiveTab('location');
                      setPremiumFeature(null);
                    }}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-800 text-xs">Location</span>
                    </div>
                    <span className="text-amber-400">⭐</span>
                  </div>
                  
                  <div 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptionsDropdown(false);
                      setActiveTab('more');
                      setPremiumFeature(null);
                    }}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-800 text-xs">More options</span>
                    </div>
                    <Settings className="text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g Complete savings for school fees"
          className={`w-full mb-2 text-xl font-medium border-none outline-none mobile-input-fix ${validationError ? 'text-red-500' : ''}`}
        />
        {validationError && <p className="text-red-500 text-sm mb-4">{validationError}</p>}
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full min-h-[150px] mb-6 text-gray-500 border-none outline-none resize-none mobile-input-fix"
        />
        
        {description.trim() && (
          <MilestoneComponent
            milestones={milestones}
            onMilestonesChange={setMilestones}
          />
        )}
      </div>
      
      <div className="mt-auto p-5 border-t">
        <button 
          onClick={() => {
            const formData = {
              id: initialData?.id,
              title,
              description,
              category,
              dueDate: selectedDate || '',
              milestones,
              reminderSettings: {
                enabled: reminderSettings.enabled,
                time: reminderSettings.time,
                date: reminderSettings.date,
                duration: reminderSettings.duration
              }
            };
            
            handleSubmit(formData);
          }} 
          disabled={isSubmitting}
          className="w-full py-4 text-white bg-blue-500 rounded-full font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {mode === 'edit' ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            mode === 'edit' ? 'Update Task' : 'Add Task'
          )}
        </button>
      </div>
    </div>
  );

  const renderTagTab = () => (
    <div className="h-full flex flex-col">
      <ModalHeader title="Tag" onBack={() => setActiveTab('main')} />
      
      <div className="px-5 pb-5 flex-1">
        <button 
          onClick={() => {
            setSelectedTag('Urgent');
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg mb-3 ${selectedTag === 'Urgent' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-red-500" size={20} />
          </div>
          <span className="text-red-500 font-medium">Urgent</span>
        </button>
        
        <button 
          onClick={() => {
            setSelectedTag('Important task');
            setActiveTab('main');
          }}
          className={`flex items-center w-full p-3 hover:bg-gray-50 rounded-lg ${selectedTag === 'Important task' ? 'bg-gray-50' : ''}`}
        >
          <div className="mr-3">
            <Flag className="text-yellow-500" size={20} />
          </div>
          <span className="text-yellow-500 font-medium">Important task</span>
        </button>
      </div>
    </div>
  );
  
  // Date selection screen
  const renderDateTab = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekend = new Date(today);
    const daysUntilWeekend = 6 - today.getDay(); // Saturday is 6
    weekend.setDate(today.getDate() + daysUntilWeekend);
    
    const formatButtonDate = (date: Date) => {
      return format(date, 'EEE, MMM d'); // Format as "Mon, Jan 1"
    };
    
    return (
      <div className="h-full flex flex-col">
        <ModalHeader title="Deadline" onBack={() => setActiveTab('main')} />
        
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
          
          {/* Mini calendar */}
          <div className="border rounded-lg p-3 mb-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h4 className="text-sm font-medium">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const today = new Date();
                const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const firstDayOfWeek = currentMonthStart.getDay();
                const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                
                const days = [];
                
                // Add empty cells for days before the first day of the month
                for (let i = 0; i < firstDayOfWeek; i++) {
                  days.push(<div key={`empty-${i}`} className="h-8"></div>);
                }
                
                // Add days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isToday = date.toDateString() === today.toDateString();
                  const isSelected = selectedDate && new Date(selectedDate).toDateString() === date.toDateString();
                  const isSelectable = isDateSelectable(date);
                  
                  days.push(
                  <button 
                      key={day}
                    onClick={() => {
                        if (isSelectable) {
                          setSelectedDate(format(date, 'yyyy-MM-dd'));
                      setActiveTab('main');
                        }
                      }}
                      disabled={!isSelectable}
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        isSelected 
                          ? 'bg-blue-500 text-white' 
                          : isToday 
                            ? 'bg-blue-100 text-blue-600' 
                            : isSelectable
                              ? 'hover:bg-gray-100 text-gray-700' 
                              : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {day}
                  </button>
                );
                }
                
                return days;
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
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
              <p className="text-xs text-gray-500">Get daily notifications for your goal</p>
            </div>
          </div>
          <button 
            onClick={() => handleReminderSettingsChange({ enabled: !reminderSettings.enabled })}
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
                onChange={(e) => handleReminderSettingsChange({ date: e.target.value })}
              />
              <p className="text-xs text-gray-500">When should the daily reminders start?</p>
            </div>
            
            {/* Reminder Time Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Clock className="mr-2" size={16} />
                Reminder Time
              </label>
                <input
                  type="time"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reminderSettings.time}
                onChange={(e) => handleReminderSettingsChange({ time: e.target.value })}
                />
              <p className="text-xs text-gray-500">Choose a time for your daily reminder.</p>
                </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="mr-2" size={16} />
                Reminder Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {[7, 14, 21, 30, 60, 90].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => handleReminderSettingsChange({ duration })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      reminderSettings.duration === duration
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {duration} days{duration === 30 && ' (Recommended)'}
                  </button>
                ))}
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
                  <span className="font-medium">
                    {(() => {
                      try {
                        if (!reminderSettings.time) return 'Not set';
                        const d = new Date(`1970-01-01T${reminderSettings.time}`);
                        return format(d, 'h:mm a');
                      } catch { return 'Invalid time'; }
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Reminders:</span>
                  <span className="font-medium text-blue-700">{reminderSettings.duration || 30} days</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Call to action for quick setup */}
        {!reminderSettings.enabled && (
          <div className="space-y-3 mt-4">
            <button 
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                handleReminderSettingsChange({
                  enabled: true,
                  time: "09:00",
                  date: format(tomorrow, 'yyyy-MM-dd'),
                  duration: 30
                });
                
                toast.success("Daily reminders set for 30 days at 9:00 AM");
              }}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <BellIcon size={18} className="text-blue-500" />
                </div>
                <div className="text-left">
                  <span className="font-medium block">Start Tomorrow</span>
                  <span className="text-xs text-gray-500">30 days at 9:00 AM</span>
              </div>
                </div>
              <span className="text-gray-400">→</span>
            </button>
            
            <button 
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                
                handleReminderSettingsChange({
                  enabled: true,
                  time: "09:00",
                  date: format(nextWeek, 'yyyy-MM-dd'),
                  duration: 30
                });
                
                toast.success("Daily reminders set starting next week");
              }}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-full bg-green-100 flex items-center justify-center">
                  <BellIcon size={18} className="text-green-500" />
                </div>
                <div className="text-left">
                  <span className="font-medium block">Start Next Week</span>
                  <span className="text-xs text-gray-500">30 days at 9:00 AM</span>
              </div>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Done button */}
      {reminderSettings.enabled && (
        <div className="mt-auto p-5 border-t">
          <button 
            onClick={() => {
              try {
                if (reminderSettings.date && reminderSettings.time) {
                  const [hours, minutes] = reminderSettings.time.split(':').map(Number);
                  const reminderDate = new Date(reminderSettings.date);
                  reminderDate.setHours(hours, minutes, 0, 0);

                  if (!isNaN(reminderDate.getTime())) {
                    setReminder(reminderDate.toISOString());
                    const duration = reminderSettings.duration || 30;
                    toast.success(`Daily reminders set for ${duration} days at ${format(reminderDate, 'h:mm a')}`, {
                      description: `Starting ${reminderDate.toLocaleDateString()}`
                    });
                  } else {
                    toast.error('Invalid reminder date');
                    return;
                  }
                } else {
                  toast.error('Please set a start date and time for reminders');
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

  // Target/deadline feature modal
  const renderTargetModal = () => {
    return (
      <PremiumFeatureModal
        title="Targets are for Pros"
        description="Set specific targets and deadlines to keep your goals on track. Premium users get advanced goal analytics and progress insights."
        icon={
          <div className="relative w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-8 border-black flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-red-400 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-red-400"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        onClose={() => {
          setActiveTab('main');
          setPremiumFeature(null);
        }}
      />
    );
  };

   // Location feature modal
   const renderLocationModal = () => {
    return (
      <PremiumFeatureModal
        title="Pro Location Reminders"
        description="Get location-based reminders to help you stay on track wherever you are. Perfect for goals that require specific locations or routines."
        icon={
          <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.4194,37.7749,13,0/300x300?access_token=example')] bg-center bg-no-repeat bg-cover">
              {/* Simulated map interface */}
              <div className="absolute top-4 left-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 11L11 3L21 11" stroke="black" strokeWidth="2" />
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        }
        onClose={() => {
          setActiveTab('main');
          setPremiumFeature(null);
        }}
      />
    );
  };
  
//   // More options screen
  const renderMoreOptionsTab = () => {
    // If showing a premium feature modal
    if (premiumFeature) {
      return (
        <PremiumFeatureModal
          title={premiumFeature.title}
          description={premiumFeature.description}
          icon={premiumFeature.icon}
          onClose={() => setPremiumFeature(null)}
        />
      );
    }
    
    return (
      <div className="h-full flex flex-col">
        <ModalHeader title="More options" onBack={() => setActiveTab('main')} />
        
        <div className="px-5 pb-5 flex-1">
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Show labels</h3>
              <input 
                type="checkbox"
                checked={false}
                className="w-10 h-6 rounded-full appearance-none bg-gray-300 peer relative cursor-pointer transition-colors checked:bg-blue-500 before:absolute before:content-[''] before:w-5 before:h-5 before:bg-white before:rounded-full before:left-0.5 before:top-0.5 before:transition-all peer-checked:before:left-[calc(100%-1.2rem)]"
              />
            </div>
            <p className="text-sm text-gray-500">Display</p>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 mb-1">
                <Calendar size={18} />
              </div>
              <span className="text-xs">Date</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 mb-1">
                <Flag size={18} />
              </div>
              <span className="text-xs">Priority</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 mb-1">
                <BellIcon size={18} />
              </div>
              <span className="text-xs">Reminders</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 mb-1">
                <TagIcon size={18} />
              </div>
              <span className="text-xs">Tag</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Included options</h3>
            <div className="space-y-2 mb-4">
              {/* Date option - removable */}
              <div className="flex items-center">
                <button className="mr-3 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-500 text-sm">−</span>
                </button>
                <div className="flex items-center">
                  <Calendar size={18} className="mr-2" />
                  <span>Date</span>
                </div>
              </div>
              
              {/* Reminders option - removable */}
              <div className="flex items-center">
                <button className="mr-3 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-500 text-sm">−</span>
                </button>
                <div className="flex items-center">
                  <BellIcon size={18} className="mr-2" />
                  <span>Reminders</span>
                </div>
              </div>
              
              {/* Tag option - removable */}
              <div className="flex items-center">
                <button className="mr-3 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-500 text-sm">−</span>
                </button>
                <div className="flex items-center">
                  <TagIcon size={18} className="mr-2" />
                  <span>Tag</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">More options</h3>
            <div className="space-y-2">
              {/* Label option - addable */}
              <div className="flex items-center">
                <button className="mr-3 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-500 text-sm">+</span>
                </button>
                <div className="flex items-center">
                  <TagIcon size={18} className="mr-2" />
                  <span>Label</span>
                </div>
              </div>
              
              {/* Deadline option - addable */}
              <div className="flex items-center">
                <button className="mr-3 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-500 text-sm">+</span>
                </button>
                <div className="flex items-center">
                  <Calendar size={18} className="mr-2" />
                  <span>Deadline</span>
                </div>
              </div>
              
              {/* Location option - addable */}
              <div className="flex items-center">
                <button className="mr-3 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-500 text-sm">+</span>
                </button>
                <div className="flex items-center">
                  <MapPin size={18} className="mr-2" />
                  <span>Location</span>
                </div>
              </div>
            </div>
          </div>
          
          {mode === 'edit' && initialData?.id && (
            <div className="mt-8">
              <button 
                onClick={() => {
                  // Confirm deletion
                  if (window.confirm('Are you sure you want to delete this goal?')) {
                    // This would be implemented to call deleteGoal API
                    toast.success('Goal deleted'); 
                    onClose();
                    // If onDelete callback existed: onDelete(initialData.id);
                  }
                }} 
                className="w-full p-3 text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Delete Goal
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
 
  
  

  // Update the renderContent function to include the new tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'tag':
        return renderTagTab();
      case 'date':
        return renderDateTab();
      case 'reminder':
        return renderReminderTab();
      case 'more':
        return renderMoreOptionsTab();
      case 'location':
        return renderLocationModal();
      case 'target':
        return renderTargetModal();
      default:
        return renderMainTab();
    }
  };

  // Animation variants for the modal
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const slideUpVariants = {
    hidden: { y: "100%" },
    visible: { y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
  };

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

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
    // Don't start drag if touching a form input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
      return;
    }
    
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
    // Don't start drag if clicking a form input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
      return;
    }
    
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/35 bg-opacity-50"
            onClick={onClose}
          />
          
          {/* Modal container */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
          <motion.div 
            ref={modalRef}
              variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
              className="bg-white rounded-t-2xl max-h-[85vh] w-full flex flex-col shadow-2xl overflow-y-auto"
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

export default GoalFormModal; 
