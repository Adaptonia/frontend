"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "@/src/context/ThemeContext";

export default function AdaptoniaOnboarding() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const { setThemeColor } = useTheme();
  
  // Calculate total screens and progress
  const totalScreens = 4; // Updated to match your actual number of screens
  const progress = ((currentScreen + 1) / totalScreens) * 100;
  
  useEffect(() => {
    // Set the theme color to match the background
    setThemeColor('#229FDB');
    
    // Clean up when component unmounts
    return () => {
      setThemeColor('#ffffff'); // Reset to default
    };
  }, [setThemeColor]);

  const screens = [
    // Splash Screen
    {
      type: "splash",
      content: (
        <div className="flex flex-col items-center justify-center h-full">
          <Image alt="logo" src="/Mlogo.png" width={300} height={300} />
        </div>
      ),
    },
    // Onboarding Screen 1
    {
      title: "Lorem Ipsum dolor sit amet",
      content: (
        <div className="w-full h-full relative">
          <div className="absolute inset-0 -mx-6 mt-4">
            <Image
              src="/first-onboarding-one/Group 95.png"
              alt="food"
              className="w-full h-auto object-contain"
              width={1000}
              height={1000}
              priority
            />
          </div>
          <div className="relative z-10 h-full">
            {/* Empty div to maintain proper spacing and ensure the content area remains accessible */}
          </div>
        </div>
      ),
      description:
        "Lorem ipsum dolor sit amet consectetur. At laoreet morbi amet aliquam arcu pharetra tellus elit. Eget integer duis tortor amet purus.",
    },
    // Onboarding Screen 2
    {
      title: "Welcome to adaptonia",
      content: (
        <div className="w-full h-full relative">
          <div className="absolute inset-0 -mx-6 mt-4">
            <Image
              src="/first-onboarding-one/Group 96.png"
              alt="food"
              className="w-full h-auto object-contain"
              width={1000}
              height={1000}
              priority
            />
          </div>
          <div className="relative z-10 h-full">
            {/* Empty div to maintain proper spacing and ensure the content area remains accessible */}
          </div>
        </div>
      ),
      description:
        "Lorem ipsum dolor sit amet consectetur. At laoreet morbi amet aliquam arcu pharetra tellus elit. Eget integer duis tortor amet purus.",
    },
    // Onboarding Screen 3
    {
      title: "Achieve Your Goals",
      content: (
        <div className="w-full h-full relative">
          <div className="absolute inset-0 -mx-6 -mt-6">
            <Image
              src="/first-onboarding-one/Group 97.png"
              alt="food"
              className="w-full h-auto object-contain"
              width={1000}
              height={1000}
              priority
            />
          </div>
          <div className="relative z-10 h-full">
            {/* Empty div to maintain proper spacing and ensure the content area remains accessible */}
          </div>
        </div>
      ),
      description:
        "Connect with like-minded individuals on your journey to better health and wellness. Share goals, track progress, and celebrate achievements together.",
    },
    
  ];

  const router = useRouter()

  const handleNext = () => {
    const nextScreen = currentScreen + 1;

    if (nextScreen === 4) {
      router.push("/home");
    } else {
      setCurrentScreen(nextScreen);
    }
  };

  return (
    <div className='relative h-screen w-full overflow-hidden bg-[#229FDB]'>
      {/* Content Area */}
      <div className="h-full flex flex-col px-6 pt-6 pb-16">
        {screens[currentScreen].type === "signup" ? (
          <div className="flex flex-col h-full">
            <div className="flex-grow mt-auto">
              <h1 className="text-white text-4xl font-bold mb-2">
                {screens[currentScreen].title}
              </h1>
              <p className="text-white text-lg">
                {screens[currentScreen].description}
              </p>
              {screens[currentScreen].content}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col">
            {screens[currentScreen].type === "splash" ? (
              screens[currentScreen].content
            ) : (
              <>
                <div className="flex-grow flex flex-col items-center justify-center mb-6">
                  {screens[currentScreen].content}
                </div>
                <div className="mb-6">
                  <h1 className="text-white text-4xl font-bold text-center mb-4">
                    {screens[currentScreen].title}
                  </h1>
                  <p className="text-white text-center">
                    {screens[currentScreen].description}
                  </p>
                </div>
              </>
            )}

            {/* Navigation Button with circular progress */}
            <div className="flex justify-center pb-[env(safe-area-inset-bottom)]">
              <div className="relative">
                {/* SVG for circular progress */}
                <svg width="76" height="76" viewBox="0 0 76 76" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <circle 
                    cx="38" 
                    cy="38" 
                    r="34" 
                    fill="none" 
                    stroke="#3B82F6" 
                    strokeWidth="4" 
                    strokeDasharray="213.52" 
                    strokeDashoffset={213.52 - (213.52 * progress / 100)} 
                    transform="rotate(-90 38 38)" 
                  />
                </svg>
                
                {/* White circular button */}
                <button
                  onClick={handleNext}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center relative z-10"
                  aria-label="Next"
                >
                  {/* No arrow icon here */}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
