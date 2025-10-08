'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Plus,
  Eye,
  Edit,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { expertTaskService } from '@/services/appwrite/expertTaskService';
import { ExpertTask, TaskSubmission } from '@/database/partner-accountability-schema';
import MemberTaskSubmission from './MemberTaskSubmission';
import { toast } from 'sonner';

interface UserExpertTasksProps {
  onTaskSubmitted?: () => void;
}

const UserExpertTasks: React.FC<UserExpertTasksProps> = ({ onTaskSubmitted }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<(ExpertTask & { expertName?: string })[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [selectedTask, setSelectedTask] = useState<ExpertTask | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

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
        expertTaskService.getUserAssignedTasks(user.id),
        expertTaskService.getUserTaskSubmissions(user.id)
      ]);

      setTasks(tasksData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading expert tasks:', error);
      toast.error('Failed to load expert tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmitted = () => {
    loadData();
    setShowSubmissionForm(false);
    setSelectedTask(null);
    onTaskSubmitted?.();
  };

  const getTaskSubmission = (taskId: string): TaskSubmission | undefined => {
    return submissions.find(s => s.taskId === taskId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      case 'needs_revision':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expert tasks...</p>
        </div>
      </div>
    );
  }

  // Group tasks by status for better organization
  const pendingTasks = tasks.filter(task => {
    const submission = getTaskSubmission(task.id);
    return !submission || submission.status === 'pending';
  });

  const needsRevisionTasks = tasks.filter(task => {
    const submission = getTaskSubmission(task.id);
    return submission && submission.status === 'needs_revision';
  });

  const completedTasks = tasks.filter(task => {
    const submission = getTaskSubmission(task.id);
    return submission && (submission.status === 'approved' || submission.status === 'rejected');
  });

  const TaskCard = ({ task, submission, isOverdue }: { task: any, submission?: TaskSubmission, isOverdue: boolean }) => {
    const isSubmitted = submission && submission.status !== 'pending';
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
              {isOverdue && !isSubmitted && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  Overdue
                </span>
              )}
              {isSubmitted && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(submission.status)}`}>
                  {getStatusIcon(submission.status)}
                  <span className="capitalize">{submission.status.replace('_', ' ')}</span>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 mb-3">{task.description}</p>
            
            {/* Expert Comment for needs_revision */}
            {isSubmitted && submission.status === 'needs_revision' && submission.expertComment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <h4 className="font-medium text-yellow-800 mb-1 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Expert Feedback:</span>
                </h4>
                <p className="text-yellow-700 text-sm">{submission.expertComment}</p>
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>Expert: {task.expertName || 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Due: {formatDate(task.dueDate)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {!submission ? (
              <button
                onClick={() => {
                  setSelectedTask(task);
                  setShowSubmissionForm(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Submit</span>
              </button>
            ) : submission.status === 'needs_revision' ? (
              <button
                onClick={() => {
                  setSelectedTask(task);
                  setShowSubmissionForm(true);
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Resubmit</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedTask(task);
                  setShowSubmissionForm(true);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-purple-600" />
            <span>Expert Tasks</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Tasks assigned by your expert mentors
          </p>
        </div>
      </div>

      {/* Tasks by Status */}
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned yet</h3>
          <p className="text-gray-600">
            Your expert will assign tasks to help you achieve your goals.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Needs Revision Section */}
          {needsRevisionTasks.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Needs Revision</h3>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  {needsRevisionTasks.length}
                </span>
              </div>
              <div className="space-y-4">
                {needsRevisionTasks.map((task) => {
                  const submission = getTaskSubmission(task.id);
                  const isOverdue = new Date(task.dueDate) < new Date();
                  return (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      submission={submission} 
                      isOverdue={isOverdue} 
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Tasks Section */}
          {pendingTasks.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Pending Submission</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {pendingTasks.length}
                </span>
              </div>
              <div className="space-y-4">
                {pendingTasks.map((task) => {
                  const submission = getTaskSubmission(task.id);
                  const isOverdue = new Date(task.dueDate) < new Date();
                  return (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      submission={submission} 
                      isOverdue={isOverdue} 
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {completedTasks.length}
                </span>
              </div>
              <div className="space-y-4">
                {completedTasks.map((task) => {
                  const submission = getTaskSubmission(task.id);
                  const isOverdue = new Date(task.dueDate) < new Date();
                  return (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      submission={submission} 
                      isOverdue={isOverdue} 
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Submission Modal */}
      {showSubmissionForm && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Task Submission</h3>
              <button
                onClick={() => {
                  setShowSubmissionForm(false);
                  setSelectedTask(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <MemberTaskSubmission
                task={selectedTask}
                existingSubmission={getTaskSubmission(selectedTask.id)}
                onSubmissionUpdated={handleTaskSubmitted}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserExpertTasks;