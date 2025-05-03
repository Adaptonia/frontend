'use client'
import InputField from '@/components/reuseable/InputField'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

const Page = () => {
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const router = useRouter()
    
    useEffect(() => {
        // Get email and code from session storage
        const storedEmail = sessionStorage.getItem('resetEmail')
        const storedToken = sessionStorage.getItem('resetTempToken')
        const storedCode = sessionStorage.getItem('resetCode')
        
        if (!storedEmail || !storedCode) {
            // Redirect back if required data isn't available
            router.push('/forget-password')
            return
        }
        
        setEmail(storedEmail)
        setCode(storedCode)
    }, [router])
    
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
        
        setIsLoading(true)

        try {
            const response = await axios.post('/api/auth/reset-password', {
                email,
                code,
                password,
                confirmPassword
            })

            console.log("✅ Password reset successful:", response.data)
            
            // Clear session data
            sessionStorage.removeItem('resetEmail')
            sessionStorage.removeItem('resetTempToken')
            
            // Navigate to success page
            router.push('/password-changed')
        } catch (error) {
            console.error("❌ Password reset failed:", error)
            setError('Failed to reset password. Please try again or request a new code.')
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
          </div>
          
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
        </div>
      </div>
    );
}

export default Page