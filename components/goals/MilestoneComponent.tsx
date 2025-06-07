'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Target, Trash2 } from 'lucide-react';
import { Milestone, MilestoneComponentProps } from '@/lib/types';
import { format } from 'date-fns';
import { reminderService } from '@/src/services/appwrite/reminderService';
import { toast } from 'sonner';

const MilestoneComponent: React.FC<MilestoneComponentProps> = ({
  milestones,
  onMilestonesChange
}) => {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{id: string, field: 'title' | 'date'} | null>(null);

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'M/d/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Auto-generate 6 milestones when component mounts if no milestones exist
  useEffect(() => {
    if (milestones.length === 0) {
      const defaultMilestones: Milestone[] = [];
      const today = new Date();
      
      // Generic milestone titles that work for any goal type
      const genericTitles = [
        "Planning and preparation",
        "Initial progress milestone", 
        "Quarter progress checkpoint",
        "Halfway progress milestone",
        "Three-quarter milestone",
        "Final completion milestone"
      ];
      
      for (let i = 1; i <= 6; i++) {
        const milestoneDate = new Date(today);
        milestoneDate.setDate(today.getDate() + (i * 30)); // 30 days apart
        
        defaultMilestones.push({
          id: generateId(),
          title: genericTitles[i - 1],
          description: '',
          date: milestoneDate.toISOString().split('T')[0],
          isCompleted: false
        });
      }
      
      onMilestonesChange(defaultMilestones);
    }
  }, [milestones.length, onMilestonesChange]);

  const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
    const updatedMilestones = milestones.map(milestone =>
      milestone.id === id ? { ...milestone, ...updates } : milestone
    );
    onMilestonesChange(updatedMilestones);
    
    // Update notification if date or title changed
    if (updates.date || updates.title) {
      const updatedMilestone = updatedMilestones.find(m => m.id === id);
      if (updatedMilestone) {
        try {
          // Cancel existing notification
          const milestoneGoalId = `goal-milestone-${id}`;
          const existingReminders = await reminderService.getRemindersByGoalId(milestoneGoalId);
          
          for (const reminder of existingReminders) {
            await reminderService.deleteReminder(reminder.id);
          }
          
          // Schedule new notification if date is in the future
          const milestoneDate = new Date(updatedMilestone.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (milestoneDate >= today) {
            await reminderService.createReminder({
              goalId: milestoneGoalId,
              userId: 'system',
              title: `Milestone Due: ${updatedMilestone.title}`,
              description: `Time to work on your milestone. ${updatedMilestone.description || ''}`,
              sendDate: updatedMilestone.date + 'T09:00:00.000Z',
              dueDate: updatedMilestone.date
            });
            
            console.log('✅ Milestone notification updated');
          }
        } catch (error) {
          console.error('❌ Error updating milestone notification:', error);
        }
      }
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedMilestone(expandedMilestone === id ? null : id);
  };

  const handleFieldEdit = (id: string, field: 'title' | 'date') => {
    setEditingField({ id, field });
  };

  const handleFieldSave = () => {
    setEditingField(null);
  };

  const deleteMilestone = async (id: string) => {
    try {
      // Remove milestone from array
      const updatedMilestones = milestones.filter(milestone => milestone.id !== id);
      onMilestonesChange(updatedMilestones);

      // Cancel notification for this milestone
      const milestoneGoalId = `goal-milestone-${id}`;
      const existingReminders = await reminderService.getRemindersByGoalId(milestoneGoalId);
      
      for (const reminder of existingReminders) {
        await reminderService.deleteReminder(reminder.id);
      }

      toast.success('Milestone deleted', {
        description: 'Milestone and its notifications removed'
      });

      console.log('✅ Milestone deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting milestone:', error);
      toast.error('Failed to delete milestone');
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center text-gray-800">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 shadow-sm">
            <Target size={16} className="text-blue-600" />
          </div>
          Milestones
        </h3>
      </div>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200"></div>
        
        <div className="space-y-6">
          {milestones.map((milestone, index) => (
                         <div 
               key={milestone.id} 
               className="relative group transition-all duration-300 ease-in-out"
             >
                             {/* Milestone row */}
               <div className="flex items-center transition-all duration-300 ease-in-out">
                {/* Dot bullet point */}
                <div className="relative z-10 w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mr-4 flex-shrink-0 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-110"></div>
                
                {/* Title */}
                <div className="flex-1 min-w-0">
                  {editingField?.id === milestone.id && editingField?.field === 'title' ? (
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                      onBlur={handleFieldSave}
                      onKeyPress={(e) => e.key === 'Enter' && handleFieldSave()}
                      className="font-medium text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none w-full transition-all duration-200 focus:border-blue-600"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-200 block truncate"
                      onClick={() => handleFieldEdit(milestone.id, 'title')}
                      title={milestone.title}
                    >
                      {milestone.title}
                    </span>
                  )}
                </div>
                
                {/* Date */}
                <div className="mx-4 flex-shrink-0">
                  {editingField?.id === milestone.id && editingField?.field === 'date' ? (
                    <input
                      type="date"
                      value={milestone.date}
                      onChange={(e) => updateMilestone(milestone.id, { date: e.target.value })}
                      onBlur={handleFieldSave}
                      className="text-sm text-gray-500 bg-transparent border-b-2 border-blue-500 outline-none transition-all duration-200 focus:border-blue-600"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-50"
                      onClick={() => handleFieldEdit(milestone.id, 'date')}
                    >
                      {formatDate(milestone.date)}
                    </span>
                  )}
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMilestone(milestone.id);
                  }}
                  className="ml-2 p-2 hover:bg-red-50 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-95 group"
                  title="Delete milestone"
                >
                  <Trash2 size={14} className="text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
                </button>

                {/* Expand/Collapse button */}
                <button
                  onClick={() => toggleExpanded(milestone.id)}
                  className="ml-1 p-2 hover:bg-gray-100 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-95"
                >
                  <div className="transform transition-transform duration-300 ease-in-out">
                    {expandedMilestone === milestone.id ? (
                      <ChevronUp size={16} className="text-gray-400 transition-colors duration-200 hover:text-gray-600" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 transition-colors duration-200 hover:text-gray-600" />
                    )}
                  </div>
                </button>
              </div>

              {/* Expanded description section with smooth animation */}
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedMilestone === milestone.id 
                    ? 'max-h-40 opacity-100 mt-3' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-8 transform transition-all duration-300 ease-in-out">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 shadow-sm border border-blue-100">
                    <textarea
                      value={milestone.description || ''}
                      onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                      placeholder="Apply what you've learned through exercises and simple projects."
                      className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 focus:text-gray-900"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MilestoneComponent; 