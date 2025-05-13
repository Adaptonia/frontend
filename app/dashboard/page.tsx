'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Calendar, User, BookOpen, BarChart3 } from 'lucide-react'
import Image from 'next/image'
import { Toaster } from 'sonner'

// Custom components
import DashboardCalendar from '@/components/dashboard/Calendar'
import CategoryCard from '@/components/dashboard/CategoryCard'
import TaskItem from '@/components/dashboard/TaskItem'
import BottomNav from '@/components/dashboard/BottomNav'
  // import BottomNav from '@/components/reuseable/BottomNav'
import GoalFormModal from '@/components/goals/GoalFormModal'

// API
import { fetchGoals, toggleGoalComplete,  } from '@/lib/api/goals'
import { Goal } from '@/lib/types'

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Categories for the dashboard
  const categories = [
    { id: 'schedule', name: 'Schedule', icon: <Calendar className="w-5 h-5 text-teal-500" /> },
    { id: 'finance', name: 'Finance', icon: <BarChart3 className="w-5 h-5 text-green-500" /> },
    { id: 'career', name: 'Career', icon: <User className="w-5 h-5 text-blue-500" /> },
    { id: 'audio_books', name: 'Audio books', icon: <BookOpen className="w-5 h-5 text-gray-500" /> },
  ]

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await fetchGoals();
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    console.log('Selected date:', date)
    // Here you could fetch tasks for the selected date
  }

  const handleToggleComplete = async (goalId: string, completed: boolean) => {
    try {
      await toggleGoalComplete(goalId);
      
      // Update local state
      setGoals(goals.map(goal => 
        goal.id === goalId 
          ? { ...goal, isCompleted: !goal.isCompleted } 
          : goal
      ));
    } catch (error) {
      console.error('Error toggling goal completion:', error);
    }
  }

  const handleGoalClick = (goal: Goal) => {
    setActiveGoal(goal);
    setIsEditModalOpen(true);
  };

  const handleGoalUpdated = (updatedGoal: Goal) => {
    // Update the goal in the local state
    setGoals(goals.map(goal => 
      goal.id === updatedGoal.id ? updatedGoal : goal
    ));
    setActiveGoal(null);
  };

  // Count completed goals
  const completedGoals = goals.filter(goal => goal.isCompleted).length;

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      {/* Calendar Section */}
      <DashboardCalendar onDateSelect={handleDateSelect} />
      <div className="p-4">
        

        {/* Goal Metrics Card */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="text-blue-500 text-lg font-medium mb-3">Goal metrics</h2>
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">{completedGoals}</h3>
              <p className="text-gray-600">task{completedGoals !== 1 ? 's' : ''} completed</p>
              <p className="text-gray-500 text-sm mt-2">
                {goals.length === 0 
                  ? "You haven't created any tasks yet" 
                  : completedGoals === 0 
                    ? "You haven't completed any tasks yet" 
                    : "Great progress! Keep it up"}
              </p>
            </div>
            
            <div className="relative w-14 h-14 rounded-full border-4 border-gray-100 flex items-center justify-center">
              <Image 
                src="/icons/medal.png" 
                alt="Achievement medal" 
                width={30} 
                height={30} 
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Category Cards */}
        {categories.map((category) => (
          <CategoryCard 
            key={category.id}
            id={category.id}
            name={category.name} 
            icon={category.icon}
            onGoalCreated={loadGoals}
          >
            {/* Filter and show tasks that belong to this category */}
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading goals...</div>
            ) : goals.filter(goal => goal.category === category.id.toUpperCase()).length === 0 ? (
              <div className="p-4 text-center text-gray-500">No goals in this category yet</div>
            ) : (
              goals
                .filter(goal => goal.category === category.id.toUpperCase())
                .map(goal => (
                  <div 
                    key={goal.id} 
                    onClick={() => handleGoalClick(goal)}
                    className="cursor-pointer"
                  >
                    <TaskItem 
                      id={goal.id}
                      title={goal.title}
                      description={goal.description || ''}
                      dueDate={goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : undefined}
                      completed={goal.isCompleted}
                      onToggleComplete={(id, completed) => {
                        // Stop event propagation
                        event?.stopPropagation();
                        handleToggleComplete(id, completed);
                      }}
                    />
                  </div>
                ))
            )}
          </CategoryCard>
        ))}

        {/* Adaptonia Library Section */}
        <div className="bg-white rounded-xl mb-4 shadow-sm overflow-hidden">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-medium">Adaptonia Library</h3>
            </div>
          </div>
          
          <div className="bg-blue-100 p-4 flex items-center justify-between cursor-pointer hover:bg-blue-200 transition-colors">
            <div className="flex items-center">
              <Plus className="w-5 h-5 text-blue-500 mr-2" />
              <span className="font-medium">Create your Library</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
      
      {/* Goal Edit Modal */}
      {activeGoal && (
        <GoalFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setActiveGoal(null);
          }}
          onSave={handleGoalUpdated}
          initialData={activeGoal}
          category={categories.find(c => c.id.toUpperCase() === activeGoal.category)?.id || 'schedule'}
          mode="edit"
        />
      )}
      
      {/* Toast notifications */}
      <Toaster position="bottom-center" />
    </div>
  )
}

export default Dashboard 