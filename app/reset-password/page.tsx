'use client'
import InputField from '@/components/reuseable/InputField'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState, useEffect, Suspense } from 'react'

const ResetPasswordContent = () => {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [isValidLink, setIsValidLink] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    
    useEffect(() => {
        // Get userId and secret from URL parameters (Appwrite recovery link)
        const userId = searchParams.get('userId')
        const secret = searchParams.get('secret')
        
        if (!userId || !secret) {
            setError('Invalid or missing reset link parameters. Please request a new password reset.')
            setIsValidLink(false)
            return
        }
        
        setIsValidLink(true)
    }, [searchParams])
    
    const validatePassword = () => {
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters long')
            return false
        }
        
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match')
            return false
        }
        
        setPasswordError('')
        return true
    }
    
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setPasswordError('')
        
        if (!validatePassword()) {
            return
        }
        
        const userId = searchParams.get('userId')
        const secret = searchParams.get('secret')
        
        if (!userId || !secret) {
            setError('Invalid reset link. Please request a new password reset.')
            return
        }
        
        setIsLoading(true)

        try {
            const response = await axios.post('/api/auth/reset-password', {
                userId,
                secret,
                password
            })

            
            // Navigate to success page
            router.push('/password-changed')
        } catch (error: any) {
            console.error("❌ Password reset failed:", error)
            
            // Handle specific error messages from the API
            if (error.response?.data?.error) {
                setError(error.response.data.error)
            } else {
                setError('Failed to reset password. Please try again or request a new reset link.')
            }
        } finally {
            setIsLoading(false)
        }
    }
    
    return (
      <div className="flex flex-col min-h-screen p-6">
        {/* Back Button */}
        <div className="mb-8">
          <button className="p-1" onClick={() => router.back()}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            alt="Adaptonia Logo"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
            <p className="text-gray-600">Enter your new password below</p>
          </div>

          {!isValidLink ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div>
                <InputField
                  label="New Password"
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                />
              </div>

              <div>
                <InputField
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                />
              </div>

              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{passwordError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
          )}

          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Remember your password?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    )
}

const Page = () => {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen p-6">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
            <p className="text-gray-600">Please wait while we load the reset page</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

export default Page
