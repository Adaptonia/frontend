'use client'
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';

const Page = () => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  useEffect(() => {
    // Get email from session storage that was set in the forgot-password page
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (!storedEmail) {
      // Redirect back to forgot password if no email was found
      router.push('/forget-password');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  const handleInputChange = (index: number, value: string): void => {
    if (value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto-focus next input
      if (value !== '' && index < 3) {
        const nextInput = document.getElementById(`code-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleVerify = async () => {
    setError('');
    setIsLoading(true);
    
    // Combine the 4 digits into one code
    const code = verificationCode.join('');
    
    if (code.length !== 4) {
      setError('Please enter all 4 digits of the verification code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/verify-code', {
        email,
        code
      });

      
      // Store the temporary token for the reset password page
      if (response.data.tempToken) {
        sessionStorage.setItem('resetTempToken', response.data.tempToken);
        sessionStorage.setItem('resetCode', code);
      }
      
      // Navigate to reset password page
      router.push('/reset-password');
    } catch (error) {
      console.error('❌ Code verification failed:', error);
      setError('Invalid or expired verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-white">
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

      <div className="flex-1">
        <h1 className="text-3xl font-medium mb-2">
          Please check your email
        </h1>

        <p className="mt-4 text-gray-600 text-sm">
          We&apos;ve sent a code to <span className="text-gray-800 font-medium">{email}</span>
        </p>
        
        <div className="flex gap-3 mt-8 w-full">
          {verificationCode.map((digit, index) => (
            <div key={index} className="flex-1">
              <input
                id={`code-input-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className="w-full h-14 border border-gray-300 rounded-lg text-center text-xl"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        <div className="mt-8">
          <Button
            onClick={handleVerify}
            variant="primary"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Page;
