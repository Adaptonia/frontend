'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  memberName: string;
  submissionText: string;
  submissionLink?: string;
  currentStatus: string;
  onReview: (submissionId: string, status: 'approved' | 'rejected' | 'needs_revision', comment?: string) => Promise<void>;
}

const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
  isOpen,
  onClose,
  submissionId,
  memberName,
  submissionText,
  submissionLink,
  currentStatus,
  onReview
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'approved' | 'rejected' | 'needs_revision' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error('Please select a review status');
      return;
    }

    if (selectedStatus === 'needs_revision' && !comment.trim()) {
      toast.error('Please provide feedback for revision');
      return;
    }

    setIsSubmitting(true);
    try {
      await onReview(submissionId, selectedStatus, comment.trim() || undefined);
      onClose();
      setSelectedStatus(null);
      setComment('');
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Failed to review submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus(null);
    setComment('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Review Submission</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Member Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Member: {memberName}</h4>
            <p className="text-sm text-gray-600">Current Status: <span className="capitalize">{currentStatus.replace('_', ' ')}</span></p>
          </div>

          {/* Submission Content */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Submission:</h4>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 mb-3">{submissionText}</p>
              {submissionLink && (
                <a
                  href={submissionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>View Evidence</span>
                </a>
              )}
            </div>
          </div>

          {/* Review Options */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Review Decision:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedStatus('approved')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedStatus === 'approved'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Approve</span>
                </div>
                <p className="text-sm text-green-600 mt-1">Task completed successfully</p>
              </button>

              <button
                onClick={() => setSelectedStatus('rejected')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedStatus === 'rejected'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Reject</span>
                </div>
                <p className="text-sm text-red-600 mt-1">Task not completed properly</p>
              </button>

              <button
                onClick={() => setSelectedStatus('needs_revision')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedStatus === 'needs_revision'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Needs Revision</span>
                </div>
                <p className="text-sm text-yellow-600 mt-1">Requires improvements</p>
              </button>
            </div>
          </div>

          {/* Comment Section */}
          {selectedStatus && (
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                {selectedStatus === 'needs_revision' ? 'Feedback for Revision *' : 'Comment (Optional)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  selectedStatus === 'needs_revision'
                    ? 'Provide specific feedback on what needs to be improved...'
                    : selectedStatus === 'approved'
                    ? 'Add any positive feedback or encouragement...'
                    : 'Explain why this submission was rejected...'
                }
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                required={selectedStatus === 'needs_revision'}
              />
              {selectedStatus === 'needs_revision' && (
                <p className="text-sm text-yellow-600 mt-1">
                  * Feedback is required for revision requests
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedStatus || isSubmitting || (selectedStatus === 'needs_revision' && !comment.trim())}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubmissionReviewModal;



