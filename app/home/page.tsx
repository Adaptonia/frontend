'use client'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { loginWithGoogle } from '@/services/appwrite/auth'

const Page = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars

//   const [isGoogleLoading, setIsGoogleLoading] = useState(false);

//   const handleGoogleSignIn = async () => {
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
    <div>
      <div>
            <div className=" h-screen w-full overflow-hidden">
              <div className="inset-0 z-0">
                <Image
                  src="/happy-man.jpg"
                  alt="Happy man in light blue outfit"
                  layout="fill"
                  className="object-cover" // or "object-cover"
                  priority
                />
                <div className="absolute h-[83vh] top-40 inset-0 bg-gradient-to-b from-transparent via-white to-white" />
              </div>
      
              {/* Content Area - Starting from the middle where white fade begins */}
              <div className="relative z-10 h-full flex flex-col px-6">
                <div className="flex flex-col h-full justify-end pb-20">
                  {/* Content starts from middle of screen where white fade begins */}
                  <div className="w-full flex flex-col gap-4">
                    <h3 className="text-2xl font-bold text-center">
                      Welcome to adaptonia
                    </h3>
                    <p className="text-center text-gray-800">
                      Lorem ipsum dolor sit amet consectetur. Dolor tincidunt at.
                    </p>
      
                    <Link
                      className="w-full py-4 bg-[#229FDB] text-white text-center rounded-full font-semibold"
                      href="/signup"
                    >
                      Signup with email
                    </Link>
      
                    {/* <button className="w-full py-4 bg-white text-black rounded-full font-semibold flex items-center justify-center shadow-md">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        className="mr-2"
                      >
                        <path
                          d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                          fill="black"
                        />
                      </svg>
                      Signup with apple
                    </button> */}
      
                    {/* <button
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}  
                      className="w-full py-4 bg-white text-black rounded-full font-semibold flex items-center justify-center shadow-md"
                    >
                      {isGoogleLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900 dark:border-white" />
                        </div>
                      ) : (
                        <>
                      <svg
                        className="mr-2"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Signup with Google
                      </>
                      )}
                    </button> */}
      
                    <div className="text-center mt-4">
                      <p className="text-black">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[#229FDB] font-semibold">
                          Sign In
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </div>
  )
}

export default Page
