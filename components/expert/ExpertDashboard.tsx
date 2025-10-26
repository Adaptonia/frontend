'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Users,
  Star,
  Award,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  CheckCircle,
  Plus,
  Edit,
  Eye,
  MessageSquare,
  ArrowLeft,
  FileText,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useExpertProfile } from '@/hooks/useExpertProfile';
import { ExpertProfile } from '@/database/partner-accountability-schema';
import ExpertProfileForm from './ExpertProfileForm';
import ExpertTaskDashboard from './ExpertTaskDashboard';

const ExpertDashboard: React.FC = () => {
  const { user } = useAuth();
  const { expertProfile, loading, loadExpertProfile } = useExpertProfile();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showTaskDashboard, setShowTaskDashboard] = useState(false);
  const [stats, setStats] = useState({
    totalClients: 0,
    activePartnerships: 0,
    averageRating: 0,
    monthlyEarnings: 0
  });

  const handleProfileCreated = (_profile: ExpertProfile) => {
    setShowProfileForm(false);
    loadExpertProfile();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading expert dashboard...</p>
        </div>
      </div>
    );
  }

  const hasExpertRole = user?.userType === 'expert' || (user as any)?.role === 'expert' || (user as any)?.isExpert === true;

  // Gate access by role (not by whether profile exists)
  if (!hasExpertRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Expert Access Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be promoted to expert status to access this dashboard.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show task dashboard if requested
  if (showTaskDashboard) {
    return (
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ExpertTaskDashboard onBack={() => setShowTaskDashboard(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back to dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expert Dashboard</h1>
                <p className="text-gray-600">Manage your expert profile and help others achieve their goals</p>
              </div>
            </div>
            <button
              onClick={() => setShowProfileForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>{expertProfile ? 'Edit Profile' : 'Create Profile'}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Partnerships</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePartnerships}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.monthlyEarnings}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Expert Profile Section */}
        {expertProfile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Overview</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Expertise Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {expertProfile.expertiseAreas.map((area, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Bio</h3>
                    <p className="text-gray-600">{expertProfile.bio}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Experience</h3>
                    <p className="text-gray-600">{expertProfile.yearsOfExperience} years of experience</p>
                  </div>

                  {expertProfile.certifications.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Certifications</h3>
                      <ul className="space-y-1">
                        {expertProfile.certifications.map((cert, index) => (
                          <li key={index} className="flex items-center space-x-2 text-gray-600">
                            <Award className="w-4 h-4 text-purple-500" />
                            <span>{cert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievements */}
              {expertProfile.achievements.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Achievements</h2>
                  <ul className="space-y-3">
                    {expertProfile.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success Stories */}
              {expertProfile.successStories.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Success Stories</h2>
                  <div className="space-y-4">
                    {expertProfile.successStories.map((story, index) => (
                      <div key={index} className="p-4 bg-green-50 rounded-lg">
                        <p className="text-gray-700">{story}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Availability Status */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Availability</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available for matching</span>
                  <div className={`w-3 h-3 rounded-full ${
                    expertProfile.isAvailableForMatching ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Max clients: {expertProfile.availability.maxClients}
                </p>
              </div>

              {/* Rating */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Rating</h3>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {expertProfile.rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-sm text-gray-500">/ 5.0</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {expertProfile.totalClientsHelped} client reviews
                </p>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">View Active Partnerships</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Client Messages</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <Crown className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Your Expert Profile</h2>
            <p className="text-gray-600 mb-6">
              Set up your expert profile to start helping others achieve their goals.
            </p>
            <button
              onClick={() => setShowProfileForm(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Profile
            </button>
          </div>
        )}

        {/* Task Management Section */}
        {expertProfile && (
          <div className="mt-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Task Management</h2>
                  <p className="text-gray-600">Create and manage tasks for your class members</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowTaskDashboard(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Manage Tasks</span>
                </motion.button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-blue-900">Create Tasks</h3>
                      <p className="text-sm text-blue-700">Assign tasks to your members</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-medium text-green-900">Review Submissions</h3>
                      <p className="text-sm text-green-700">Approve or provide feedback</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                    <div>
                      <h3 className="font-medium text-purple-900">Track Progress</h3>
                      <p className="text-sm text-purple-700">Monitor member performance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expert Profile Form Modal */}
        <ExpertProfileForm
          isOpen={showProfileForm}
          onClose={() => setShowProfileForm(false)}
          onProfileCreated={handleProfileCreated}
          existingProfile={expertProfile}
        />
      </div>
    </div>
  );
};

export default ExpertDashboard;

