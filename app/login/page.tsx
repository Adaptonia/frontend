'use client'
import InputField from '@/components/reuseable/InputField'
import { useAuth } from '@/context/AuthContext'
import { loginUser, loginWithGoogle } from '../../services/appwrite'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

const Page = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user } = useAuth()
    
   
    
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Use Appwrite's login service directly
            await loginUser(email, password)
            
            // Let AuthContext handle the user state properly
            console.log('📝 Login Page: Login successful, refreshing auth context');
            
            // Show success message
            toast.success('Logged in successfully')
            
            // Add a very short delay to ensure the toast is visible
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('📝 Login Page: Redirecting to dashboard...');
            // Use window.location.replace for a clean redirect
            window.location.replace('/dashboard');
            
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed'
            console.error('Login error:', errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    // Handle Google sign-in
    // const handleGoogleSignIn = async () => {
    //     try {
    //         setIsGoogleLoading(true);
    //         toast.info('Redirecting to Google...');
            
    //         // This will redirect the user to Google's OAuth page
    //         await loginWithGoogle();
            
    //         // The code below won't execute until the user returns from Google OAuth
    //         // because the browser navigates away from this page
    //     } catch (error) {
    //         setIsGoogleLoading(false);
    //         const errorMessage = error instanceof Error ? error.message : 'Google login failed';
    //         toast.error(errorMessage);
    //     }
    // };
    
    return (
      <div className="flex flex-col min-h-screen scrollable p-6">
        {/* Back Button */}
        <div className="mb-8">
            <Link href="/home">
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
            </svg></Link>
            
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/blueLogo.png" alt="logo" width={50} height={50} />
        </div>

        {/* sign in form */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-8">Sign In</h1>
          <InputField
            label="Email"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="-- Enter your email address --"
          />
          <InputField
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="-- Create a password --"
          />

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-blue-400 text-white font-medium py-4 rounded-full mt-4 disabled:opacity-70"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center mt-8">
            <p>
              
              <Link href="/forget-password" className="font-light cursor-pointer">
              Forgot password?
              </Link>
            </p>
          </div>

          {/* <div className="flex items-center my-8">
            <div className="flex-grow h-px bg-gray-300"></div>
            <div className="px-4 text-gray-500">Or Register with</div>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div> */}

          <div className="flex justify-between gap-4">
            {/* Facebook login - still disabled */}
            {/* <button disabled className="flex-1 border border-gray-300 py-3 rounded-lg flex items-center justify-center opacity-50 cursor-not-allowed">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="#1877F2"
                viewBox="0 0 24 24"
              >
                <path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999 0 4.99 3.656 9.126 8.437 9.879v-6.988h-2.54v-2.891h2.54V9.798c0-2.508 1.493-3.891 3.776-3.891 1.094 0 2.24.195 2.24.195v2.459h-1.264c-1.24 0-1.628.772-1.628 1.563v1.875h2.771l-.443 2.891h-2.328v6.988C18.344 21.129 22 16.992 22 12.001c0-5.522-4.477-9.999-9.999-9.999z" />
              </svg>
            </button> */}
            {/* Apple login - still disabled */}
            {/* <button disabled className="flex-1 border border-gray-300 py-3 rounded-lg flex items-center justify-center opacity-50 cursor-not-allowed">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path d="M16.365 12.778c-.002-1.198.396-2.315 1.195-3.187-.293-.752-.745-1.435-1.327-1.996-1.039-.996-2.28-1.598-3.631-1.598-1.331 0-2.148.564-2.873.564-.745 0-1.888-.534-2.762-.534-1.753.018-3.458 1.024-4.351 2.596-1.685 2.928-.432 7.256 1.189 9.628.809 1.158 1.756 2.448 2.995 2.407 1.211-.043 1.663-.771 3.131-.771 1.435 0 1.879.771 3.13.751 1.309-.02 2.122-1.161 2.926-2.32.504-.762.944-1.613 1.304-2.511-1.507-.592-2.54-2.015-2.517-3.695.019-1.104.396-2.139 1.12-2.978-.595-.556-1.389-.872-2.208-.872-1.003 0-1.978.472-2.608 1.288.63.317 1.19.823 1.593 1.478.422.663.653 1.436.663 2.223.009.79-.235 1.566-.7 2.22-.466.652-1.129 1.144-1.901 1.402.815.976 2.03 1.536 3.305 1.511 1.163-.011 2.267-.515 3.075-1.398.807-.884 1.244-2.053 1.219-3.268l-.038-.422zm-3.619-7.595c.546.005 1.084.14 1.562.393.477.252.89.615 1.197 1.057.307.443.497.953.553 1.485.053.505-.02 1.019-.211 1.489-.191.47-.491.892-.879 1.229.062-.175.119-.353.169-.533.142-.576.142-1.173 0-1.749-.142-.578-.435-1.104-.84-1.516-.422-.396-.962-.66-1.551-.757z" />
              </svg>
            </button> */}
            {/* Google login - now active */}
            {/* <button 
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="flex-1 border border-gray-300 py-3 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-70">
              {isGoogleLoading ? 'Connecting...' : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              )}
            </button> */}
          </div>

          <div className="text-center mt-8">
            <p>
              Don&apos;t have an account?
              <Link href="/signup" className="text-blue-500 font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
}

export default Page
