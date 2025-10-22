'use client'
import InputField from '@/components/reuseable/InputField'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const Page = () => {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    
    const handleSendResetLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await axios.post('/api/auth/forgot-password', {
                email
            })

            
            // Show success message and redirect to login
            alert('Password reset email sent! Please check your email and click the reset link.')
            router.push('/login')
        } catch (error: any) {
            console.error("❌ Error sending password reset email:", error)
            
            // Handle specific error messages from the API
            if (error.response?.data?.error) {
                setError(error.response.data.error)
            } else if (error.response?.status === 500) {
                setError('Server configuration error. Please check your Appwrite settings.')
            } else if (error.response?.status === 404) {
                setError('No account found with this email address.')
            } else {
                setError('Failed to send reset email. Please check your email and try again.')
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

        {/* forget password */}
        <div className="flex-1">
          <h1 className="text-3xl font-medium mb-2">Forgot Password?</h1>
          <p className='text-md font-light mb-6 leading-5'>Don&rsquo;t worry it happens. Please enter the email associated with your account and we&rsquo;ll send you a reset link.</p>

          <div className='mb-4'>
            <InputField
              label="Email"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="-- Enter your email address --"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <Button
            onClick={handleSendResetLink}
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center mt-8">
            <p>
              Remember password?{" "}
              <Link href="/login" className="text-blue-500 font-medium">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
}

export default Page
