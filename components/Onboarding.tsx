"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdaptoniaOnboarding() {
  const [currentScreen, setCurrentScreen] = useState(0);

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
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="relative w-full flex justify-center">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-full p-2 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 3v4c0 .6-.4 1-1 1H5"></path>
                  <path d="M14 15v1c0 2-1.3 3-3 3s-3-1-3-3v-1"></path>
                  <path d="M17 8V7c0-2-1.3-3-3-3s-3 1-3 3v1"></path>
                  <path d="M16 8h-2"></path>
                  <path d="M13 15H5"></path>
                  <path d="M20 11h1v8h-8v-8h6"></path>
                  <path d="M12 3h8v8h-1"></path>
                </svg>
              </div>
              <div className="bg-yellow-500 rounded-full p-2 flex items-center justify-center">
                <img
                  src="/api/placeholder/60/60"
                  alt="food"
                  className="rounded-full"
                />
              </div>
              <div className="bg-gray-200 rounded-full p-2 flex items-center justify-center">
                <img
                  src="/api/placeholder/60/60"
                  alt="cyclist"
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 w-full flex justify-center">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-full p-2 flex items-center justify-center">
                <img
                  src="/api/placeholder/60/60"
                  alt="business person"
                  className="rounded-full"
                />
              </div>
              <div className="bg-gray-900 rounded-full p-2 flex items-center justify-center relative">
                <img
                  src="/api/placeholder/80/80"
                  alt="weightlifter"
                  className="rounded-full"
                />
              </div>
              <div className="bg-green-100 rounded-full p-2 flex items-center justify-center">
                <img
                  src="/api/placeholder/60/60"
                  alt="plant growth"
                  className="rounded-full"
                />
              </div>
            </div>
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
        <div className="relative w-full">
          <div className="w-full relative">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="bg-white rounded-full p-2 absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center justify-center text-blue-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 12c.7 0 1.4.1 2 .3V8c0-1.1-.9-2-2-2h-4v4h4zm0 2c.3 0 .7 0 1 .1A5 5 0 0 0 14 18c0 .3 0 .7.1 1H6a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h4v4H7l5 4 5-4h-4V6h4c1.1 0 2 .9 2 2v7.8c-1.1-2-3.5-3.8-7-3.8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="w-full overflow-hidden pt-4">
              <div className="w-full aspect-square bg-white flex items-center justify-center rounded-b-full overflow-hidden">
                <div className="grid grid-cols-3 gap-1">
                  <img
                    src="/api/placeholder/75/75"
                    alt="person 1"
                    className="rounded-md"
                  />
                  <img
                    src="/api/placeholder/75/75"
                    alt="person 2"
                    className="rounded-md"
                  />
                  <img
                    src="/api/placeholder/75/75"
                    alt="person 3"
                    className="rounded-md"
                  />
                  <img
                    src="/api/placeholder/75/75"
                    alt="person 4"
                    className="rounded-md"
                  />
                  <img
                    src="/api/placeholder/75/75"
                    alt="person 5"
                    className="rounded-md"
                  />
                  <img
                    src="/api/placeholder/75/75"
                    alt="person 6"
                    className="rounded-md"
                  />
                  <img
                    src="/api/placeholder/75/75"
                    alt="person 7"
                    className="rounded-md"
                  />
                  <img
                    src="/api/placeholder/75/75"
                    alt="person 8"
                    className="rounded-md"
                  />
                  <img
                    src="/api/placeholder/75/75"
                    alt="person 9"
                    className="rounded-md"
                  />
                </div>
              </div>
            </div>
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
        <div className="flex flex-col items-center justify-center">
          <div className="w-full h-64 bg-white rounded-lg flex items-center justify-center">
            <div className="text-blue-500 flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <p className="text-2xl font-bold mt-4">Join Our Community</p>
            </div>
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

    if (nextScreen === 3) {
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
            {/* Background image would typically go here with CSS */}
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

            {/* Navigation Button (only for first 3 screens) */}
            <div className="flex justify-center">
              <button
                onClick={handleNext}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-blue-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
