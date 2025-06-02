'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getCurrentUser } from '@/src/services/appwrite/auth'
import { toast } from 'sonner'

export default function OAuthCallback() {
  const { setUser } = useAuth()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔄 OAuth callback: Processing authentication...')
        
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
          console.error('❌ OAuth callback: No user found after OAuth')
          toast.error('Authentication failed')
          window.location.replace('/login')
        }
        
      } catch (error) {
        console.error('❌ OAuth callback error:', error)
        toast.error('Authentication failed')
        window.location.replace('/login')
      }
    }

    handleOAuthCallback()
  }, [setUser])

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
      </div>
    </div>
  )
} 