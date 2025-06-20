'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Tag as TagIcon, Bell as BellIcon, Settings, Flag, Loader2, MapPin, Clock, Check, Hash } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ActionButtonProps, CreateGoalRequest, GoalFormModalProps, ModalTab, PremiumFeatureModalProps, Milestone, Goal } from '@/lib/types';
import MilestoneComponent from './MilestoneComponent';
import { reminderService } from '@/src/services/appwrite/reminderService';
import { useRouter } from 'next/navigation';
import { createGoal } from '@/src/services/appwrite/database';
import { updateGoal } from '@/src/services/appwrite';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { requestNotificationPermission, scheduleReminderNotificationWithAlarm } from '@/components/PWANotificationManager';
import { scheduleServerPushNotification } from '@/lib/push-notifications';
import { scheduleReminders } from '@/lib/utils/dateUtils';

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

interface GoalFormData {
  id?: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  milestones: Milestone[];
  reminderSettings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'custom';
    time: string;
    days: string[];
    customDate?: string;
  };
  simpleReminder: string;
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
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(initialData?.deadline);
  const [selectedTag, setSelectedTag] = useState('');
  const [reminder, setReminder] = useState<string | undefined>(initialData?.reminderDate);
  const [location, setLocation] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
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
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    try {
      if (initialData?.reminderSettings) {
        const parsed = JSON.parse(initialData.reminderSettings);
        return {
          enabled: parsed.enabled || false,
          interval: parsed.interval || 'daily',
          count: parsed.count || 7,
          time: parsed.time || '09:00',
          date: parsed.date || format(new Date(), 'yyyy-MM-dd')
        };
      }
    } catch (error) {
      console.error('Error parsing initial reminder settings:', error);
    }
    
    // Default settings
    return {
      enabled: false,
      interval: 'daily',
      count: 7,
      time: '09:00',
      date: format(new Date(), 'yyyy-MM-dd')
    };
  });
  
  // Drag to close functionality
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  
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
      
      // Set reminder settings if available
      if (initialData.reminderSettings) {
        try {
          const parsedSettings = JSON.parse(initialData.reminderSettings as string);
          setReminderSettings({
            enabled: parsedSettings.enabled || false,
            interval: parsedSettings.interval || 'daily',
            count: parsedSettings.count || 7,
            time: parsedSettings.time || '09:00',
            date: parsedSettings.date || format(new Date(), 'yyyy-MM-dd')
          });
        } catch (e) {
          console.error("Failed to parse reminder settings", e);
          // Reset to safe defaults
          setReminderSettings({
            enabled: false,
            interval: 'daily',
            count: 7,
            time: '09:00',
            date: format(new Date(), 'yyyy-MM-dd')
          });
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
      setMilestones([]);
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
  // Schedule milestone notifications
  const scheduleMilestoneNotifications = async (goalId: string, goalTitle: string) => {
    if (milestones.length === 0) return;
    
    try {
      console.log('📍 Scheduling milestone notifications for goal:', goalId);
      
      for (const milestone of milestones) {
        // Only schedule notifications for future milestones
        const milestoneDate = new Date(milestone.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
      
        if (milestoneDate >= today) {
          // Create milestone reminder at 9 AM in user's local timezone
          const reminderDateTime = new Date(milestone.date);
          reminderDateTime.setHours(9, 0, 0, 0); // 9:00 AM local time
          
          const reminderData = {
            goalId: `${goalId}-milestone-${milestone.id}`,
            userId: user?.id || 'system',
            title: `Milestone Due: ${milestone.title}`,
            description: `Time to work on "${milestone.title}" for your goal "${goalTitle}". ${milestone.description || ''}`,
            sendDate: reminderDateTime.toISOString(), // Proper ISO string in user's timezone
            dueDate: milestoneDate.toISOString() // Milestone due date as ISO string
          };

          await reminderService.createReminder(reminderData);
          console.log(`✅ Milestone notification scheduled: ${milestone.title} at ${reminderDateTime.toLocaleString()}`);
        }
      }

      if (milestones.filter(m => new Date(m.date) >= new Date()).length > 0) {
        toast.success('Milestone notifications scheduled', {
          description: `You'll be reminded at 9 AM on milestone dates`
        });
      }
    } catch (error) {
      console.error('❌ Error scheduling milestone notifications:', error);
      toast.error('Failed to schedule milestone notifications');
      }
  };

  const handleSubmit = async (data: GoalFormData) => {
    try {
      setIsSubmitting(true);
      console.log('🔄 GOAL FORM: Form submitted with data:', data);

      if (data.id) {
        console.log('🔄 GOAL FORM: Updating existing goal with ID:', data.id);
        
        await updateGoal(data.id, {
          title: data.title,
          description: data.description,
          category: data.category as any,
          deadline: data.dueDate,
          milestones: JSON.stringify(data.milestones),
          reminderSettings: JSON.stringify(data.reminderSettings)
        });
        
        console.log('✅ GOAL FORM: Goal updated successfully');

        // 🚀 SIMPLIFIED REMINDER FLOW - Let Appwrite Functions handle everything
        console.log('🔍 GOAL FORM: Checking if reminders should be scheduled...');
        
        const hasAdvancedReminders = data.reminderSettings.enabled;
        const hasSimpleReminder = data.simpleReminder && data.simpleReminder.trim() !== '';
        
        if (hasAdvancedReminders || hasSimpleReminder) {
          console.log('🎯 GOAL FORM: Scheduling reminders via server-side function');
          
          // Only use server-side scheduling - no client conflicts
          await scheduleReminders(
            data.id,
            data.reminderSettings,
            data.simpleReminder,
            user
          );
          
          console.log('✅ GOAL FORM: Server-side reminders scheduled successfully');
          toast.success('Goal updated and reminders scheduled! 🚀');
        } else {
          console.log('ℹ️ GOAL FORM: No reminders to schedule');
          toast.success('Goal updated successfully!');
        }

        // Create goal object for callback
        const updatedGoal: Goal = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category as any,
          deadline: data.dueDate,
          milestones: JSON.stringify(data.milestones),
          reminderSettings: JSON.stringify(data.reminderSettings),
          userId: user?.id || '',
          createdAt: initialData?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isCompleted: false
        };

        onSave?.(updatedGoal);
      } else {
        console.log('🔄 GOAL FORM: Creating new goal');
        
        const newGoal = await createGoal({
          title: data.title,
          description: data.description,
          category: data.category as any,
          deadline: data.dueDate,
          milestones: JSON.stringify(data.milestones),
          reminderSettings: JSON.stringify(data.reminderSettings)
        }, user?.id || '');
        
        console.log('✅ GOAL FORM: Goal created successfully with ID:', newGoal.id);

        // 🚀 SIMPLIFIED REMINDER FLOW - Server-side only
        const hasAdvancedReminders = data.reminderSettings.enabled;
        const hasSimpleReminder = data.simpleReminder && data.simpleReminder.trim() !== '';
        
        if (hasAdvancedReminders || hasSimpleReminder) {
          console.log('🎯 GOAL FORM: Scheduling reminders for new goal');
          
          await scheduleReminders(
            newGoal.id,
            data.reminderSettings,
            data.simpleReminder,
            user
          );
          
          console.log('✅ GOAL FORM: New goal reminders scheduled successfully');
          toast.success('Goal created and reminders scheduled! 🚀');
        } else {
          console.log('ℹ️ GOAL FORM: No reminders for new goal');
          toast.success('Goal created successfully!');
        }

        // Create goal object for callback
        const createdGoal: Goal = {
          id: newGoal.id,
          title: data.title,
          description: data.description,
          category: data.category as any,
          deadline: data.dueDate,
          milestones: JSON.stringify(data.milestones),
          reminderSettings: JSON.stringify(data.reminderSettings),
          userId: user?.id || '',
          createdAt: newGoal.createdAt || new Date().toISOString(),
          updatedAt: newGoal.updatedAt || new Date().toISOString(),
          isCompleted: false
        };

        onSave?.(createdGoal);
      }

      onClose();
    } catch (error) {
      console.error('❌ GOAL FORM: Error saving goal:', error);
      toast.error('Failed to save goal. Please try again.');
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
          <div 
            className={`w-16 h-1 rounded-full cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'bg-blue-400 w-20 h-1.5' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={onClose}
          ></div>
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
          className={`w-full mb-2 text-xl font-medium border-none outline-none mobile-input-fix ${validationError ? 'text-red-500' : ''}`}
        />
        {validationError && <p className="text-red-500 text-sm mb-4">{validationError}</p>}
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full min-h-[150px] mb-6 text-gray-500 border-none outline-none resize-none mobile-input-fix"
        />
        
        {/* Milestone Component - Show after description is written */}
        {description.trim() && (
          <MilestoneComponent
            milestones={milestones}
            onMilestonesChange={setMilestones}
          />
        )}
      </div>
      
      {/* Add Task button - fixed at bottom */}
      <div className="mt-auto p-5 border-t">
        <button 
          onClick={() => handleSubmit({
            id: initialData?.id,
            title,
            description,
            category,
            dueDate: selectedDate || '',
            milestones,
            reminderSettings: {
              enabled: reminderSettings.enabled,
              frequency: 'daily',
              time: reminderSettings.time,
              days: [],
              customDate: reminderSettings.date
            },
            simpleReminder: reminder || ''
          })} 
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
                    className={`p-2 rounded-lg border ${
                      reminderSettings.interval === interval 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {interval.charAt(0).toUpperCase() + interval.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Number of Reminders (for recurring) */}
            {reminderSettings.interval !== 'once' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Hash className="mr-2" size={16} />
                  Number of Reminders
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="flex-1 p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={reminderSettings.count}
                    onChange={(e) => {
                      const count = Math.min(30, Math.max(1, parseInt(e.target.value) || 1));
                      setReminderSettings(prev => ({...prev, count}));
                    }}
                  />
                  <div className="text-sm text-gray-500">
                    {reminderSettings.interval === 'daily' ? 'days' :
                     reminderSettings.interval === 'weekly' ? 'weeks' :
                     reminderSettings.interval === 'biweekly' ? 'bi-weeks' :
                     'months'}
                </div>
                </div>
                <p className="text-xs text-gray-500">How many times should this reminder repeat?</p>
              </div>
            )}
            
            {/* Preview Section */}
            <div className="p-4 rounded-lg bg-gray-50 mt-6">
              <h4 className="font-medium mb-2">Reminder Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2" />
                  <span>
                    {(() => {
                      try {
                        if (!reminderSettings.date) {
                          return 'No date selected';
                        }
                        const date = new Date(reminderSettings.date);
                        if (isNaN(date.getTime())) {
                          return 'Invalid date';
                        }
                        return format(date, 'EEEE, MMMM d, yyyy');
                      } catch (error) {
                        console.error('Date formatting error:', error);
                        return 'Invalid date';
                      }
                    })()}
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
                
                // Log for debugging
                console.log('🕒 Setting tomorrow reminder for local time:', tomorrow.toLocaleString());
                console.log('🌍 UTC time will be:', tomorrow.toISOString());
                
                setReminderSettings({
                  enabled: true,
                  interval: "once",
                  count: 1,
                  time: "09:00",
                  date: format(tomorrow, 'yyyy-MM-dd')
                });
                
                toast.success(`Reminder set for tomorrow at ${tomorrow.toLocaleTimeString()}`);
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
                
                // Log for debugging
                console.log('🕒 Setting evening reminder for local time:', today.toLocaleString());
                console.log('🌍 UTC time will be:', today.toISOString());
                
                setReminderSettings({
                  enabled: true,
                  interval: "once",
                  count: 1,
                  time: "18:00",
                  date: format(today, 'yyyy-MM-dd')
                });
                
                toast.success(`Reminder set for today at ${today.toLocaleTimeString()}`);
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
                {(() => {
                  try {
                    const nextWeekDate = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
                    return format(nextWeekDate, 'EEE, MMM d');
                  } catch (error) {
                    console.error('Next week date formatting error:', error);
                    return 'Next week';
                  }
                })()}
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
              try {
                // Set the reminder date from the reminder settings
                if (reminderSettings.date && reminderSettings.time) {
                  // Create date in local time zone
                  const [hours, minutes] = reminderSettings.time.split(':');
                  const reminderDate = new Date(reminderSettings.date);
                  reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                  // Log for debugging
                  console.log('🕒 Setting reminder for local time:', reminderDate.toLocaleString());
                  console.log('🌍 UTC time will be:', reminderDate.toISOString());

                  if (!isNaN(reminderDate.getTime())) {
                    // Store in ISO format (will be converted to UTC)
                    setReminder(reminderDate.toISOString());
                    
                    // Show toast with local time
                    toast.success(`Reminder set for ${reminderDate.toLocaleTimeString()}`, {
                      description: `${reminderDate.toLocaleDateString()}`
                    });
                  } else {
                    console.error('Invalid reminder date/time combination');
                    toast.error('Invalid reminder date/time');
                    return;
                  }
                } else {
                  console.error('Missing reminder date or time');
                  toast.error('Please set both date and time for reminder');
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
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse event handlers (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY);
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
