'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Target,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  TrendingUp,
  Calendar,
  MessageSquare,
  Settings,
  Award,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { partnershipService } from '@/services/appwrite/partnershipService';
import { sharedGoalsService } from '@/services/sharedGoalsService';
import partnerMatchingService from '@/services/partnerMatchingService';
import { Partnership, SharedGoal, PartnerTask } from '@/database/partner-accountability-schema';

interface PartnerDashboardProps {
  partnershipId: string;
}

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ partnershipId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([]);
  const [partnerTasks, setPartnerTasks] = useState<PartnerTask[]>([]);
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingVerifications: 0,
    completionRate: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'tasks' | 'verification'>('overview');
  const [showEndPartnershipModal, setShowEndPartnershipModal] = useState(false);

  // Load partnership data
  useEffect(() => {
    loadPartnershipData();
  }, [partnershipId]);

  const loadPartnershipData = async () => {
    try {
      setLoading(true);

      // Load partnership details
      const partnershipData = await partnershipService.getPartnership(partnershipId);
      if (!partnershipData) {
        toast.error('Partnership not found');
        return;
      }
      setPartnership(partnershipData);

      // Load shared goals
      const goals = await sharedGoalsService.getPartnershipGoals(partnershipId);
      setSharedGoals(goals);

      // Load tasks
      const tasks = await sharedGoalsService.getPartnershipTasks(partnershipId);
      setPartnerTasks(tasks);

      // Load stats
      const statsData = await sharedGoalsService.getPartnershipStats(partnershipId);
      setStats(statsData);

    } catch (error) {
      console.error('Error loading partnership data:', error);
      toast.error('Failed to load partnership data');
    } finally {
      setLoading(false);
    }
  };

  const getPartnerInfo = () => {
    if (!partnership || !user) return null;
    return partnership.user1Id === user.id
      ? { partnerId: partnership.user2Id, isUser1: true }
      : { partnerId: partnership.user1Id, isUser1: false };
  };

  const partnerInfo = getPartnerInfo();

  // Get tasks pending verification for current user
  const tasksNeedingMyVerification = partnerTasks.filter(
    task => task.partnerId === user?.id && task.verificationStatus === 'pending'
  );

  // Get my tasks pending verification
  const myTasksAwaitingVerification = partnerTasks.filter(
    task => task.ownerId === user?.id && task.verificationStatus === 'pending'
  );

  const handleEndPartnership = async () => {
    if (!user?.id || !partnershipId) return;

    try {
      const result = await partnerMatchingService.endPartnership(partnershipId, user.id);
      if (result.success) {
        toast.success(result.message);
        window.location.reload(); // Refresh to show new state
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error ending partnership:', error);
      toast.error('Failed to end partnership');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!partnership) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Partnership Not Found</h3>
        <p className="text-gray-500">The partnership you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partnership Dashboard</h1>
                <p className="text-gray-600">
                  Status: <span className={`font-medium ${
                    partnership.status === 'active' ? 'text-green-600' :
                    partnership.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {partnership.status.charAt(0).toUpperCase() + partnership.status.slice(1)}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {partnership.status === 'pending' && (
                <>
                  <button
                    onClick={async () => {
                      const result = await partnerMatchingService.acceptPartnership(partnership.id, user?.id || '');
                      if (result.success) {
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={async () => {
                      const result = await partnerMatchingService.declinePartnership(partnership.id, user?.id || '');
                      if (result.success) {
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </>
              )}
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowEndPartnershipModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            {
              title: 'Shared Goals',
              value: stats.totalGoals,
              subtitle: `${stats.completedGoals} completed`,
              icon: Target,
              color: 'blue',
              trend: stats.completedGoals > 0 ? '+' + Math.round((stats.completedGoals / stats.totalGoals) * 100) + '%' : '0%'
            },
            {
              title: 'Total Tasks',
              value: stats.totalTasks,
              subtitle: `${stats.completedTasks} verified`,
              icon: CheckCircle,
              color: 'green',
              trend: stats.completionRate + '% complete'
            },
            {
              title: 'Pending Verifications',
              value: stats.pendingVerifications,
              subtitle: 'Need attention',
              icon: Clock,
              color: 'yellow',
              trend: stats.pendingVerifications > 0 ? 'Action needed' : 'All caught up'
            },
            {
              title: 'Partnership Score',
              value: '85%', // This would be calculated based on various factors
              subtitle: 'Compatibility',
              icon: Award,
              color: 'purple',
              trend: 'Excellent match'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <span className="text-xs text-gray-500">{stat.trend}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            </motion.div>
          ))}
        </div>

        {/* Action Items */}
        {(tasksNeedingMyVerification.length > 0 || myTasksAwaitingVerification.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Action Required</h3>
            </div>
            <div className="space-y-3">
              {tasksNeedingMyVerification.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {tasksNeedingMyVerification.length} task(s) need your verification
                    </p>
                    <p className="text-sm text-gray-600">Your partner completed tasks and needs your approval</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Review Tasks
                  </button>
                </div>
              )}
              {myTasksAwaitingVerification.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {myTasksAwaitingVerification.length} of your task(s) awaiting verification
                    </p>
                    <p className="text-sm text-gray-600">Waiting for your partner to review</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    View Status
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'goals', label: 'Shared Goals', icon: Target },
                { id: 'tasks', label: 'Tasks', icon: CheckCircle },
                { id: 'verification', label: 'Verification', icon: Eye, badge: tasksNeedingMyVerification.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {partnerTasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            task.status === 'verified' ? 'bg-green-100' :
                            task.status === 'marked_done' ? 'bg-yellow-100' : 'bg-gray-100'
                          }`}>
                            {task.status === 'verified' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : task.status === 'marked_done' ? (
                              <Clock className="w-4 h-4 text-yellow-600" />
                            ) : (
                              <Target className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-sm text-gray-600">
                              {task.ownerId === user?.id ? 'Your task' : 'Partner\'s task'} •
                              {task.status === 'verified' ? ' Verified' :
                               task.status === 'marked_done' ? ' Pending verification' : ' In progress'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(task.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Chart Placeholder */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Progress charts coming soon</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'goals' && (
                <motion.div
                  key="goals"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Shared Goals</h3>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" />
                      <span>New Goal</span>
                    </button>
                  </div>

                  {sharedGoals.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No shared goals yet</h4>
                      <p className="text-gray-600 mb-6">Create your first shared goal to start your accountability journey</p>
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Create First Goal
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sharedGoals.map((goal) => (
                        <div key={goal.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              goal.category === 'finance' ? 'bg-green-100 text-green-800' :
                              goal.category === 'career' ? 'bg-blue-100 text-blue-800' :
                              goal.category === 'schedule' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {goal.category}
                            </span>
                            {goal.isCompleted && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>
                              {goal.ownerId === user?.id ? 'Your goal' : 'Partner\'s goal'}
                            </span>
                            {goal.deadline && (
                              <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>

                  {partnerTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h4>
                      <p className="text-gray-600">Tasks will appear here once you create shared goals</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {partnerTasks.map((task) => (
                        <div key={task.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              task.status === 'verified' ? 'bg-green-100 text-green-800' :
                              task.status === 'marked_done' ? 'bg-yellow-100 text-yellow-800' :
                              task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>
                              {task.ownerId === user?.id ? 'Your task' : 'Partner\'s task'}
                            </span>
                            <span>
                              Priority: {task.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'verification' && (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Task Verification</h3>

                  {tasksNeedingMyVerification.length === 0 ? (
                    <div className="text-center py-12">
                      <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks to verify</h4>
                      <p className="text-gray-600">You're all caught up! Tasks will appear here when your partner marks them as done.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tasksNeedingMyVerification.map((task) => (
                        <div key={task.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <span className="text-xs text-yellow-600 font-medium">
                              Marked done {new Date(task.markedDoneAt!).toLocaleDateString()}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          )}
                          {task.verificationEvidence && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Evidence provided:</p>
                              <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                                {task.verificationEvidence}
                              </p>
                            </div>
                          )}
                          <div className="flex space-x-3">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                              Approve
                            </button>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                              Reject
                            </button>
                            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                              Request Redo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
                <h3 className="text-xl font-semibold text-gray-900">End Partnership</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to end this partnership? This action cannot be undone.
                You will be able to find a new partner after this.
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
                  End Partnership
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