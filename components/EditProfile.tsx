"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Save, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { EditProfileType } from "@/lib/types";
import { updateUserProfile } from "@/src/services/appwrite/userService";
import { toast } from "sonner";
import Image from "next/image";

export default function EditProfile({ isOpen, onClose }: EditProfileType) {
  const { user, updateUser, logout } = useAuth() || {
    user: { name: "", email: "" },
  };
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [password, setPassword] = useState("************");
  // const [subscription, setSubscription] = useState("Not Subscribed");
  // const profileRef = useRef(null);
  console.log(email, "email");

  useEffect(() => {
    // Update form when user data changes

    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    // Check if anything actually changed
    const nameChanged = name !== (user.name || "");
    const emailChanged = email !== (user.email || "");
    
    if (!nameChanged && !emailChanged) {
      toast.info("No changes to save");
      onClose();
      return;
    }

    setIsLoading(true);
    
    try {
      // Update in database
      await updateUserProfile({
        userId: user.id,
        name: nameChanged ? name : undefined,
        email: emailChanged ? email : undefined,
      });

      // Update local context
      if (updateUser) {
        updateUser({ 
          ...(nameChanged && { name }), 
          ...(emailChanged && { email }) 
        });
      }

      toast.success("Profile updated successfully! 🎉", {
        description: nameChanged 
          ? "Your name will now appear in chats and throughout the app"
          : "Your profile has been updated"
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile", {
        description: "Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.3 }}
          className="fixed inset-0 bg-gray-100 z-50"
        >
          <div className="max-w-md mx-auto min-h-screen pb-16 overflow-y-auto">
            {/* Header */}
            <div className="bg-white p-4 flex items-center">
              <button onClick={onClose} className="mr-4" disabled={isLoading}>
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold flex-grow text-center pr-6">
                Edit Profile
              </h1>
            </div>

            {/* Profile picture */}
            <div className="flex justify-center my-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-orange-300 overflow-hidden">
                  {user?.profilePicture ? (
                    <Image
                      width={100}
                      height={100}
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-orange-300 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {(user?.name || user?.email || "U")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
                  <Camera size={20} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-4">
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-gray-800 font-medium mb-2"
                >
                  Display Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your display name"
                  disabled={isLoading}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This name will appear in chats and throughout the app
                </p>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-gray-800 font-medium mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john.doe@example.com"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-gray-800 font-medium mb-2"
                >
                  Password
                </label>
                <div className="flex items-center w-full p-3 border border-gray-300 rounded-md">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    disabled
                    className="flex-grow bg-transparent outline-none"
                  />
                  <button
                    type="button"
                    className="text-blue-500 font-medium"
                    onClick={() => console.log("Change password")}
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full p-3 bg-blue-500 text-white rounded-md font-medium mb-4 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>

              <div className="mb-8">
                <label className="block text-gray-800 font-medium mb-2">
                  Subscription
                </label>
                <button
                  type="button"
                  className="w-full p-3 bg-gradient-to-r from-blue-400 to-green-400 rounded-md text-white font-medium flex items-center justify-center"
                >
                  <span className="mr-2">Not Subscribed</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full p-3 border border-red-500 text-red-500 rounded-md font-medium mb-8 hover:bg-red-50 transition-colors"
                disabled={isLoading}
              >
                Log Out
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
