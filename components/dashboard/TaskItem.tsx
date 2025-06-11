'use client'

import React, { useState } from 'react'
import { Clock, Trash2, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'

interface TaskItemProps {
  id: string
  title: string
  description?: string
  dueDate?: string
  completed?: boolean
  onToggleComplete?: (id: string) => void
  onDelete?: (id: string) => void
}

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

const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  description,
  dueDate,
  completed = false,
  onToggleComplete,
  onDelete
}) => {
  const [isCompleted, setIsCompleted] = useState(completed)

  const handleToggleComplete = () => {
    const newCompletedState = !isCompleted
    setIsCompleted(newCompletedState)
    if (onToggleComplete) {
      onToggleComplete(id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Delete button clicked for goal:', id)
    if (onDelete) {
      onDelete(id)
    }
  }

  return (
    <div className="bg-blue-50 p-4 m-2 rounded-lg relative group hover:bg-blue-100 transition-colors">
      <div className="flex items-start mb-2">
        <div className="mt-1 mr-3">
          <button 
            onClick={handleToggleComplete}
            className={`w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center transition-colors ${
              isCompleted ? 'bg-blue-500 border-blue-500' : ''
            }`}
          >
            {isCompleted && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 1L3.5 7L1 4.27273" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <div className="flex-1">
          <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-400' : ''}`}>
            {title}
          </h4>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {dueDate && (
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>{dueDate.includes('T00:00:00') ? formatDisplayDate(dueDate) : dueDate}</span>
            </div>
          )}
        </div>
        
        {/* Delete button - more visible for testing */}
        {onDelete && (
          <div className="ml-2 bg-red-50 border border-red-200 rounded">
            <button
              onClick={handleDelete}
              className="p-2 bg-red-100 hover:bg-red-200 rounded transition-all duration-200 group/delete"
              title="Delete goal"
            >
              <Trash2 size={16} className="text-red-600 group-hover/delete:text-red-700 transition-colors" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskItem 