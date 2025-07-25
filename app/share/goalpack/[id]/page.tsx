'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Star, ArrowRight, Download, CheckCircle, Play } from 'lucide-react';
import { GoalPack } from '@/lib/types';
import { getGoalPackById } from '@/services/appwrite/goalPackService';
import Link from 'next/link';
import Image from 'next/image';

interface SharePageProps {
  params: {
    id: string;
  };
}

const SharePage: React.FC<SharePageProps> = ({ params }) => {
  const [goalPack, setGoalPack] = useState<GoalPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoalPack = async () => {
      try {
        setLoading(true);
        const pack = await getGoalPackById(params.id);
        setGoalPack(pack);
      } catch (err) {
        console.error('Error loading goal pack:', err);
        setError('Goal pack not found or no longer available');
      } finally {
        setLoading(false);
      }
    };

    loadGoalPack();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amazing goal pack...</p>
        </div>
      </div>
    );
  }

  if (error || !goalPack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image src="/blueLogo.png" alt="Error" width={64} height={64} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Goal Pack Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This goal pack may have been removed or is no longer available.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Explore Other Goal Packs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Adaptonia</h1>
                <p className="text-sm text-gray-500">Transform dreams into achievable goals</p>
              </div>
            </div>
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 overflow-y-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Goal Pack Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Image src="/blueLogo.png" alt="Adaptonia" width={64} height={64} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{goalPack.title}</h2>
                <p className="text-gray-500 capitalize">{goalPack.category} • For {goalPack.targetUserType === 'all' ? 'All Users' : goalPack.targetUserType}</p>
              </div>
            </div>

            {goalPack.description && (
              <p className="text-gray-700 mb-6 leading-relaxed">{goalPack.description}</p>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Structured goal framework</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Progress tracking tools</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Smart reminders & motivation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Community support</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                <Users className="w-4 h-4" />
                Join thousands of users achieving their goals
              </div>
              <p className="text-blue-700 text-sm">
                This goal pack has helped many people transform their dreams into reality. 
                Start your journey today!
              </p>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Main CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Dreams?</h3>
              <p className="text-blue-100 mb-6">
                Join Adaptonia and start your journey towards achieving your goals. 
                Get access to this goal pack and hundreds more.
              </p>
              
              <div className="space-y-4">
                <Link
                  href="/signup"
                  className="w-full bg-white text-blue-600 px-6 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Your Journey - It's Free!
                </Link>
                
                <Link
                  href="/login"
                  className="w-full border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Why Choose Adaptonia?</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Smart goal tracking with AI insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700">Personalized motivation & reminders</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">Community of goal achievers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-gray-700">Progress analytics & insights</span>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">4.8/5 from 2,000+ users</span>
              </div>
              <p className="text-gray-700 text-sm italic">
                "Adaptonia helped me achieve goals I never thought possible. The structured approach and community support made all the difference." - Sarah M.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Transform your dreams into achievable goals with Adaptonia
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-700">Terms</Link>
              <Link href="/contact" className="hover:text-gray-700">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SharePage; 