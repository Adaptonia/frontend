'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  MessageSquare,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  Image
} from 'lucide-react';
import { toast } from 'sonner';
import { PartnerTask } from '@/database/partner-accountability-schema';
import sharedGoalsService from '@/services/sharedGoalsService';

interface TaskVerificationModalProps {
  task: PartnerTask;
  isOpen: boolean;
  onClose: () => void;
  onVerified: (updatedTask: PartnerTask) => void;
  verifierId: string;
}

const TaskVerificationModal: React.FC<TaskVerificationModalProps> = ({
  task,
  isOpen,
  onClose,
  onVerified,
  verifierId
}) => {
  const [action, setAction] = useState<'approve' | 'reject' | 'request_redo' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const handleSubmit = async () => {
    if (!action) {
      toast.error('Please select an action');
      return;
    }

    if (action === 'reject' && !comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (action === 'request_redo' && !comment.trim()) {
      toast.error('Please explain what needs to be redone');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sharedGoalsService.verifyTask({
        taskId: task.id,
        action,
        comment: comment.trim() || undefined,
        verifierId
      });

      if (result) {
        toast.success(
          action === 'approve' ? 'Task approved successfully!' :
          action === 'reject' ? 'Task rejected' :
          'Redo requested'
        );
        onVerified(result);
        onClose();
      } else {
        toast.error('Failed to verify task. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying task:', error);
      toast.error('An error occurred while verifying the task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAction(null);
    setComment('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const actionConfig = {
    approve: {
      color: 'green',
      icon: CheckCircle,
      title: 'Approve Task',
      description: 'Confirm that this task has been completed successfully',
      buttonText: 'Approve Task'
    },
    reject: {
      color: 'red',
      icon: XCircle,
      title: 'Reject Task',
      description: 'Mark this task as not completed or unsatisfactory',
      buttonText: 'Reject Task'
    },
    request_redo: {
      color: 'yellow',
      icon: RefreshCw,
      title: 'Request Redo',
      description: 'Ask your partner to redo or improve this task',
      buttonText: 'Request Redo'
    }
  };

  const currentConfig = action ? actionConfig[action] : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Verify Task</h2>
                  <p className="text-sm text-gray-600">Review and verify your partner's completed task</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Task Details */}
          <div className="p-6 border-b border-gray-200">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-gray-600 mb-3">{task.description}</p>
                )}
              </div>

              {/* Task Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Completed: {new Date(task.markedDoneAt!).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Priority: {task.priority}</span>
                </div>
                {task.dueDate && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Evidence Section */}
              {task.verificationEvidence && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Evidence Provided</span>
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{task.verificationEvidence}</p>
                    {task.verificationEvidence.includes('http') && (
                      <button
                        onClick={() => setShowEvidenceModal(true)}
                        className="mt-2 flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Image className="w-4 h-4" />
                        <span>View Evidence</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Verification History */}
              {task.verificationHistory && task.verificationHistory.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Previous Actions</h4>
                  <div className="space-y-2">
                    {task.verificationHistory.map((entry, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {entry.action.replace('_', ' ').charAt(0).toUpperCase() + entry.action.slice(1)}
                          </span>
                          <span className="text-gray-500">
                            {new Date(entry.at).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.comment && (
                          <p className="text-gray-600">{entry.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Choose Your Action</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(actionConfig).map(([actionKey, config]) => (
                  <motion.button
                    key={actionKey}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAction(actionKey as any)}
                    className={`p-4 border-2 rounded-lg text-center transition-all hover:border-${config.color}-300 hover:bg-${config.color}-50`}
                  >
                    <config.icon className={`w-8 h-8 text-${config.color}-600 mx-auto mb-2`} />
                    <h5 className="font-medium text-gray-900 mb-1">{config.title}</h5>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Action Form */}
          {action && currentConfig && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 bg-${currentConfig.color}-100 rounded-lg flex items-center justify-center`}>
                    <currentConfig.icon className={`w-5 h-5 text-${currentConfig.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{currentConfig.title}</h4>
                    <p className="text-sm text-gray-600">{currentConfig.description}</p>
                  </div>
                </div>

                {/* Warning for Reject/Redo */}
                {(action === 'reject' || action === 'request_redo') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        {action === 'reject'
                          ? 'Please explain why this task doesn\'t meet expectations.'
                          : 'Please provide clear guidance on what needs to be improved.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Comment Field */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {action === 'approve' ? 'Comment (Optional)' :
                     action === 'reject' ? 'Reason for Rejection *' :
                     'What needs to be redone? *'}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      action === 'approve' ? 'Great job! You completed this task well.' :
                      action === 'reject' ? 'Please explain what was missing or incorrect...' :
                      'Please be specific about what needs to be improved...'
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">{comment.length}/500 characters</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting || (action !== 'approve' && !comment.trim())}
                  className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                    currentConfig.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                    currentConfig.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <currentConfig.icon className="w-4 h-4" />
                      <span>{currentConfig.buttonText}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Evidence Modal */}
        {showEvidenceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-60 flex items-center justify-center p-4"
            onClick={() => setShowEvidenceModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Task Evidence</h3>
                <button
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                {task.verificationEvidence?.includes('http') ? (
                  <img
                    src={task.verificationEvidence}
                    alt="Task evidence"
                    className="w-full h-auto rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap p-4 bg-gray-50 rounded-lg">
                    {task.verificationEvidence}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskVerificationModal;