'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Link, FileText, Send, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { expertTaskService, CreateTaskSubmissionData } from '@/services/appwrite/expertTaskService';
import { useAuth } from '@/context/AuthContext';
import { ExpertTask, TaskSubmission } from '@/database/partner-accountability-schema';

interface MemberTaskSubmissionProps {
  task: ExpertTask;
  existingSubmission?: TaskSubmission;
  onSubmissionUpdated: () => void;
}

const MemberTaskSubmission: React.FC<MemberTaskSubmissionProps> = ({
  task,
  existingSubmission,
  onSubmissionUpdated
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (existingSubmission) {
      setSubmissionText(existingSubmission.submissionText);
      setSubmissionLink(existingSubmission.submissionLink || '');
    }
  }, [existingSubmission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (!submissionText.trim()) {
      toast.error('Please provide your submission details');
      return;
    }

    setLoading(true);
    try {
      const submissionData: CreateTaskSubmissionData = {
        taskId: task.id,
        memberId: user.id,
        submissionText: submissionText.trim(),
        submissionLink: submissionLink.trim() || undefined
      };

      await expertTaskService.createTaskSubmission(submissionData);
      
      toast.success('Task submission sent successfully!');
      onSubmissionUpdated();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'needs_revision':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_revision':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = new Date(task.dueDate) < new Date();
  const isSubmitted = existingSubmission && existingSubmission.status !== 'pending';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Task Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
          <p className="text-gray-600 mb-3">{task.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Due: {formatDate(task.dueDate)}</span>
            </div>
            {isOverdue && (
              <span className="text-red-600 font-medium">Overdue</span>
            )}
          </div>
        </div>
        
        {isSubmitted && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(existingSubmission.status)}`}>
            {getStatusIcon(existingSubmission.status)}
            <span className="capitalize">{existingSubmission.status.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Expert Comment */}
      {existingSubmission?.expertComment && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Expert Feedback:</h4>
          <p className="text-yellow-700">{existingSubmission.expertComment}</p>
        </div>
      )}

      {/* Submission Form or Display */}
      {!isSubmitted || existingSubmission.status === 'needs_revision' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Your Submission *
            </label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Describe what you accomplished or provide evidence of task completion..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link className="w-4 h-4 inline mr-2" />
              Evidence Link (Optional)
            </label>
            <input
              type="url"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              placeholder="https://example.com/evidence"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            />
            <p className="text-sm text-gray-500 mt-1">
              Share a link to photos, documents, or other evidence of your work
            </p>
          </div>

          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Submit Task'}</span>
            </motion.button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Your Submission:</h4>
          <p className="text-gray-700 mb-3">{existingSubmission.submissionText}</p>
          
          {existingSubmission.submissionLink && (
            <div className="flex items-center space-x-2">
              <Link className="w-4 h-4 text-gray-500" />
              <a
                href={existingSubmission.submissionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
              >
                <span>View Evidence</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          
          <div className="text-sm text-gray-500 mt-2">
            Submitted: {formatDate(existingSubmission.submittedAt)}
            {existingSubmission.reviewedAt && (
              <span> • Reviewed: {formatDate(existingSubmission.reviewedAt)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberTaskSubmission;



