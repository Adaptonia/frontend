'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Target, Trash2, Type, List, Check } from 'lucide-react';
import { Milestone, MilestoneComponentProps } from '@/lib/types';
import { format } from 'date-fns';
import { reminderService } from '@/src/services/appwrite/reminderService';
import { toast } from 'sonner';

const MilestoneComponent: React.FC<MilestoneComponentProps> = ({
  milestones,
  onMilestonesChange
}) => {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{id: string, field: 'title' | 'date' | 'description'} | null>(null);

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

  // Manual formatting functions
  const formatAsParagraph = (text: string): string => {
    if (!text) return '';
    const trimmed = text.trim();
    if (!trimmed) return '';
    
    // Split by lines and format each as a sentence
    return trimmed.split('\n').map(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return '';
      // Add period if doesn't end with punctuation
      return cleanLine.endsWith('.') || cleanLine.endsWith('!') || cleanLine.endsWith('?') 
        ? cleanLine 
        : `${cleanLine}.`;
    }).filter(line => line).join('\n');
  };

  const formatAsBulletList = (text: string): string => {
    if (!text) return '';
    const trimmed = text.trim();
    if (!trimmed) return '';
    
    // Split by lines and format each as a bullet point
    return trimmed.split('\n').map(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return '';
      
      // If line doesn't start with bullet point, add one
      if (!/^[•·\-\*]/.test(cleanLine)) {
        const withPeriod = cleanLine.endsWith('.') || cleanLine.endsWith('!') || cleanLine.endsWith('?') 
          ? cleanLine 
          : `${cleanLine}.`;
        return `• ${withPeriod}`;
      }
      
      // If it has bullet but no ending punctuation, add period
      return cleanLine.endsWith('.') || cleanLine.endsWith('!') || cleanLine.endsWith('?') 
        ? cleanLine 
        : `${cleanLine}.`;
    }).filter(line => line).join('\n');
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

  const handleFieldEdit = (id: string, field: 'title' | 'date' | 'description') => {
    setEditingField({ id, field });
  };

  const handleFieldSave = () => {
    setEditingField(null);
  };

  const handleFormatDescription = (id: string, formatType: 'paragraph' | 'bullets') => {
    const milestone = milestones.find(m => m.id === id);
    if (!milestone || !milestone.description) return;

    const formattedDescription = formatType === 'paragraph' 
      ? formatAsParagraph(milestone.description)
      : formatAsBulletList(milestone.description);

    updateMilestone(id, { description: formattedDescription });
    toast.success(`Description formatted as ${formatType === 'paragraph' ? 'sentences' : 'bullet list'}`);
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

  const toggleMilestoneCompletion = async (id: string) => {
    const milestone = milestones.find(m => m.id === id);
    if (!milestone) return;

    const newCompletionStatus = !milestone.isCompleted;
    await updateMilestone(id, { isCompleted: newCompletionStatus });

    // Show appropriate toast message
    if (newCompletionStatus) {
      toast.success('Milestone completed! 🎉', {
        description: `Great progress on "${milestone.title}"`
      });
    } else {
      toast.success('Milestone marked as incomplete', {
        description: `"${milestone.title}" needs more work`
      });
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
        
        {/* Progress indicator */}
        {milestones.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {milestones.filter(m => m.isCompleted).length} of {milestones.length} completed
            </div>
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
                style={{ 
                  width: `${milestones.length > 0 ? (milestones.filter(m => m.isCompleted).length / milestones.length) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Manual formatting info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-600">
          💡 <strong>Progress:</strong> Check the boxes to mark milestones as complete. Click to edit titles, dates, and descriptions. Formatting buttons help organize your text.
        </p>
      </div>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200"></div>
        
        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div 
              key={milestone.id} 
              className="relative group transition-all duration-300 ease-in-out"
            >
              {/* Milestone row */}
              <div className="flex items-center transition-all duration-300 ease-in-out">
                {/* Checkbox for completion */}
                <div className="relative z-10 mr-3 flex-shrink-0">
                  <button
                    onClick={() => toggleMilestoneCompletion(milestone.id)}
                    className={`
                      w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                      ${milestone.isCompleted 
                        ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }
                    `}
                    title={milestone.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {milestone.isCompleted && (
                      <Check size={12} className="text-white" />
                    )}
                  </button>
                </div>

                {/* Dot bullet point */}
                <div className={`
                  relative z-10 w-4 h-4 rounded-full mr-4 flex-shrink-0 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-110
                  ${milestone.isCompleted 
                    ? 'bg-gradient-to-br from-green-400 to-green-600' 
                    : 'bg-gradient-to-br from-blue-400 to-blue-600'
                  }
                `}></div>
                
                {/* Title */}
                <div className="flex-1 min-w-0">
                  {editingField?.id === milestone.id && editingField?.field === 'title' ? (
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                      onBlur={handleFieldSave}
                      onKeyPress={(e) => e.key === 'Enter' && handleFieldSave()}
                      className="font-medium text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none w-full transition-all duration-200 focus:border-blue-600 mobile-input-fix"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className={`
                        font-medium cursor-pointer transition-colors duration-200 block truncate
                        ${milestone.isCompleted 
                          ? 'text-gray-500 line-through hover:text-gray-700' 
                          : 'text-gray-900 hover:text-blue-600'
                        }
                      `}
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
                      className="text-sm text-gray-500 bg-transparent border-b-2 border-blue-500 outline-none transition-all duration-200 focus:border-blue-600 mobile-input-fix"
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

              {/* Description display for milestones with description */}
              {milestone.description && (
                <div className="ml-14 mt-2">
                  <div className="rounded-lg p-4 border">
                    {editingField?.id === milestone.id && editingField?.field === 'description' ? (
                      <>
                        {/* Formatting buttons - only show when editing */}
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => handleFormatDescription(milestone.id, 'paragraph')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Format as sentences"
                          >
                            <Type size={12} />
                            Sentences
                          </button>
                          <button
                            onClick={() => handleFormatDescription(milestone.id, 'bullets')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Format as bullet list"
                          >
                            <List size={12} />
                            Bullets
                          </button>
                        </div>

                        <textarea
                          value={milestone.description}
                          onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                          onBlur={handleFieldSave}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleFieldSave();
                            }
                          }}
                          className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-700 focus:text-gray-900 mobile-input-fix"
                          rows={3}
                          autoFocus
                          placeholder="Enter details. Use formatting buttons above to organize your text."
                        />
                      </>
                    ) : (
                      <div 
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer hover:text-gray-900 transition-colors duration-200"
                        onClick={() => handleFieldEdit(milestone.id, 'description')}
                        title="Click to edit description"
                      >
                        {milestone.description.split('\n').map((line, lineIndex) => (
                          <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Expanded description editor for milestones without description */}
              {!milestone.description && expandedMilestone === milestone.id && (
                <div 
                  className="overflow-hidden transition-all duration-500 ease-in-out max-h-40 opacity-100 mt-3"
                >
                  <div className="ml-14 transform transition-all duration-300 ease-in-out">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 shadow-sm border border-blue-100">
                      {/* Formatting buttons for new descriptions */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => handleFormatDescription(milestone.id, 'paragraph')}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-white hover:bg-gray-50 rounded transition-colors border"
                          title="Format as sentences"
                        >
                          <Type size={12} />
                          Sentences
                        </button>
                        <button
                          onClick={() => handleFormatDescription(milestone.id, 'bullets')}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-white hover:bg-gray-50 rounded transition-colors border"
                          title="Format as bullet list"
                        >
                          <List size={12} />
                          Bullets
                        </button>
                      </div>

                      <textarea
                        value={milestone.description || ''}
                        onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                        placeholder="Enter your milestone details. Use formatting buttons above to organize your text."
                        className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 focus:text-gray-900 mobile-input-fix"
                        rows={3}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MilestoneComponent; 
