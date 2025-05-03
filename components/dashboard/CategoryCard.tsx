'use client'

import React, { ReactNode, useState } from 'react'
import { Plus } from 'lucide-react'
import GoalFormModal from '../goals/GoalFormModal'
import { toast } from 'sonner'
import { Goal } from '@/lib/types'

interface CategoryCardProps {
  name: string
  id: string
  icon: ReactNode
  children?: ReactNode
  onGoalCreated?: () => void
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  name, 
  id,
  icon, 
  children, 
  onGoalCreated 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleGoalSaved = (savedGoal: Goal) => {
    console.log('Goal saved:', savedGoal);
    // Trigger a refresh of goals in the parent component
    if (onGoalCreated) {
      onGoalCreated();
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl mb-4 shadow-sm overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-gray-100 p-2 rounded-full mr-3">
              {icon}
            </div>
            <h3 className="font-medium">{name}</h3>
          </div>
          <button 
            className="text-blue-400 hover:text-blue-600 transition-colors"
            onClick={handleAddClick}
            aria-label={`Add new ${name} goal`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {children && children}
      </div>

      <GoalFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleGoalSaved}
        category={id}
        mode="create"
      />
    </>
  )
}

export default CategoryCard 