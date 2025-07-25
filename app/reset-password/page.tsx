'use client'
import InputField from '@/components/reuseable/InputField'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'

const Page = () => {
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

            console.log("✅ Password reset successful:", response.data)
            
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
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/blueLogo.png" alt="logo" width={50} height={50} />
        </div>

        {/* Reset password form */}
        <div className="flex-1 flex flex-col">
          <div>
            <h1 className="text-3xl font-medium mb-2">Reset Password</h1>
            <p className='text-md font-light mb-6 leading-5'>Please type something you&rsquo;ll remember</p>

            {!isValidLink ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <Button
                  onClick={() => router.push('/forget-password')}
                  variant="primary"
                >
                  Request New Reset Link
                </Button>
              </div>
            ) : (
              <>
                <div className='mb-4 space-y-3'>
                  <InputField
                    label="New Password"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="-- Enter Password --"
                  />
                  <InputField
                    label="Confirm New Password"
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="-- Enter Password --"
                  />
                </div>
                
                {passwordError && <p className="text-red-500 text-sm mb-4">{passwordError}</p>}
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                
                {/* Push button to bottom with margin-top:auto */}
                <div className="mt-auto pt-8">
                  <Button
                    onClick={handleResetPassword}
                    variant="primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting Password...' : 'Reset Password'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
}
export default Page
