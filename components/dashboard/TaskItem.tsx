'use client'

import React, { useState } from 'react'
import { Clock } from 'lucide-react'

interface TaskItemProps {
  id: string
  title: string
  description?: string
  dueDate?: string
  completed?: boolean
  onToggleComplete?: (id: string, completed: boolean) => void
}

const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  description,
  dueDate,
  completed = false,
  onToggleComplete
}) => {
  const [isCompleted, setIsCompleted] = useState(completed)

  const handleToggleComplete = () => {
    const newCompletedState = !isCompleted
    setIsCompleted(newCompletedState)
    onToggleComplete?.(id, newCompletedState)
  }

  return (
    <div className="bg-blue-50 p-4 m-2 rounded-lg">
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
        <div>
          <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-400' : ''}`}>
            {title}
          </h4>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {dueDate && (
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>{dueDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskItem 