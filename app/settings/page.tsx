"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import {
  Bell,
  ChevronRight,
  User,
  Settings,
  Tag,
  Users,
  FileText,
  Headphones,
} from "lucide-react";
import BottomNav from "@/components/dashboard/BottomNav";
import EditProfile from "@/components/EditProfile";
import UserTypeSelectionModal from "@/components/UserTypeSelectionModal";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { hasCompletedUserTypeSelection, updateUserType } from "@/src/services/appwrite/userService";
import { UserType } from "@/lib/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const { loading, user } = useRequireAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [hasCheckedUserType, setHasCheckedUserType] = useState(false);

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

    if (!loading && user) {
      checkUserTypeCompletion();
    }
  }, [loading, user, hasCheckedUserType]);

  const openProfileEditor = () => {
    setIsProfileOpen(true);
  };

  const closeProfileEditor = () => {
    setIsProfileOpen(false);
  };

  const handleUserTypeComplete = async (userType: UserType, schoolName?: string) => {
    if (!user?.id) return;

    try {
      await updateUserType({
        userId: user.id,
        userType,
        schoolName
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

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center">Loading...</div>
  }

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen pb-16 relative">
      <Head>
        <title>Settings</title>
        <meta name="description" content="Settings page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* User Profile */}
      <div
        className="bg-white p-6 flex items-center justify-between mb-4 cursor-pointer"
        onClick={openProfileEditor}
      >
        <div className="flex items-center">
          <div className="relative h-12 w-12 rounded-full bg-orange-300 overflow-hidden mr-4">
            <div className="absolute inset-0 flex items-center justify-center text-orange-600">
              <User size={24} />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-lg">{user?.name || "Guest"}</h2>
            <p className="text-gray-500 text-sm">
              {user?.email || "Not logged In"}
            </p>
          </div>
        </div>
        <ChevronRight className="text-gray-400" />
      </div>

      {/* Settings Section */}
      <div className="mb-4 p-4">
        <h3 className="py-2 text-lg font-medium">Settings</h3>
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="flex items-center p-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-4">
              <Bell size={20} className="text-blue-400" />
            </div>
            <span className="flex-grow">Notifications</span>
            <ChevronRight className="text-gray-400" />
          </div>
          <div className="flex items-center p-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center mr-4">
              <Settings size={20} className="text-green-400" />
            </div>
            <span className="flex-grow">General</span>
            <ChevronRight className="text-gray-400" />
          </div>
          <div className="flex items-center p-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center mr-4">
              <Tag size={20} className="text-purple-400" />
            </div>
            <span className="flex-grow">Tags</span>
            <ChevronRight className="text-gray-400" />
          </div>
          <div className="flex items-center p-4">
            <div className="w-8 h-8 rounded-md bg-yellow-100 flex items-center justify-center mr-4">
              <Users size={20} className="text-yellow-400" />
            </div>
            <span className="flex-grow">Groups</span>
            <ChevronRight className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="mb-4 p-4">
        <h3 className="py-2 text-lg font-medium">Support</h3>
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="flex items-center p-4">
            <div className="w-8 h-8 rounded-md bg-pink-100 flex items-center justify-center mr-4">
              <Users size={20} className="text-pink-400" />
            </div>
            <span className="flex-grow">Socials</span>
            <ChevronRight className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="mb-4 p-4">
        <h3 className="py-2 text-lg font-medium">Feedback</h3>
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="flex items-center p-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-4">
              <FileText size={20} className="text-blue-400" />
            </div>
            <span className="flex-grow">Leave a review</span>
            <ChevronRight className="text-gray-400" />
          </div>
          <div className="flex items-center p-4">
            <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center mr-4">
              <Headphones size={20} className="text-purple-400" />
            </div>
            <span className="flex-grow">Chat with support</span>
            <ChevronRight className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav />

      {/* Edit Profile Component */}
      <EditProfile isOpen={isProfileOpen} onClose={closeProfileEditor} />

      {/* User Type Selection Modal */}
      <UserTypeSelectionModal
        isOpen={showUserTypeModal}
        onClose={handleUserTypeModalClose}
        onComplete={handleUserTypeComplete}
      />
    </div>
  );
}
