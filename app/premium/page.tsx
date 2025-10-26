'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { paystackService } from '@/services/paystackService';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const PremiumPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'unlimited'>('professional');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user || !user.id || !user.email) {
      toast.error('Please login to subscribe');
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const planDetails = paystackService.getPlanDetails(selectedPlan);
      const reference = paystackService.generateReference(user.id);

      // Initialize Paystack payment
      const response = await paystackService.initializePayment({
        email: user.email,
        amount: planDetails.amountInKobo,
        reference,
        plan: selectedPlan,
        metadata: {
          userId: user.id,
          plan: selectedPlan,
        },
      });

      // Verify payment on backend
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: response.reference,
          userId: user.id,
          plan: selectedPlan,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        toast.success('Subscription activated successfully!');
        router.push('/dashboard');
      } else {
        toast.error(verifyData.message || 'Payment verification failed');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Payment cancelled') {
        toast.info('Payment cancelled');
      } else {
        console.error('Payment error:', error);
        toast.error('An error occurred during payment');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#2196F3] from-20% to-white to-80%">
      {/* Header with back button */}
      <header className="pt-10 px-6">
        <Link href="/dashboard" className="text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-10 pb-6">
        {/* Premium icon */}
        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mb-6">
          <Image 
            src="/logo.png" 
            alt="Premium" 
            width={70} 
            height={70} 
          />
        </div>

        {/* Title */}
        <h1 className="text-white text-3xl font-semibold mb-6">Try Premium for FREE</h1>

        {/* Features */}
        <div className="mb-10 w-full">
         
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center mr-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-white">Priority support and personalized coaching</p>
          </div>
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center mr-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-white">Exclusive goal templates and expert insights</p>
          </div>
        </div>

        {/* Subscription options */}
        <div className="w-full space-y-4">
          {/* Starter Plan - 6 Weeks */}
          <div
            className={`bg-white p-4 rounded-xl flex justify-between items-center ${selectedPlan === 'starter' ? 'border-2 border-blue-700' : ''}`}
            onClick={() => setSelectedPlan('starter')}
          >
            <div>
              <p className="font-semibold text-xs">6 Weeks</p>
              <p className="text-gray-500 text-xs">1 dedicated mentor</p>
            </div>
            <div className="flex items-center">
              <p className="mr-4 font-semibold text-xs">₦40,000</p>
              <div className={`w-6 h-6 rounded-full border-2 ${selectedPlan === 'starter' ? 'border-blue-500' : 'border-gray-300'}`}>
                {selectedPlan === 'starter' && (
                  <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Plan - 12 Weeks */}
          <div
            className={`relative bg-white p-4 rounded-xl flex justify-between items-center ${selectedPlan === 'professional' ? 'border-2 border-[#229FDB]' : ''}`}
            onClick={() => setSelectedPlan('professional')}
          >
            {/* Popular badge */}
            <div className="absolute -top-3 left-3 bg-[#E89E43] px-3 py-1 rounded-full text-black text-xs font-medium">
              Popular
            </div>

            <div>
              <p className="font-semibold text-xs">12 Weeks</p>
              <p className="text-gray-500 text-xs">2 expert mentors</p>
            </div>

            <div className="flex items-center">
              <p className="mr-4 font-semibold text-xs">₦60,000</p>
              <div className={`w-6 h-6 rounded-full border-2 ${selectedPlan === 'professional' ? 'border-blue-500' : 'border-gray-300'}`}>
                {selectedPlan === 'professional' && (
                  <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Unlimited Plan - 6 Months */}
          <div
            className={`relative bg-white p-4 rounded-xl flex justify-between items-center ${selectedPlan === 'unlimited' ? 'border-2 border-purple-700' : ''}`}
            onClick={() => setSelectedPlan('unlimited')}
          >
            {/* Best Value badge */}
            <div className="absolute -top-3 left-3 bg-purple-600 px-3 py-1 rounded-full text-white text-xs font-medium">
              Best Value
            </div>

            <div>
              <p className="font-semibold text-xs">6 Months</p>
              <p className="text-gray-500 text-xs">Unlimited expert mentors</p>
            </div>

            <div className="flex items-center">
              <p className="mr-4 font-semibold text-xs">₦100,000</p>
              <div className={`w-6 h-6 rounded-full border-2 ${selectedPlan === 'unlimited' ? 'border-blue-500' : 'border-gray-300'}`}>
                {selectedPlan === 'unlimited' && (
                  <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Free trial text */}
        <p className="text-black text-center mt-10 mb-4">
          Start your {selectedPlan} journey. <span className="opacity-70">Cancel anytime</span>
        </p>

        {/* Upgrade button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-[#229FDB] text-white font-medium py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Upgrade Now'}
        </button>

        {/* Page indicator dots */}
        <div className="flex justify-center space-x-1 mt-6">
          <div className="w-8 h-1 bg-black bg-opacity-20 rounded-full"></div>
        </div>
      </main>
    </div>
  );
};

export default PremiumPage; 
