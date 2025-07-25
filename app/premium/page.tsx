'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const PremiumPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="flex flex-col min-h-screen  bg-gradient-to-b from-[#2196F3] from-20% to-white to-80%">
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
            <p className="text-white">Unlimited goal tracking with advanced analytics</p>
          </div>
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
          {/* Monthly option */}
          <div 
            className={`bg-white p-4 rounded-xl flex justify-between items-center ${selectedPlan === 'monthly' ? 'border-2 border-blue-700' : ''}`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className=''>
              <p className="font-semibold text-xs">1 Month</p>
            </div>
            <div className="flex items-center">
              <p className="mr-4 font-semibold text-xs">₦2,500 / month</p>
              <div className={`w-6 h-6 rounded-full border-2 ${selectedPlan === 'monthly' ? 'border-blue-500' : 'border-gray-300'}`}>
                {selectedPlan === 'monthly' && (
                  <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Yearly option with discount */}
          <div 
            className={`relative bg-white p-4 rounded-xl flex justify-between items-center ${selectedPlan === 'yearly' ? 'border-2 border-[#229FDB]' : ''}`}
            onClick={() => setSelectedPlan('yearly')}
          >
            {/* Save badge */}
            <div className="absolute -top-3 left-3 bg-[#E89E43] px-3 py-1 rounded-full text-black text-xs font-medium">
              Save 50%
            </div>
            
            <div className="">
              <p className="font-semibold text-xs">12 months</p>
              <div className='flex justify-center gap-2'>
              <p className="text-gray-500 text-xs line-through">₦35,000</p>
              <p className="font-bold text-xs">₦ 25,000</p>
              </div>
              
            </div>
            
            <div className="flex items-center">
              <p className="mr-4 font-semibold text-xs">₦2,000 / month</p>
              <div className={`w-6 h-6 rounded-full border-2 ${selectedPlan === 'yearly' ? 'border-blue-500' : 'border-gray-300'}`}>
                {selectedPlan === 'yearly' && (
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
          Start your 7-day free trial. <span className="opacity-70">Cancel anytime</span>
        </p>

        {/* Upgrade button */}
        <button className="w-full bg-[#229FDB] text-white font-medium py-4 rounded-full">
          Try free and upgrade
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
