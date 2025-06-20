'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getCurrentUser } from '@/src/services/appwrite/auth'
import { toast } from 'sonner'

export default function OAuthCallback() {
  const { setUser } = useAuth()
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 3

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔄 OAuth callback: Processing authentication...')
        
        // Check for OAuth error in URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')
        
        if (error) {
          console.error('❌ OAuth error:', error, errorDescription)
          toast.error('Authentication failed: ' + (errorDescription || error))
          window.location.replace('/login')
          return
        }
        
        // Small delay to ensure OAuth session is fully established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Get the authenticated user from Appwrite
        const user = await getCurrentUser()
        
        if (user) {
          console.log('✅ OAuth callback: User authenticated:', user.email)
          
          // Update auth context (same as email/password flow)
          setUser(user)
          
          // Show success message
          toast.success('Logged in successfully')
          
          // Wait a moment for context to update
          await new Promise(resolve => setTimeout(resolve, 500))
          
          console.log('📍 OAuth callback: Redirecting to dashboard...')
          
          // Redirect to dashboard (centralized flow)
          window.location.replace('/dashboard')
          
        } else {
          console.log('❌ OAuth callback: No user found, retrying...', attempts + 1, '/', maxAttempts)
          
          // Retry logic for cases where OAuth session might need more time
          if (attempts < maxAttempts) {
            setAttempts(prev => prev + 1)
            setTimeout(() => handleOAuthCallback(), 2000) // Retry after 2 seconds
          } else {
            console.error('❌ OAuth callback: Max attempts reached, no user found')
            toast.error('Authentication failed')
            window.location.replace('/login')
          }
        }
        
      } catch (error) {
        console.error('❌ OAuth callback error:', error)
        
        // Retry logic for network or temporary errors
        if (attempts < maxAttempts) {
          console.log('🔄 Retrying OAuth callback...', attempts + 1, '/', maxAttempts)
          setAttempts(prev => prev + 1)
          setTimeout(() => handleOAuthCallback(), 2000)
        } else {
          toast.error('Authentication failed')
          window.location.replace('/login')
        }
      }
    }

    handleOAuthCallback()
  }, [setUser, attempts])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we finish setting up your account
        </p>
        {/* {attempts > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Attempt {attempts + 1} of {maxAttempts + 1}
          </p>
        )} */}
      </div>
    </div>
  )
} 
