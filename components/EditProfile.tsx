"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function EditProfile({ isOpen, onClose }: any) {
  const { user, updateUser, logout } = useAuth() || { user: { name: "", email: "" } };
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("************");
  const [subscription, setSubscription] = useState("Not Subscribed");
  const profileRef = useRef(null);
  console.log(email, 'email')

  useEffect(() => {
    // Update form when user data changes

    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateUser) {
      updateUser({ name, email });
    }
    onClose();
  };

  const handleLogout = () => {
    logout()
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
          <div className="max-w-md mx-auto min-h-screen pb-16">
            {/* Header */}
            <div className="bg-white p-4 flex items-center">
              <button onClick={onClose} className="mr-4">
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
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-orange-300" />
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
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="John Doe"
                />
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
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="mb-4">
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
                className="w-full p-3 border border-red-500 text-red-500 rounded-md font-medium mb-8"
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
