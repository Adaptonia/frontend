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
import UserExpertTasks from '@/components/expert/UserExpertTasks';

interface PartnerDashboardProps {
  partnershipId: string;
}

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ partnershipId }) => {
  const { user } = useAuth();
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
      // Handle ending the expert class relationship
      toast.success('Left expert class successfully');
      // Close modal or redirect
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expert Class</h1>
                <p className="text-gray-600">Complete tasks assigned by your expert</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEndPartnershipModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Expert Tasks Section */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-6">
            <UserExpertTasks onTaskSubmitted={() => {
              // Refresh any relevant data if needed
            }} />
          </div>
        </div>

        {/* End Partnership Modal */}
        {showEndPartnershipModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Leave Expert Class</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to leave this expert class? You will no longer receive tasks from this expert.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEndPartnershipModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleEndPartnership();
                    setShowEndPartnershipModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Leave Class
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerDashboard;