'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  FileText, 
  Calendar,
  MessageSquare,
  Send,
  Eye,
  Edit,
  Trash2,
  X,
  Link
} from 'lucide-react';
import { toast } from 'sonner';
import { expertTaskService } from '@/services/appwrite/expertTaskService';
import { useAuth } from '@/context/AuthContext';
import { ExpertTask, TaskSubmission } from '@/database/partner-accountability-schema';
import ExpertTaskForm from './ExpertTaskForm';
import SubmissionReviewModal from './SubmissionReviewModal';

interface ExpertTaskDashboardProps {
  onBack: () => void;
}

const ExpertTaskDashboard: React.FC<ExpertTaskDashboardProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ExpertTask[]>([]);
  const [submissions, setSubmissions] = useState<(TaskSubmission & { memberName?: string; taskTitle?: string })[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ExpertTask | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [tasksData, submissionsData] = await Promise.all([
        expertTaskService.getExpertTasks(user.id),
        expertTaskService.getExpertTaskSubmissions(user.id)
      ]);

      setTasks(tasksData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    loadData();
  };

  const handleSubmissionUpdated = () => {
    loadData();
  };

  const handleReviewSubmission = async (submissionId: string, status: 'approved' | 'rejected' | 'needs_revision', comment?: string) => {
    try {
      await expertTaskService.updateTaskSubmission(submissionId, {
        status,
        expertComment: comment
      });
      
      toast.success(`Submission ${status.replace('_', ' ')}`);
      loadData();
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Failed to review submission');
    }
  };

  const handleOpenReviewModal = (submission: TaskSubmission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedSubmission(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await expertTaskService.deleteExpertTask(taskId);
      toast.success('Task deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'needs_revision':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
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

  const getTaskStats = () => {
    const activeTasks = tasks.filter(task => task.isActive).length;
    const totalSubmissions = submissions.length;
    const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
    const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;

    return { activeTasks, totalSubmissions, pendingSubmissions, approvedSubmissions };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600">Manage tasks and review member submissions</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowTaskForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {tasks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tasks created yet</p>
              <p className="text-sm">Create your first task to get started</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {formatDate(task.dueDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {submissions.filter(s => s.taskId === task.id).length} submissions
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowSubmissions(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View submissions"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submissions Modal */}
      {showSubmissions && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Task Submissions</h2>
                <p className="text-gray-600">{selectedTask.title}</p>
              </div>
              <button
                onClick={() => setShowSubmissions(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {submissions.filter(s => s.taskId === selectedTask.id).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter(s => s.taskId === selectedTask.id)
                    .map((submission) => (
                      <div key={submission.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {submission.memberName || 'Anonymous Member'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Submitted: {formatDate(submission.submittedAt)}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(submission.status)}`}>
                            {getStatusIcon(submission.status)}
                            <span className="capitalize">{submission.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{submission.submissionText}</p>
                        
                        {submission.submissionLink && (
                          <div className="mb-3">
                            <a
                              href={submission.submissionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                            >
                              <Link className="w-4 h-4" />
                              <span>View Evidence</span>
                            </a>
                          </div>
                        )}
                        
                        {submission.expertComment && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <p className="text-yellow-800 text-sm">
                              <strong>Your Comment:</strong> {submission.expertComment}
                            </p>
                          </div>
                        )}
                        
                        {submission.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOpenReviewModal(submission)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Review Submission</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <ExpertTaskForm
          isOpen={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {/* Submission Review Modal */}
      {showReviewModal && selectedSubmission && (
        <SubmissionReviewModal
          isOpen={showReviewModal}
          onClose={handleCloseReviewModal}
          submissionId={selectedSubmission.id}
          memberName={selectedSubmission.memberName || 'Anonymous Member'}
          submissionText={selectedSubmission.submissionText}
          submissionLink={selectedSubmission.submissionLink}
          currentStatus={selectedSubmission.status}
          onReview={handleReviewSubmission}
        />
      )}
    </div>
  );
};

export default ExpertTaskDashboard;
