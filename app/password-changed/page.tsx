'use client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React from 'react'
import { CheckCircle } from 'lucide-react'

const Page = () => {
  const router = useRouter()
  
  return (
    <div className='min-h-screen p-6 flex flex-col'>
      <div className='flex-1 flex flex-col items-center justify-center'>
        <div className='mb-6 text-green-500'>
          <CheckCircle size={64} />
        </div>
        
        <h2 className='font-medium text-2xl text-center'>Password Changed</h2>
        <p className='font-light text-sm text-center text-gray-600 mt-2'>
          Your password has been changed successfully
        </p>
      </div>
      
      <div className='mt-auto'>
        <Button
          variant='primary'
          className='w-full'
          onClick={() => router.push('/login')}
        >
          Back to Login
        </Button>
      </div>
    </div>
  )
}

export default Page
