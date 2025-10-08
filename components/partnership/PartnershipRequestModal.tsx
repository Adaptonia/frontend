'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Target,
  Globe,
  User,
  MessageSquare,
  Loader
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { partnershipService } from '@/services/appwrite/partnershipService';
import { partnerMatchingService } from '@/services/partnerMatchingService';
import { Partnership, PartnershipPreferences } from '@/database/partner-accountability-schema';

interface PartnershipRequestModalProps {
  partnership: Partnership;
  requesterPreferences: PartnershipPreferences;
  requesterUserDetails?: any;
  isOpen: boolean;
  onClose: () => void;
  onPartnershipAccepted?: (partnership: Partnership) => void;
  onPartnershipDeclined?: (partnership: Partnership) => void;
}

const PartnershipRequestModal: React.FC<PartnershipRequestModalProps> = ({
  partnership,
  requesterPreferences,
  requesterUserDetails,
  isOpen,
  onClose,
  onPartnershipAccepted,
  onPartnershipDeclined
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<'accept' | 'decline' | null>(null);

  const handleAccept = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    setAction('accept');

    try {
      const result = await partnerMatchingService.acceptPartnership(partnership.id, user.id);

      if (result.success) {
        toast.success('Partnership accepted! You can now start working together.');
        onPartnershipAccepted?.(result.partnership!);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error accepting partnership:', error);
      toast.error('Failed to accept partnership. Please try again.');
    } finally {
      setIsProcessing(false);
      setAction(null);
    }
  };

  const handleDecline = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    setAction('decline');

    try {
      const result = await partnerMatchingService.declinePartnership(partnership.id, user.id);

      if (result.success) {
        toast.success('Partnership request declined.');
        onPartnershipDeclined?.(partnership);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error declining partnership:', error);
      toast.error('Failed to decline partnership. Please try again.');
    } finally {
      setIsProcessing(false);
      setAction(null);
    }
  };

  const getSupportStyleLabel = (styleId: string): string => {
    const styles = {
      encouraging: 'Encouraging & Motivational',
      structured: 'Structured & Organized',
      flexible: 'Flexible & Adaptive',
      accountability: 'Strict Accountability',
      collaborative: 'Collaborative & Teamwork',
      independent: 'Independent Check-ins'
    };
    return styles[styleId as keyof typeof styles] || styleId;
  };

  const getCategoryLabel = (categoryId: string): string => {
    const categories = {
      schedule: 'Schedule & Time Management',
      finance: 'Finance & Money Goals',
      career: 'Career & Professional Growth',
      audio_books: 'Learning & Audio Books'
    };
    return categories[categoryId as keyof typeof categories] || categoryId;
  };

  const getTimeCommitmentLabel = (commitment: string): string => {
    const commitments = {
      daily: 'Daily check-ins',
      weekly: 'Weekly check-ins',
      flexible: 'Flexible schedule'
    };
    return commitments[commitment as keyof typeof commitments] || commitment;
  };

  const getExperienceLabel = (level: string): string => {
    const levels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };
    return levels[level as keyof typeof levels] || level;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Partnership Request
                </h2>
                <p className="text-sm text-gray-600">
                  Someone wants to be your accountability partner
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Requester Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {requesterUserDetails?.name || (requesterPreferences.bio ? 'Potential Partner' : 'Anonymous User')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {partnership.partnershipType === 'p2p' ? 'Peer-to-Peer' : 'Premium Expert'}
                  </p>
                </div>
              </div>

              {requesterPreferences.bio && (
                <p className="text-sm text-gray-700 italic">
                  "{requesterPreferences.bio}"
                </p>
              )}
            </div>

            {/* Compatibility Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Support Styles */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Support Style
                </h4>
                <div className="flex flex-wrap gap-1">
                  {requesterPreferences.supportStyle.map((style) => (
                    <span
                      key={style}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {getSupportStyleLabel(style)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Goal Categories
                </h4>
                <div className="flex flex-wrap gap-1">
                  {requesterPreferences.availableCategories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {getCategoryLabel(category)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Time Commitment */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Time Commitment
                </h4>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {getTimeCommitmentLabel(requesterPreferences.timeCommitment)}
                </span>
              </div>

              {/* Experience Level */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Experience Level
                </h4>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  {getExperienceLabel(requesterPreferences.experienceLevel)}
                </span>
              </div>
            </div>

            {/* Timezone & Meeting Times */}
            {(requesterPreferences.timezone || requesterPreferences.preferredMeetingTimes?.length) && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Availability
                </h4>
                {requesterPreferences.timezone && (
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Timezone:</strong> {requesterPreferences.timezone}
                  </p>
                )}
                {requesterPreferences.preferredMeetingTimes && requesterPreferences.preferredMeetingTimes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-700 mb-1"><strong>Preferred Times:</strong></p>
                    <div className="flex flex-wrap gap-1">
                      {requesterPreferences.preferredMeetingTimes.map((time) => (
                        <span
                          key={time}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {time.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* What this means */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">What this partnership means:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• You'll help each other stay accountable for your goals</li>
                <li>• Verify each other's task completion</li>
                <li>• Share goals and track progress together</li>
                <li>• Support each other's journey to success</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDecline}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing && action === 'decline' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Declining...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </>
                )}
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing && action === 'accept' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Accepting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept Partnership</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              You can always end this partnership later if needed
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PartnershipRequestModal;
