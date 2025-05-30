'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Tag as TagIcon, Bell as BellIcon, Settings, Flag, Loader2, MapPin, Clock, Check,  } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ActionButtonProps, CreateGoalRequest, GoalFormModalProps, ModalTab, PremiumFeatureModalProps } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { createGoal } from '@/src/services/appwrite/database';
import { updateGoal } from '@/src/services/appwrite';
import { useAuth } from '@/context/AuthContext';
import { reminderService } from '@/src/services/appwrite/reminderService';
import { format } from 'date-fns';
import { requestNotificationPermission, scheduleReminderNotificationWithAlarm } from '@/app/sw-register';

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

// const OptionItem: React.FC<OptionItemProps> = ({ 
//   icon, 
//   label, 
//   onClick, 
//   hasToggle = false, 
//   isActive = false,
//   isPro = false
// }) => {
//   const router = useRouter();
  
//   const handleClick = () => {
//     if (isPro) {
//       router.push('/premium');
//     } else {
//       onClick();
//     }
//   };
  
//   return (
//     <div 
//       className="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer"
//       onClick={handleClick}
//     >
//       <div className="flex items-center">
//         <div className="mr-3 text-gray-600">
//           {icon}
//         </div>
//         <span>{label}</span>
//       </div>
//       {hasToggle ? (
//         <input 
//           type="checkbox"
//           checked={isActive}
//           onChange={onClick}
//           className="w-5 h-5 accent-blue-500"
//         />
//       ) : (
//         <div className="text-gray-400">
//           {isPro ? (
//             <span className="text-amber-400">⭐</span>
//           ) : (
//             <span>⟩</span>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

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

// Define the reminder types
type ReminderInterval = "once" | "daily" | "weekly" | "biweekly" | "monthly";

// Enhanced reminder settings interface
interface ReminderSettings {
  enabled: boolean;
  interval: ReminderInterval;
  count: number;
  time: string;
  date: string;
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
  
  // const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ModalTab>('main');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [reminder, setReminder] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  // Add dropdown state at the component level
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  // Move the premium feature state to the top level
  const [premiumFeature, setPremiumFeature] = useState<{
    title: string;
    description: string;
    icon: React.ReactNode | string;
  } | null>(null);
  
  // Enhanced reminder settings
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    interval: "once",
    count: 1,
    time: "09:00",
    date: new Date().toISOString().split('T')[0]
  });
  
  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const reminderToastShown = useRef(false);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      // If in edit mode, populate form with existing data
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setSelectedDate(initialData.deadline || '');
      setSelectedTag(initialData.tags || '');
      setReminder(initialData.reminderDate || '');
      setLocation(initialData.location || '');
      
      // Set reminder settings if available
      if (initialData.reminderSettings) {
        try {
          const parsedSettings = JSON.parse(initialData.reminderSettings as string);
          setReminderSettings(parsedSettings);
        } catch (e) {
          console.error("Failed to parse reminder settings", e);
        }
      }
    } else if (isOpen && !initialData) {
      // Reset form when opening for creation
      setTitle('');
      setDescription('');
      setSelectedDate('');
      setSelectedTag('');
      setReminder('');
      setLocation('');
      setReminderSettings({
        enabled: false,
        interval: "once",
        count: 1,
        time: "09:00",
        date: new Date().toISOString().split('T')[0]
      });
    }
    
    // Reset modal state when opening/closing
    setActiveTab('main');
    setPremiumFeature(null);
    setShowOptionsDropdown(false);
    reminderToastShown.current = false;
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

  // Close dropdown when clicking outside
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

  // Schedule reminders based on the settings
  const scheduleReminders = async (goalId: string) => {
    if (!reminderSettings.enabled) return;
    
    try {
      // First, request notification permission if not already granted
      const permissionGranted = await requestNotificationPermission();
      
      if (!permissionGranted) {
        // If permission was denied, still create the reminder in the database
        // but inform the user they won't receive notifications
        toast.warning(
          <div className="flex flex-col gap-1">
            <span className="font-medium">Notification permission denied</span>
            <span className="text-sm text-gray-600">
              You won&apos;t receive notification alerts for this reminder
            </span>
          </div>
        );
      }
      
      const [hours, minutes] = reminderSettings.time.split(':').map(Number);
      const reminderDate = new Date(reminderSettings.date);
      
      // Set reminder time
      reminderDate.setHours(hours, minutes, 0, 0);
      
      // If the time has passed for today and it's a one-time reminder, set for tomorrow
      if (reminderSettings.interval === "once" && reminderDate < new Date()) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      
      // Calculate reminder dates based on interval
      const reminderDates = [reminderDate.toISOString()];
      
      // For multiple reminders, calculate additional dates
      if (reminderSettings.interval !== "once" && reminderSettings.count > 1) {
        for (let i = 1; i < reminderSettings.count; i++) {
          const nextDate = new Date(reminderDate);
          
          switch (reminderSettings.interval) {
            case "daily":
              nextDate.setDate(nextDate.getDate() + i);
              break;
            case "weekly":
              nextDate.setDate(nextDate.getDate() + (i * 7));
              break;
            case "biweekly":
              nextDate.setDate(nextDate.getDate() + (i * 14));
              break;
            case "monthly":
              nextDate.setMonth(nextDate.getMonth() + i);
              break;
          }
          
          reminderDates.push(nextDate.toISOString());
        }
      }
      
      // Create reminders using the reminderService
      const reminderPromises = reminderDates.map(sendDate => 
        reminderService.createReminder({
          goalId,
          userId: user?.id,
          title: `Reminder: ${title}`,
          description: description || 'Time to work on your goal!',
          sendDate,
          dueDate: selectedDate || undefined
        })
      );
      
      await Promise.all(reminderPromises);
      
      // If notification permission is granted, also schedule in service worker for alarm
      if (permissionGranted) {
        // Schedule the notifications in the service worker for alarm functionality
        const serviceWorkerPromises = reminderDates.map(sendDate => 
          scheduleReminderNotificationWithAlarm({
            goalId,
            title: `Reminder: ${title}`,
            description: description || 'Time to work on your goal!',
            sendDate,
            alarm: true
          })
        );
        
        await Promise.all(serviceWorkerPromises);
      }
      
      const formattedTime = new Date(`2000-01-01T${reminderSettings.time}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Reminder Set! ⏰</span>
          <span className="text-sm text-gray-600">
            {reminderSettings.count} {reminderSettings.count === 1 ? 'reminder' : 'reminders'} scheduled at {formattedTime}
            {permissionGranted ? '' : ' (notifications blocked by browser)'}
          </span>
        </div>
      );
      
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      toast.error('Failed to schedule reminders');
    }
  };

  const handleSave = async () => {
    // Clear previous validation errors
    setValidationError('');
    
    // Validate form
    if (!title.trim()) {
      setValidationError("Please enter a task title");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare data for API
      const goalData: CreateGoalRequest = {
        title,
        description: description || undefined,
        category: category.toLowerCase() as 'finance' | 'schedule' | 'career' | 'audio_books',
        deadline: selectedDate || undefined,
        tags: selectedTag || undefined,
        reminderDate: reminder || undefined,
        location: location || undefined,
        reminderSettings: reminderSettings.enabled ? JSON.stringify(reminderSettings) : undefined
      };
      
      // Ensure the category is one of the allowed values
      if (!['schedule', 'finance', 'career', 'audio_books'].includes(goalData.category)) {
        throw new Error(`Invalid category: ${goalData.category}. Must be one of: schedule, finance, career, audio_books`);
      }
      
      let result;
      
      if (mode === 'edit' && initialData?.id) {
        // Update existing goal
        result = await updateGoal(initialData.id, goalData);
        
        // Schedule reminders if enabled
        if (reminderSettings.enabled) {
          await scheduleReminders(initialData.id);
        }
        
        toast.success('Goal updated successfully');
      } else {
        // Create new goal
        result = await createGoal(goalData, user?.id || initialData?.userId || 'system');
        
        // Schedule reminders if enabled and we have a goal ID
        if (reminderSettings.enabled && result?.id) {
          await scheduleReminders(result.id);
        }
        
        toast.success('Goal created successfully');
      }
      
      // Close modal and notify parent component
      onClose();
      if (onSave && result) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error(`Failed to save goal: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Main tab content with action buttons at the top
  const renderMainTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-5">
        {/* Drag handle */}
        <div className="flex items-center justify-center mb-5">
          <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
        </div>
        
        {/* Action buttons */}
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
              onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
              className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full"
            >
              <Settings size={16} />
            </button>
            
            {/* Dropdown Modal with overlay */}
            {showOptionsDropdown && (
              <>
                {/* Overlay to make dropdown stand out */}
                <div className="fixed inset-0 bg-black/5 " onClick={() => setShowOptionsDropdown(false)} />
                
                {/* Dropdown card */}
                <div className="absolute left-[68%] transform -translate-x-1/2 p-1 bg-white rounded-md shadow-[0_2px_15px_rgba(0,0,0,0.1)] w-[220px] z-50">
                  <div 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    onClick={() => {
                      setShowOptionsDropdown(false);
                      setActiveTab('target');
                      // Clear any premium feature that might be showing
                      setPremiumFeature(null);
                    }}
                  >
                    <div className="flex items-center">
                      {/* <Calendar className="text-amber-400 w-5 h-5 mr-3" /> */}
                      <span className="text-gray-800 text-xs">Deadline</span>
                    </div>
                    <span className="text-amber-400">⭐</span>
                  </div>
                  
                  <div 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    onClick={() => {
                      setShowOptionsDropdown(false);
                      setActiveTab('location');
                      // Clear any premium feature that might be showing
                      setPremiumFeature(null);
                    }}
                  >
                    <div className="flex items-center">
                      {/* <MapPin className="text-amber-400 w-5 h-5 mr-3" /> */}
                      <span className="text-gray-800 text-xs">Location</span>
                    </div>
                    <span className="text-amber-400">⭐</span>
                  </div>
                  
                  <div 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setShowOptionsDropdown(false);
                      setActiveTab('more');
                      // Clear any premium feature that might be showing
                      setPremiumFeature(null);
                    }}
                  >
                    <div className="flex items-center">
                      {/* <Settings className="text-gray-500 w-5 h-5 mr-3" /> */}
                      <span className="text-gray-800 text-xs">More options</span>
                    </div>
                    <Settings className="text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Input fields */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g Complete savings for school fees"
          className={`w-full mb-2 text-xl font-medium border-none outline-none ${validationError ? 'text-red-500' : ''}`}
        />
        {validationError && <p className="text-red-500 text-sm mb-4">{validationError}</p>}
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full min-h-[150px] mb-6 text-gray-500 border-none outline-none resize-none"
        />
      </div>
      
      {/* Add Task button - fixed at bottom */}
      <div className="mt-auto p-5 border-t">
        <button 
          onClick={handleSave} 
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

  // Tag selection screen
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
            <div className="grid grid-cols-7 gap-2 text-center">
              {[...Array(31)].map((_, i) => {
                const day = i + 1;
                const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
                const dateStr = `${day < 10 ? '0' + day : day} ${currentMonth}`;
                const isSelected = selectedDate === dateStr;
                
                return (
                  <button 
                    key={i}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setActiveTab('main');
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
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
              <p className="font-medium">Enable Reminders</p>
              <p className="text-xs text-gray-500">Get notified about this goal</p>
            </div>
          </div>
          <button 
            onClick={() => setReminderSettings(prev => ({...prev, enabled: !prev.enabled}))}
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
            {/* Reminder Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="mr-2" size={16} />
                Start Date
              </label>
              <input
                type="date"
                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={reminderSettings.date}
                onChange={(e) => setReminderSettings(prev => ({...prev, date: e.target.value}))}
              />
              <p className="text-xs text-gray-500">When should the reminder start?</p>
            </div>
            
            {/* Reminder Time */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Clock className="mr-2" size={16} />
                Reminder Time
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className="flex-1 p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reminderSettings.time}
                  onChange={(e) => {
                    setReminderSettings(prev => ({...prev, time: e.target.value}));
                    
                    // Show toast for time update
                    if (!reminderToastShown.current) {
                      const formattedTime = new Date(`2000-01-01T${e.target.value}`).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });
                      
                      toast.success(`Reminder time set to ${formattedTime}`);
                      reminderToastShown.current = true;
                    }
                  }}
                />
                <div className="text-sm text-gray-500">
                  {new Date(`2000-01-01T${reminderSettings.time}`).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
            </div>
            
            {/* Reminder Interval */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <BellIcon className="mr-2" size={16} />
                Repeat
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["once", "daily", "weekly", "biweekly", "monthly"] as ReminderInterval[]).map(interval => (
                  <button
                    key={interval}
                    onClick={() => setReminderSettings(prev => ({...prev, interval}))}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      reminderSettings.interval === interval 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="capitalize">{interval}</span>
                    {reminderSettings.interval === interval && (
                      <Check size={16} className="text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Number of Reminders */}
            {reminderSettings.interval !== "once" && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <BellIcon className="mr-2" size={16} />
                  Number of Reminders
                </label>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setReminderSettings(prev => ({
                      ...prev, 
                      count: Math.max(1, prev.count - 1)
                    }))}
                    className="p-3 bg-gray-100 hover:bg-gray-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={reminderSettings.count}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      count: Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                    }))}
                    className="flex-1 p-3 text-center border-none focus:outline-none"
                  />
                  <button
                    onClick={() => setReminderSettings(prev => ({
                      ...prev, 
                      count: Math.min(10, prev.count + 1)
                    }))}
                    className="p-3 bg-gray-100 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {reminderSettings.count > 1 
                    ? `You'll receive ${reminderSettings.count} reminders`
                    : "You'll receive 1 reminder"}
                </p>
              </div>
            )}
            
            {/* Preview Section */}
            <div className="p-4 rounded-lg bg-gray-50 mt-6">
              <h4 className="font-medium mb-2">Reminder Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2" />
                  <span>
                    {format(new Date(reminderSettings.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock size={14} className="mr-2" />
                  <span>
                    {new Date(`2000-01-01T${reminderSettings.time}`).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
                {reminderSettings.interval !== "once" && (
                  <div className="flex items-center">
                    <BellIcon size={14} className="mr-2" />
                    <span>
                      Repeats {reminderSettings.interval}, {reminderSettings.count} {reminderSettings.count === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                )}
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
                tomorrow.setHours(9, 0, 0, 0);
                
                setReminderSettings({
                  enabled: true,
                  interval: "once",
                  count: 1,
                  time: "09:00",
                  date: tomorrow.toISOString().split('T')[0]
                });
                
                toast.success("Reminder set for tomorrow at 9:00 AM");
              }}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <BellIcon size={18} className="text-blue-500" />
                </div>
                <span className="font-medium">Tomorrow morning</span>
              </div>
              <span className="text-gray-400">9:00 AM</span>
            </button>
            
            <button 
              onClick={() => {
                const today = new Date();
                today.setHours(18, 0, 0, 0);
                
                setReminderSettings({
                  enabled: true,
                  interval: "once",
                  count: 1,
                  time: "18:00",
                  date: today.toISOString().split('T')[0]
                });
                
                toast.success("Reminder set for today at 6:00 PM");
              }}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-full bg-orange-100 flex items-center justify-center">
                  <BellIcon size={18} className="text-orange-500" />
                </div>
                <span className="font-medium">This evening</span>
              </div>
              <span className="text-gray-400">6:00 PM</span>
            </button>
            
            <button 
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                nextWeek.setHours(9, 0, 0, 0);
                
                setReminderSettings({
                  enabled: true,
                  interval: "once",
                  count: 1,
                  time: "09:00",
                  date: nextWeek.toISOString().split('T')[0]
                });
                
                toast.success("Reminder set for next week");
              }}
              className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-full bg-green-100 flex items-center justify-center">
                  <BellIcon size={18} className="text-green-500" />
                </div>
                <span className="font-medium">Next week</span>
              </div>
              <span className="text-gray-400">
                {format(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), 'EEE, MMM d')}
              </span>
            </button>
          </div>
        )}
      </div>
      
      {/* Done button */}
      {reminderSettings.enabled && (
        <div className="mt-auto p-5 border-t">
          <button 
            onClick={() => {
              // Fix - use the actual date:
setReminder(new Date(reminderSettings.date).toISOString());
              setActiveTab('main');
            }}
            className="w-full py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600"
          >
            Done
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
        description="Lorem ipsum dolor sit amet consectetur. Pellentesque ut pellentesque erat consectetur facilisis sed."
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
        description="Lorem ipsum dolor sit amet consectetur. Varius consectetur nullam vulputate turpis ac viverra tincidunt ut facilisis."
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

export default GoalFormModal; 