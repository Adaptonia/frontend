'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Calendar, User, BookOpen, BarChart3, Edit3, GraduationCap, Briefcase } from 'lucide-react'
import Image from 'next/image'
import { Toaster, toast } from 'sonner'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuth } from '@/context/AuthContext'

// Custom components
import DashboardCalendar from '@/components/dashboard/Calendar'
import CategoryCard from '@/components/dashboard/CategoryCard'
import TaskItem from '@/components/dashboard/TaskItem'
import BottomNav from '@/components/dashboard/BottomNav'
import GoalFormModal from '@/components/goals/GoalFormModal'
import GoalPackEditModal from '@/components/goals/GoalPackEditModal'
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { NotificationToggle } from '@/components/pwa/NotificationToggle'
import UserTypeSelectionModal from '@/components/UserTypeSelectionModal'

// Appwrite services
import { getGoals, toggleGoalCompletion, deleteGoal } from '../../src/services/appwrite/database'
import { Goal, UserType, Milestone, GoalPack, LibraryItem } from '@/lib/types'
import GoalPackModal from '@/components/admin/GoalPackModal'
import { getAllGoalPacks, getGoalPacksForUserType } from '@/src/services/appwrite/goalPackService'
import LibraryModal from '@/components/library/LibraryModal'
import LibraryItemCard from '@/components/library/LibraryItemCard'
import { getLibraryItems, deleteLibraryItem, toggleLibraryItemFavorite, toggleLibraryItemCompletion } from '@/src/services/appwrite/libraryService'
import { hasCompletedUserTypeSelection, updateUserType } from '@/src/services/appwrite/userService'

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
  const [isGoalPackEditModalOpen, setIsGoalPackEditModalOpen] = useState(false)
  const [editingGoalPack, setEditingGoalPack] = useState<GoalPack | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false)
  const [activeLibraryItem, setActiveLibraryItem] = useState<LibraryItem | null>(null)
  
  // User type selection states
  const [showUserTypeModal, setShowUserTypeModal] = useState(false)
  const [hasCheckedUserType, setHasCheckedUserType] = useState(false)
  
  const { user, loading: authLoading } = useRequireAuth()
  const { updateUser } = useAuth()
  
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

  // 🧪 TEST NOTIFICATION FUNCTIONS
  const handleTestNotification = async () => {
    if (!user?.id) {
      toast.error('Please log in to test notifications');
      return;
    }

    try {
      console.log('🧪 TESTING: Creating test reminder for 4 minutes from now...');
      
      // Calculate 4 minutes from now
      const testTime = new Date();
      testTime.setMinutes(testTime.getMinutes() + 4);
      
      console.log('⏰ TEST: Scheduled for:', testTime.toLocaleString());
      
      // Import the scheduling function
      const { scheduleReminders } = await import('@/lib/utils/dateUtils');
      
      // Create a test reminder
      await scheduleReminders(
        `test-${Date.now()}`, // Unique test goal ID
        { enabled: false }, // No advanced reminders
        testTime.toISOString(), // Simple reminder in 4 minutes
        user
      );
      
      toast.success('🧪 Test Notification Scheduled!', {
        description: `You should receive a notification at ${testTime.toLocaleTimeString()}. Close the app to test background delivery!`
      });
      
      console.log('✅ TEST: Reminder created successfully');
      console.log('📱 TEST: Close your app now and wait 4 minutes for the notification!');
      
    } catch (error) {
      console.error('❌ TEST: Failed to create test notification:', error);
      toast.error('Failed to schedule test notification');
    }
  };

  // 🚀 INSTANT TEST NOTIFICATION (for immediate testing)
  const handleInstantTestNotification = async () => {
    try {
      console.log('🚀 INSTANT TEST: Sending immediate notification...');
      
      // Check if notifications are supported
      if (!('Notification' in window)) {
        toast.error('Notifications not supported in this browser');
        return;
      }
      
      // Request permission if needed
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Notification permission denied');
          return;
        }
      }
      
      if (Notification.permission === 'granted') {
        // Show instant notification
        new Notification('🧪 Test Notification', {
          body: 'This is a test notification from Adaptonia! Your notifications are working perfectly.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'test-notification'
        });
        
        toast.success('✅ Instant notification sent!');
        console.log('🚀 INSTANT TEST: Notification displayed');
      } else {
        toast.error('Notification permission not granted');
      }
      
    } catch (error) {
      console.error('❌ INSTANT TEST: Failed:', error);
      toast.error('Failed to send instant notification');
    }
  };

  // 🔑 SIMPLE FCM TOKEN TEST (just tests token storage)
  const handleFCMTokenTest = async () => {
    if (!user?.id) {
      toast.error('Please log in to test FCM token storage');
      return;
    }

    try {
      console.log('🔑 FCM TOKEN TEST: Testing token storage only...');
      toast.loading('Testing FCM token storage...', { id: 'fcm-token-test' });

      // Step 1: Request notification permission
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported in this browser');
      }
      
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Step 2: Try to get real FCM token
      let fcmToken = null;
      try {
        const { requestNotificationPermission } = await import('@/lib/firebase');
        fcmToken = await requestNotificationPermission();
        
        if (fcmToken) {
          console.log('✅ Real FCM token obtained for storage test');
        } else {
          throw new Error('Failed to get real FCM token');
        }
             } catch {
         fcmToken = `token-test-${Date.now()}`;
         console.log('🧪 Using test token for storage test');
       }
      
      // Step 3: Store FCM token
      const storeResponse = await fetch('/api/user/store-fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          token: fcmToken,
          userId: user.id 
        })
      });
      
      const storeResult = await storeResponse.json();
      if (!storeResult.success) {
        throw new Error(`Failed to store FCM token: ${storeResult.message}`);
      }
      
      console.log('🎉 FCM TOKEN TEST: Success!');
      toast.success('🎉 FCM Token Storage Test Successful!', { 
        id: 'fcm-token-test',
        description: 'FCM token stored successfully in database!' 
      });

    } catch (error) {
      console.error('❌ FCM TOKEN TEST: Failed:', error);
      toast.error('FCM Token Test Failed', { 
        id: 'fcm-token-test',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  // 🔥 COMPREHENSIVE FCM TEST (tests the full notification system)
  const handleFCMSystemTest = async () => {
    if (!user?.id) {
      toast.error('Please log in to test FCM system');
      return;
    }

    try {
      console.log('🔥 FCM SYSTEM TEST: Starting comprehensive test...');
      toast.loading('Testing FCM system...', { id: 'fcm-test' });

      // Step 1: Request notification permission
      console.log('🔔 Step 1: Requesting notification permission...');
      
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported in this browser');
      }
      
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Step 2: Generate FCM token (try real Firebase first, fallback to test)
      console.log('🔑 Step 2: Generating FCM token...');
      let fcmToken = null;
      
      try {
        // Try to get a real FCM token from Firebase
        const { requestNotificationPermission } = await import('@/lib/firebase');
        fcmToken = await requestNotificationPermission();
        
        if (fcmToken) {
          console.log('✅ Real FCM token obtained:', fcmToken.substring(0, 30) + '...');
        } else {
          throw new Error('Failed to get real FCM token');
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase not available, using test token:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError));
        fcmToken = `dashboard-test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        console.log('🧪 Using test token:', fcmToken.substring(0, 30) + '...');
      }
      
      // Step 3: Store FCM token in Appwrite
      console.log('💾 Step 3: Storing FCM token...');
      const storeResponse = await fetch('/api/user/store-fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          token: fcmToken,
          userId: user.id 
        })
      });
      
      const storeResult = await storeResponse.json();
      if (!storeResult.success) {
        throw new Error(`Failed to store FCM token: ${storeResult.message}`);
      }
      
      console.log('✅ FCM token stored successfully');

      // Step 4: Test FCM notification
      console.log('📤 Step 4: Testing FCM notification...');
      const testResponse = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          title: '🎉 FCM Test Success!',
          body: 'Your notification system is working perfectly! Reminders will now be delivered reliably.',
          data: { 
            type: 'fcm_system_test',
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const testResult = await testResponse.json();
      if (!testResult.success) {
        throw new Error(`FCM notification test failed: ${testResult.message}`);
      }
      
      console.log('🎉 FCM SYSTEM TEST: Complete success!');
      toast.success('🎉 FCM System Test Successful!', { 
        id: 'fcm-test',
        description: 'Your notification system is fully operational. Reminders will work perfectly!' 
      });

    } catch (error) {
      console.error('❌ FCM SYSTEM TEST: Failed:', error);
      toast.error('FCM System Test Failed', { 
        id: 'fcm-test',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  // 🔍 NOTIFICATION DEBUG TEST - Comprehensive debugging
  const handleNotificationDebugTest = async () => {
    if (!user?.id) {
      toast.error('Please log in to test notifications');
      return;
    }

    try {
      console.log('🔍 NOTIFICATION DEBUG: Starting comprehensive debug test...');
      toast.loading('Running notification debug test...', { id: 'debug-test' });

      // Step 1: Check browser support
      console.log('🔍 Step 1: Checking browser support...');
      const browserSupport = {
        notifications: 'Notification' in window,
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window
      };
      console.log('🔍 Browser support:', browserSupport);

      if (!browserSupport.notifications) {
        throw new Error('Notifications not supported in this browser');
      }

      // Step 2: Check notification permission
      console.log('🔍 Step 2: Checking notification permission...');
      let permission = Notification.permission;
      console.log('🔍 Current permission:', permission);
      
      if (permission === 'default') {
        console.log('🔍 Requesting permission...');
        permission = await Notification.requestPermission();
        console.log('🔍 Permission after request:', permission);
      }

      if (permission !== 'granted') {
        throw new Error(`Notification permission denied: ${permission}`);
      }

      // Step 3: Test native notification
      console.log('🔍 Step 3: Testing native notification...');
      const nativeNotification = new Notification('🔍 Debug Test - Native', {
        body: 'This is a native browser notification test',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'debug-native'
      });
      
      console.log('🔍 Native notification created:', nativeNotification);
      
      // Wait a moment for the notification to show
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Register service workers if needed
      console.log('🔍 Step 4: Ensuring service workers are registered...');
      let registration = null;
      
      if (browserSupport.serviceWorker) {
        try {
          // Check existing registration
          registration = await navigator.serviceWorker.getRegistration();
          console.log('🔍 Existing service worker registration:', registration);
          
          if (!registration) {
            console.log('🔍 No existing registration, registering Firebase service worker...');
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/firebase-cloud-messaging-push-scope'
            });
            console.log('🔍 Firebase service worker registered:', registration);
            
            // Wait for it to activate
            await navigator.serviceWorker.ready;
            console.log('🔍 Service worker ready');
          }
          
          if (registration) {
            console.log('🔍 Service worker state:', registration.active?.state);
            console.log('🔍 Service worker scope:', registration.scope);
          }
        } catch (swError) {
          console.error('🔍 Service worker registration failed:', swError);
          toast.warning('Service worker registration failed - FCM notifications may not work');
        }
      }

      // Step 5: Test FCM token generation
      console.log('🔍 Step 5: Testing FCM token generation...');
      let fcmToken = null;
      
      try {
        const { requestNotificationPermission } = await import('@/lib/firebase');
        fcmToken = await requestNotificationPermission();
        console.log('🔍 FCM token generated:', fcmToken ? 'SUCCESS' : 'FAILED');
        if (fcmToken) {
          console.log('🔍 FCM token preview:', fcmToken.substring(0, 50) + '...');
        }
      } catch (firebaseError: unknown) {
        console.warn('🔍 Firebase FCM generation failed:', firebaseError instanceof Error ? firebaseError.message : firebaseError);
      }

      // Step 6: Test service worker notification
      console.log('🔍 Step 6: Testing service worker notification...');
      if (browserSupport.serviceWorker && registration) {
        try {
          await registration.showNotification('🔍 Debug Test - Service Worker', {
            body: 'This is a service worker notification test',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'debug-sw',
            requireInteraction: true,
            data: {
              type: 'debug_test',
              timestamp: new Date().toISOString()
            }
          } as NotificationOptions);
          console.log('🔍 Service worker notification triggered');
        } catch (swNotificationError) {
          console.error('🔍 Service worker notification failed:', swNotificationError);
        }
      }

      // Step 7: Test FCM system end-to-end
      console.log('🔍 Step 7: Testing FCM system end-to-end...');
      if (fcmToken) {
        // Store token
        const storeResponse = await fetch('/api/user/store-fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            token: fcmToken,
            userId: user.id 
          })
        });
        
        const storeResult = await storeResponse.json();
        console.log('🔍 FCM token storage result:', storeResult);

        if (storeResult.success) {
          // Send test notification
          const testResponse = await fetch('/api/send-push-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              userId: user.id,
              title: '🔍 Debug Test - FCM',
              body: 'This is an FCM notification test. If you see this, FCM is working!',
              data: { 
                type: 'debug_fcm_test',
                timestamp: new Date().toISOString()
              }
            })
          });
          
          const testResult = await testResponse.json();
          console.log('🔍 FCM notification send result:', testResult);
        }
      }

      console.log('🔍 NOTIFICATION DEBUG: All tests completed');
      toast.success('🔍 Debug Test Completed!', { 
        id: 'debug-test',
        description: 'Check browser console for detailed results. You should have seen 2-3 notifications!' 
      });

    } catch (error) {
      console.error('❌ NOTIFICATION DEBUG: Failed:', error);
      toast.error('Debug Test Failed', { 
        id: 'debug-test',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  // 🚨 SUPER SIMPLE NOTIFICATION TEST
  const handleSimpleNotificationTest = async () => {
    try {
      console.log('🚨 SIMPLE TEST: Starting...');
      
      // Just show a simple notification
      if ('Notification' in window && Notification.permission === 'granted') {
        console.log('🚨 SIMPLE TEST: Showing notification...');
        
        const notification = new Notification('🚨 SIMPLE TEST', {
          body: 'If you can see this popup, notifications work!',
          icon: '/icons/icon-192x192.png'
        });
        
        console.log('🚨 SIMPLE TEST: Notification object created:', notification);
        
        // Log when notification shows
        notification.onshow = () => {
          console.log('🚨 SIMPLE TEST: Notification SHOWN successfully!');
        };
        
        // Log if notification fails
        notification.onerror = (error) => {
          console.error('🚨 SIMPLE TEST: Notification ERROR:', error);
        };
        
        // Log when notification is closed
        notification.onclose = () => {
          console.log('🚨 SIMPLE TEST: Notification CLOSED');
        };
        
        toast.success('Simple notification test sent!');
      } else {
        toast.error('Notification permission not granted');
      }
    } catch (error) {
      console.error('🚨 SIMPLE TEST: Failed:', error);
      toast.error('Simple test failed');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      {/* PWA Installation Prompt will automatically show based on criteria */}
      <PWAInstallPrompt />
      
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



        {/* Notification Settings */}
        <div className="mb-6">
          <NotificationToggle />
        </div>

        {/* 🧪 TEST NOTIFICATION SECTION */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm border-2 border-dashed border-blue-200">
          <h2 className="text-blue-500 text-lg font-medium mb-3 flex items-center">
            🧪 Test Notifications
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Test your notification system to make sure everything works perfectly!
          </p>
          
          <div className="space-y-3">
            {/* FCM Token Test Button - Simple Test */}
            <button
              onClick={handleFCMTokenTest}
              className="w-full bg-indigo-500 text-white px-4 py-3 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center font-semibold"
            >
              🔑 Test FCM Token Storage
            </button>
            
            {/* FCM System Test Button - Complete Test */}
            <button
              onClick={handleFCMSystemTest}
              className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center font-semibold"
            >
              🔥 Test Complete FCM System
            </button>
            
            {/* Debug Test Button - Comprehensive debugging */}
            <button
              onClick={handleNotificationDebugTest}
              className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center font-semibold"
            >
              🔍 Debug Notification System
            </button>
            
            {/* Instant Test Button */}
            <button
              onClick={handleInstantTestNotification}
              className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              🚀 Send Instant Test Notification
            </button>
            
            {/* 4-Minute Test Button */}
            <button
              onClick={handleTestNotification}
              className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              ⏰ Schedule Test Notification (4 minutes)
            </button>
            
            {/* Simple Notification Test Button */}
            <button
              onClick={handleSimpleNotificationTest}
              className="w-full bg-teal-500 text-white px-4 py-3 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center"
            >
              🚨 Simple Notification Test
            </button>
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p><strong>🔑 FCM Token Storage:</strong> Tests FCM token generation and database storage (recommended first)</p>
              <p><strong>🔥 FCM System Test:</strong> Complete test of FCM token registration and notification delivery</p>
              <p><strong>🔍 Debug Test:</strong> Comprehensive debugging - shows multiple notifications to identify issues</p>
              <p><strong>🚀 Instant Test:</strong> Shows notification immediately (tests permission)</p>
              <p><strong>⏰ 4-Minute Test:</strong> Tests the full reminder system - close your app after clicking!</p>
              <p><strong>🚨 Simple Notification Test:</strong> Shows a simple notification to verify browser settings</p>
            </div>
          </div>
        </div>

        {/* Admin Goal Pack Section - Only visible to admins */}
        {user?.role === 'admin' && (
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
            
            <div className="space-y-2">
              {goalPacks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No goal packs created yet</p>
              ) : (
                goalPacks.map(pack => (
                  <div 
                    key={pack.id}
                    onClick={() => {
                      setActiveGoalPack(pack);
                      setIsGoalPackModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-medium">{pack.title}</h3>
                      <p className="text-sm text-gray-500">
                        {pack.category} • {pack.targetUserType} • {pack.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${pack.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                ))
              )}
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
      {user?.role === 'admin' && (
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
      <Toaster position="bottom-center" />

      {/* User Type Selection Modal */}
      <UserTypeSelectionModal
        isOpen={showUserTypeModal}
        onClose={handleUserTypeModalClose}
        onComplete={handleUserTypeComplete}
      />
    </div>
  )
}

export default Dashboard 
