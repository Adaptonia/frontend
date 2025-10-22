'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Calendar, User, BookOpen, BarChart3, Edit3, GraduationCap, Briefcase, ChevronDown, Share2, Users, Crown } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuth } from '@/context/AuthContext'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useRouter } from 'next/navigation';

// Custom components
import DashboardCalendar from '@/components/dashboard/Calendar'
import CategoryCard from '@/components/dashboard/CategoryCard'
import TaskItem from '@/components/dashboard/TaskItem'
import BottomNav from '@/components/dashboard/BottomNav'
import GoalFormModal from '@/components/goals/GoalFormModal'
import GoalPackEditModal from '@/components/goals/GoalPackEditModal'
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal'
import UserTypeSelectionModal from '@/components/UserTypeSelectionModal'

// Appwrite services
import { getGoals, toggleGoalCompletion, deleteGoal } from '../../services/appwrite/database'
import { Goal, UserType, Milestone, GoalPack, LibraryItem } from '@/lib/types'
import GoalPackModal from '@/components/admin/GoalPackModal'
import { getAllGoalPacks, getGoalPacksForUserType } from '@/services/appwrite/goalPackService'
import LibraryModal from '@/components/library/LibraryModal'
import LibraryItemCard from '@/components/library/LibraryItemCard'
import { getLibraryItems, deleteLibraryItem, toggleLibraryItemFavorite, toggleLibraryItemCompletion } from '@/services/appwrite/libraryService'
import { hasCompletedUserTypeSelection, updateUserType } from '@/services/appwrite/userService'
import OfflineStatusIndicator from '@/components/OfflineStatusIndicator'
import ShareModal from '@/components/ShareModal'

// Partner Accountability Components
import PartnerPreferencesForm from '@/components/partnership/PartnerPreferencesForm'
import ExpertMatchingInterface from '@/components/partnership/ExpertMatchingInterface'
import PartnerDashboard from '@/components/partnership/PartnerDashboard'
import { partnershipService } from '@/services/appwrite/partnershipService'
import partnerMatchingService from '@/services/partnerMatchingService'
import { Partnership, PartnershipPreferences } from '@/database/partner-accountability-schema'

// Expert Task Components
import UserExpertTasks from '@/components/expert/UserExpertTasks'


const Dashboard = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [goalPacks, setGoalPacks] = useState<GoalPack[]>([])
  const [userGoalPacks, setUserGoalPacks] = useState<GoalPack[]>([])
  const [isGoalPackModalOpen, setIsGoalPackModalOpen] = useState(false)
  const [activeGoalPack, setActiveGoalPack] = useState<GoalPack | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [goalPackToShare, setGoalPackToShare] = useState<GoalPack | null>(null);
  const [isGoalPackEditModalOpen, setIsGoalPackEditModalOpen] = useState(false)
  const [editingGoalPack, setEditingGoalPack] = useState<GoalPack | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false)
  const [activeLibraryItem, setActiveLibraryItem] = useState<LibraryItem | null>(null)
  const [expandedUserType, setExpandedUserType] = useState<string | null>(null)
  const [showAllGoalPacks, setShowAllGoalPacks] = useState(false)
  
  // User type selection states
  const [showUserTypeModal, setShowUserTypeModal] = useState(false)
  const [hasCheckedUserType, setHasCheckedUserType] = useState(false)

  // Partner Accountability states
  const [showPartnerPreferences, setShowPartnerPreferences] = useState(false)
  const [showPartnerMatching, setShowPartnerMatching] = useState(false)
  const [showPartnerDashboard, setShowPartnerDashboard] = useState(false)
  const [userPartnership, setUserPartnership] = useState<Partnership | null>(null)
  const [userPreferences, setUserPreferences] = useState<PartnershipPreferences | null>(null)
  const [partnershipLoading, setPartnershipLoading] = useState(false)
  
  const { user, loading: authLoading } = useRequireAuth()
  const { updateUser } = useAuth()
  const isAdmin = useIsAdmin();
  const router = useRouter();
  
  // Categories for the dashboard
  const categories = [
    { id: 'schedule', name: 'Schedule', icon: <Calendar className="w-5 h-5 text-teal-500" /> },
    { id: 'finance', name: 'Finance', icon: <BarChart3 className="w-5 h-5 text-green-500" /> },
    { id: 'career', name: 'Career', icon: <User className="w-5 h-5 text-blue-500" /> },
    { id: 'audio_books', name: 'Audio books', icon: <BookOpen className="w-5 h-5 text-gray-500" /> },
  ]

  // Calculate completed goals for metrics
  const completedGoals = goals.filter(goal => goal.isCompleted).length

  // Check if user needs to complete user type selection
  useEffect(() => {
    const checkUserTypeCompletion = async () => {
      if (!user?.id || user?.role === 'admin' || hasCheckedUserType) return;
      
      try {
        const hasCompleted = await hasCompletedUserTypeSelection(user.id);
        if (!hasCompleted) {
          setShowUserTypeModal(true);
        }
        setHasCheckedUserType(true);
      } catch (error) {
        console.error('Failed to check user type completion:', error);
        setHasCheckedUserType(true);
      }
    };

    if (!authLoading && user) {
      checkUserTypeCompletion();
    }
  }, [authLoading, user, hasCheckedUserType]);

  // Load goals when user is available
  useEffect(() => {
    if (user && !authLoading) {
      console.log("📊 User authenticated, loading goals for:", user.email);
      loadGoals();
      loadLibraryItems();
      loadPartnershipData();
      // Load goal packs if user is admin
      if (user.role === 'admin') {
        loadGoalPacks();
      }
      // Load user-specific goal packs for regular users
      if (user.userType && user.userType !== null) {
        console.log('🎯 User has userType:', user.userType, '- Loading goal packs...');
        loadUserGoalPacks();
      } else {
        console.log('⚠️ User userType not set:', user.userType);
      }
    }
  }, [user, authLoading]);

  // Reload goal packs when user type changes
  useEffect(() => {
    if (user?.userType && !authLoading) {
      console.log('🔄 User type changed to:', user.userType, '- Reloading goal packs...');
      loadUserGoalPacks();
    }
  }, [user?.userType]);

  // Show loading state while authenticating
  // if (authLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-100 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  const loadGoals = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await getGoals(user.id);
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoalPacks = async () => {
    try {
      const data = await getAllGoalPacks();
      setGoalPacks(data);
    } catch (error) {
      console.error('Error fetching goal packs:', error);
    }
  };

  const loadUserGoalPacks = async () => {
    if (!user?.userType) return;

    try {
      const data = await getGoalPacksForUserType(user.userType);
      setUserGoalPacks(data);
    } catch (error) {
      console.error('Error fetching user goal packs:', error);
    }
  };

  const loadPartnershipData = async () => {
    if (!user?.id) return;

    try {
      setPartnershipLoading(true);

      // Load user's partnership
      const partnership = await partnershipService.getUserPartnership(user.id);
      setUserPartnership(partnership);

      // Load user's partner preferences
      const preferences = await partnershipService.getPartnerPreferences(user.id);
      setUserPreferences(preferences);

      console.log('Partnership data loaded:', {
        hasPartnership: !!partnership,
        hasPreferences: !!preferences
      });
    } catch (error) {
      // Only log actual errors, not "document not found" cases
      if (error instanceof Error && !error.message.includes('Document with the requested ID could not be found')) {
        console.error('Error loading partnership data:', error);
      }
      // Set defaults for missing data
      setUserPartnership(null);
      setUserPreferences(null);
    } finally {
      setPartnershipLoading(false);
    }
  };

  const handleUserTypeComplete = async (userType: UserType, schoolName?: string) => {
    if (!user?.id) return;

    try {
      await updateUserType({
        userId: user.id,
        userType,
        schoolName
      });

      // Update the user context immediately
      updateUser({
        userType,
        schoolName,
        hasCompletedUserTypeSelection: true
      });

      setShowUserTypeModal(false);

      // Show success message
      if (userType === 'student') {
        toast.success("Welcome, Student! 🎓", {
          description: `We've noted that you attend ${schoolName}. Your experience is now personalized for students.`
        });
      } else {
        toast.success("Profile Updated! 💼", {
          description: "Your experience is now personalized for working professionals."
        });
      }
    } catch (error) {
      console.error('Failed to update user type:', error);
      toast.error("Failed to update profile", {
        description: "Please try again later."
      });
    }
  };

  // Partner Accountability Handlers
  const handlePartnerPreferencesSaved = async (preferences: PartnershipPreferences) => {
    setUserPreferences(preferences);
    setShowPartnerPreferences(false);
    toast.success('Partner preferences saved! Ready to find your accountability partner.');
  };

  const handlePartnershipCreated = async (partnership: Partnership) => {
    setUserPartnership(partnership);
    setShowPartnerMatching(false);
    loadPartnershipData(); // Reload partnership data
    // toast.success('🎉 Partnership created! Check your email for details.');
  };

  const handleFindPartner = async () => {
    if (!user?.id) return;

    if (!userPreferences) {
      setShowPartnerPreferences(true);
      return;
    }

    setShowPartnerMatching(true);
  };

  const handleUserTypeModalClose = () => {
    // Only allow closing if user is admin (they don't need to complete this)
    if (user?.role === 'admin') {
      setShowUserTypeModal(false);
    }
    // For regular users, the modal stays open until they complete the selection
  };



  const handleGoalPackSaved = (savedGoalPack: GoalPack) => {
    // Update the goal packs list
    setGoalPacks(goalPacks.map(pack => 
      pack.id === savedGoalPack.id ? savedGoalPack : pack
    ));
    setActiveGoalPack(null);
  };

  const handleEditGoalPack = (goalPack: GoalPack) => {
    setEditingGoalPack(goalPack);
    setIsGoalPackEditModalOpen(true);
  };

  const handleGoalPackEdited = (savedGoal: any) => {
    // Update goals list with the new customized goal
    setGoals([...goals, savedGoal]);
    setEditingGoalPack(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setGoalToDelete(goal);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteGoal = async () => {
    if (!user?.id || !goalToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteGoal(goalToDelete.id, user.id);
      
      // Remove goal from local state
      setGoals(goals.filter(goal => goal.id !== goalToDelete.id));
      
      toast.success('Goal deleted successfully');
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // console.log('Selected date:', date)
    // Here you could filter tasks for the selected date
  }

  const handleToggleComplete = async (goalId: string) => {
    if (!user?.id) return;
    
    try {
      const updatedGoal = await toggleGoalCompletion(goalId, user.id);
      
      // Update local state
      setGoals(goals.map(goal => 
        goal.id === goalId ? updatedGoal : goal
      ));
    } catch (error) {
      console.error('Error toggling goal completion:', error);
    }
  }

  const handleGoalClick = (goal: Goal) => {
    console.log('Goal clicked:', goal);
  console.log('Goal has properties:', Object.keys(goal));
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

  // Helper function to format category for filtering
  const formatCategoryForFiltering = (categoryId: string): string => {
    const lowercaseCategory = categoryId.toLowerCase();
    
    switch (lowercaseCategory) {
      case 'schedule':
        return 'schedule';
      case 'finance':
        return 'finance';
      case 'career':
        return 'career';
      case 'audio_books':
        return 'audio_books';
      default:
        return lowercaseCategory;
    }
  };

  // Helper function to get goal packs for a specific category
  const getGoalPacksForCategory = (categoryId: string): GoalPack[] => {
    const formattedCategory = formatCategoryForFiltering(categoryId);
    return userGoalPacks.filter(pack => pack.category === formattedCategory);
  };

  const loadLibraryItems = async () => {
    if (!user?.id) return;
    
    try {
      const data = await getLibraryItems(user.id);
      setLibraryItems(data);
    } catch (error) {
      console.error('Error fetching library items:', error);
    }
  };

  const handleLibraryItemSaved = (savedItem: LibraryItem) => {
    if (activeLibraryItem) {
      // Update existing item
      setLibraryItems(libraryItems.map(item => 
        item.id === savedItem.id ? savedItem : item
      ));
    } else {
      // Add new item
      setLibraryItems([savedItem, ...libraryItems]);
    }
    setActiveLibraryItem(null);
  };

  const handleEditLibraryItem = (item: LibraryItem) => {
    setActiveLibraryItem(item);
    setIsLibraryModalOpen(true);
  };

  const handleDeleteLibraryItem = async (itemId: string) => {
    if (!user?.id) return;
    
    try {
      await deleteLibraryItem(itemId, user.id);
      setLibraryItems(libraryItems.filter(item => item.id !== itemId));
      toast.success('Library item deleted successfully');
    } catch (error) {
      console.error('Error deleting library item:', error);
      toast.error('Failed to delete library item');
    }
  };

  const handleToggleLibraryItemFavorite = async (itemId: string) => {
    if (!user?.id) return;
    
    try {
      const updatedItem = await toggleLibraryItemFavorite(itemId, user.id);
      setLibraryItems(libraryItems.map(item => 
        item.id === itemId ? updatedItem : item
      ));
    } catch (error) {
      console.error('Error toggling library item favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleToggleLibraryItemCompletion = async (itemId: string) => {
    if (!user?.id) return;
    
    try {
      const updatedItem = await toggleLibraryItemCompletion(itemId, user.id);
      setLibraryItems(libraryItems.map(item => 
        item.id === itemId ? updatedItem : item
      ));
    } catch (error) {
      console.error('Error toggling library item completion:', error);
      toast.error('Failed to update completion status');
    }
  };

  // Notification functionality removed - using Resend for email notifications

  // Helper function to group goal packs by user type
  const groupGoalPacksByUserType = () => {
    const groups: { [key: string]: GoalPack[] } = {
      'student': [],
      'non-student': [],
      'all': []
    };
    
    goalPacks.forEach(pack => {
      if (pack.targetUserType === 'all') {
        groups['all'].push(pack);
      } else {
        groups[pack.targetUserType].push(pack);
      }
    });
    
    return groups;
  };

  // Helper function to render goal pack item
  const renderGoalPackItem = (pack: GoalPack) => (
    <div 
      key={pack.id}
      onClick={() => {
        setActiveGoalPack(pack);
        setIsGoalPackModalOpen(true);
      }}
      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 mb-2"
    >
      <div>
        <h3 className="font-medium">{pack.title}</h3>
        <p className="text-sm text-gray-500">
          {pack.category} • {pack.targetUserType} • {pack.isActive ? 'Active' : 'Inactive'}
        </p>
      </div>
      <div className={`w-3 h-3 rounded-full ${pack.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
    </div>
  );


  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      {/* PWA Installation Prompt will automatically show based on criteria */}
      
      {/* Offline Status Indicator */}
      <OfflineStatusIndicator position="top-right" />
      
      {/* Calendar Section */}
      <DashboardCalendar onDateSelect={handleDateSelect} />
      <div className="p-4">

       

        {/* Goal Metrics Card */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm scrollable">
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



        {/* Notification Settings section removed - using Resend for email notifications */}

        {/* Expert Class Section */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-blue-500 text-lg font-medium flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Expert Class
            </h2>
          </div>

          {partnershipLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading expert class status...</p>
            </div>
          ) : userPartnership ? (
            // User is in an expert class
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-800">Expert Class Active</h3>
                    <p className="text-sm text-green-600">
                      Status: Enrolled
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPartnerDashboard(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Dashboard
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-600">Assigned Tasks</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>

              {/* Preferences quick access */}
              <div className="mt-2 text-right">
                <button
                  onClick={() => setShowPartnerPreferences(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Update preferences
                </button>
              </div>
            </div>
          ) : (
            // User is not in an expert class
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Join an Expert Class</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Get personalized guidance and tasks from experts in your field. Learn from the best and achieve your goals faster.
              </p>

              <div className="flex justify-center space-x-3">
                {!userPreferences && (
                  <button
                    onClick={() => setShowPartnerPreferences(true)}
                    className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Set Preferences
                  </button>
                )}
                <button
                  onClick={handleFindPartner}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Browse Experts</span>
                </button>
              </div>

              {userPreferences && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    Preferences set. You can update them anytime.
                  </p>
                  <button
                    onClick={() => setShowPartnerPreferences(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                  >
                    Update preferences
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Goal Pack Section - Only visible to admins */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-blue-500 text-lg font-medium">Admin: Goal Packs</h2>
              <button 
                onClick={() => {
                  setActiveGoalPack(null);
                  setIsGoalPackModalOpen(true);
                }}
                className="bg-blue-500  text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} className="inline mr-1" />
                Create Pack
              </button>
            </div>
            
              {goalPacks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No goal packs created yet</p>
              ) : (
              <div className="space-y-4">
                {Object.entries(groupGoalPacksByUserType()).map(([userType, packs]) => (
                  packs.length > 0 && (
                    <div key={userType} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedUserType(expandedUserType === userType ? null : userType)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
                      >
                        <span className="font-medium capitalize">
                          {userType === 'all' ? 'All Users' : userType === 'non-student' ? 'Professional' : userType}
                          <span className="ml-2 text-sm text-gray-500">({packs.length})</span>
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${expandedUserType === userType ? 'transform rotate-180' : ''}`}
                        />
                      </button>
                      {expandedUserType === userType && (
                        <div className="p-3">
                          {packs.map(pack => (
                  <div 
                    key={pack.id}
                    onClick={() => {
                      setActiveGoalPack(pack);
                      setIsGoalPackModalOpen(true);
                    }}
                              className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 mb-2"
                  >
                    <div>
                      <h3 className="font-medium">{pack.title}</h3>
                      <p className="text-sm text-gray-500">
                        {pack.category} • {pack.targetUserType} • {pack.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${pack.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Dashboard Button - Only visible to admins */}
        {isAdmin && (
          <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-blue-500 text-lg font-medium">Admin Management</h2>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/admin')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-blue-800">User Management</h3>
                    <p className="text-sm text-blue-600">View and manage all users</p>
                  </div>
                </div>
                <div className="text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Expert Dashboard Button - Only visible to experts */}
        {user?.userType === 'expert' && (
          <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-purple-500 text-lg font-medium">Expert Dashboard</h2>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/expert')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Crown className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-purple-800">Expert Dashboard</h3>
                    <p className="text-sm text-purple-600">Manage your expert profile and help others</p>
                  </div>
                </div>
                <div className="text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Regular User Goal Packs */}
        {!isAdmin && userGoalPacks.length > 0 && (
          <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-blue-500 text-lg font-medium">Available Goal Packs</h2>
              {userGoalPacks.length > 3 && (
                <button 
                  onClick={() => setShowAllGoalPacks(!showAllGoalPacks)}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  {showAllGoalPacks ? 'Show Less' : 'See More'}
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {(showAllGoalPacks ? userGoalPacks : userGoalPacks.slice(0, 3)).map(pack => (
                  <div 
                    key={pack.id}
                  className="mx-4 mb-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleEditGoalPack(pack)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-blue-800">{pack.title}</h5>
                      {pack.description && (
                        <p className="text-sm text-blue-600 mt-1">{pack.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {pack.tags && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {pack.tags}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex flex-col items-center">
                      <Edit3 className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-blue-400 mt-1">Edit</span>
                    </div>
                    <div className="ml-2 flex flex-col items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGoalPackToShare(pack);
                          setIsShareModalOpen(true);
                        }}
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-blue-500" />
                      </button>
                      <span className="text-xs text-blue-400 mt-1">Share</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Cards */}
        {categories.map((category) => (
          <CategoryCard 
            key={category.id}
            id={category.id}
            name={category.name} 
            icon={category.icon}
            onGoalCreated={loadGoals}
          >
            {/* Goal Packs for this category */}
            {getGoalPacksForCategory(category.id).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2 px-4">📦 Goal Packs</h4>
                {getGoalPacksForCategory(category.id).map(pack => (
                  <div 
                    key={pack.id}
                    className="mx-4 mb-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleEditGoalPack(pack)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-blue-800">{pack.title}</h5>
                        {pack.description && (
                          <p className="text-sm text-blue-600 mt-1">{pack.description}</p>
                        )}
                        <p className="text-xs text-blue-400 mt-1">
                          📝 Click to customize and add to your goals
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {pack.tags && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {pack.tags}
                            </span>
                          )}
                          <span className="text-xs text-blue-500">
                            For {pack.targetUserType === 'all' ? 'All Users' : pack.targetUserType}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 flex flex-col items-center">
                        <Edit3 className="w-5 h-5 text-blue-500" />
                        <span className="text-xs text-blue-400 mt-1">Edit</span>
                      </div>
                      <div className="ml-2 flex flex-col items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setGoalPackToShare(pack);
                            setIsShareModalOpen(true);
                          }}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                        >
                          <Share2 className="w-4 h-4 text-blue-500" />
                        </button>
                        <span className="text-xs text-blue-400 mt-1">Share</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter and show tasks that belong to this category */}
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading goals...</div>
            ) : goals.filter(goal => goal.category === formatCategoryForFiltering(category.id)).length === 0 && getGoalPacksForCategory(category.id).length === 0 ? (
              <div className="p-4 text-center text-gray-500">No goals in this category yet</div>
            ) : (
              goals
                .filter(goal => goal.category === formatCategoryForFiltering(category.id))
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
                      dueDate={goal.deadline || undefined}
                      completed={goal.isCompleted}
                      onToggleComplete={(id) => {
                        // Stop event propagation
                        event?.stopPropagation();
                        handleToggleComplete(id);
                      }}
                      onDelete={(id) => {
                        // Stop event propagation
                        event?.stopPropagation();
                        handleDeleteGoal(id);
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
            {libraryItems.length > 0 && (
              <span className="text-sm text-gray-500">{libraryItems.length} items</span>
            )}
          </div>
          
          {/* Library Items */}
          {libraryItems.length > 0 && (
            <div className="px-4 pb-4 space-y-3">
              {libraryItems.slice(0, 3).map((item) => (
                <LibraryItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditLibraryItem}
                  onDelete={handleDeleteLibraryItem}
                  onToggleFavorite={handleToggleLibraryItemFavorite}
                  onToggleComplete={handleToggleLibraryItemCompletion}
                />
              ))}
              {libraryItems.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500">
                    +{libraryItems.length - 3} more items
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div 
            className="bg-blue-100 p-4 flex items-center justify-between cursor-pointer hover:bg-blue-200 transition-colors"
            onClick={() => {
              setActiveLibraryItem(null);
              setIsLibraryModalOpen(true);
            }}
          >
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

      {/* Goal Pack Modal - Admin Only */}
      {isAdmin && (
        <GoalPackModal
          isOpen={isGoalPackModalOpen}
          onClose={() => {
            setIsGoalPackModalOpen(false);
            setActiveGoalPack(null);
          }}
          onSave={handleGoalPackSaved}
          initialData={activeGoalPack}
          mode={activeGoalPack ? 'edit' : 'create'}
        />
      )}

      {/* Goal Pack Edit Modal - For Users */}
      <GoalPackEditModal
        isOpen={isGoalPackEditModalOpen}
        onClose={() => {
          setIsGoalPackEditModalOpen(false);
          setEditingGoalPack(null);
        }}
        onSave={handleGoalPackEdited}
        goalPack={editingGoalPack}
      />

      {/* Library Modal */}
      <LibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => {
          setIsLibraryModalOpen(false);
          setActiveLibraryItem(null);
        }}
        onSave={handleLibraryItemSaved}
        initialData={activeLibraryItem}
        mode={activeLibraryItem ? 'edit' : 'create'}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        onConfirm={confirmDeleteGoal}
        title="Delete Goal"
        itemName={goalToDelete?.title}
        isDeleting={isDeleting}
      />
      
      {/* Toast notifications */}
      

      {/* User Type Selection Modal */}
      <UserTypeSelectionModal
        isOpen={showUserTypeModal}
        onClose={handleUserTypeModalClose}
        onComplete={handleUserTypeComplete}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        goalPack={goalPackToShare}
      />

      {/* Partner Preferences Modal */}
      <PartnerPreferencesForm
        isOpen={showPartnerPreferences}
        onClose={() => setShowPartnerPreferences(false)}
        onPreferencesSaved={handlePartnerPreferencesSaved}
        initialData={userPreferences}
      />

      {/* Expert Matching Modal */}
      {showPartnerMatching && (
        <ExpertMatchingInterface
          onPartnershipCreated={handlePartnershipCreated}
          onClose={() => setShowPartnerMatching(false)}
        />
      )}

      {/* Partner Dashboard Modal */}
      {showPartnerDashboard && userPartnership && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Partnership Dashboard</h2>
              <button
                onClick={() => setShowPartnerDashboard(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <PartnerDashboard
              partnershipId={userPartnership.id}
              onPartnershipEnded={() => {
                // Reload partnership data and close modal
                loadPartnershipData();
                setShowPartnerDashboard(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 
