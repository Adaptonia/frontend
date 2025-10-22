'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Settings,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { partnershipService } from '@/services/appwrite/partnershipService';
import UserExpertTasks from '@/components/expert/UserExpertTasks';

interface PartnerDashboardProps {
  partnershipId: string;
  onPartnershipEnded?: () => void;
}

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
  partnershipId,
  onPartnershipEnded
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showEndPartnershipModal, setShowEndPartnershipModal] = useState(false);

  // Load partnership data
  useEffect(() => {
    loadPartnershipData();
  }, [partnershipId]);

  const loadPartnershipData = async () => {
    try {
      setLoading(true);
      // For now, just set loading to false
      // In the future, this could load expert class information
      setLoading(false);
    } catch (error) {
      console.error('Error loading partnership data:', error);
      setLoading(false);
    }
  };

  const handleEndPartnership = async () => {
    try {
      // End the partnership in Appwrite and make users available again
      const success = await partnershipService.updatePartnershipStatus(partnershipId, 'ended');

      if (!success) {
        toast.error('Failed to leave expert class');
        return;
      }

      toast.success('Left expert class successfully');

      // Notify parent component to reload partnership data
      if (onPartnershipEnded) {
        onPartnershipEnded();
      }

      // Refresh dashboard state so user is no longer shown as enrolled
      router.refresh();
    } catch (error) {
      console.error('Error ending partnership:', error);
      toast.error('Failed to leave expert class');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 mb-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Expert Class</h1>
                <p className="text-blue-100 mt-1">Complete tasks assigned by your expert mentor</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEndPartnershipModal(true)}
                className="p-2.5 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Leave Expert Class"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Expert Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <UserExpertTasks onTaskSubmitted={() => {
            // Refresh any relevant data if needed
          }} />
        </motion.div>

        {/* End Partnership Modal */}
        {showEndPartnershipModal && (
          <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Leave Expert Class?</h3>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    Are you sure you want to leave this expert class? You will no longer receive tasks or guidance from your expert mentor.
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEndPartnershipModal(false)}
                      className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleEndPartnership();
                        setShowEndPartnershipModal(false);
                      }}
                      className="flex-1 px-5 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 active:bg-red-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Leave Class</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default PartnerDashboard;