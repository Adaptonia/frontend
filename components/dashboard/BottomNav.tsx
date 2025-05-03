// 'use client'

// import React from 'react'
// import { Home, Users, CalendarDays } from 'lucide-react'
// import Image from 'next/image'
// import Link from 'next/link'
// import { usePathname } from 'next/navigation'

// const BottomNav = () => {
//   const pathname = usePathname()

//   const isActive = (path: string) => {
//     return pathname === path
//   }

//   return (
//     // <div className="fixed bottom-0 left-0 right-0 bg-white py-3 px-6 flex justify-between items-center border-t">
//     //   <Link href="/dashboard" className="flex flex-col items-center">
//     //     <div className={`p-2 rounded-full ${isActive('/dashboard') ? 'bg-blue-100' : 'bg-gray-100'}`}>
//     //       <Home className={`w-5 h-5 ${isActive('/dashboard') ? 'text-blue-500' : 'text-gray-400'}`} />
//     //     </div>
//     //   </Link>
      
//     //   <Link href="/community" className="flex flex-col items-center">
//     //     <div className={`p-2 rounded-full ${isActive('/community') ? 'bg-blue-100' : 'bg-gray-100'}`}>
//     //       <Users className={`w-5 h-5 ${isActive('/community') ? 'text-blue-500' : 'text-gray-400'}`} />
//     //     </div>
//     //   </Link>
      
//     //   <Link href="/schedule" className="flex flex-col items-center">
//     //     <div className={`p-2 rounded-full ${isActive('/schedule') ? 'bg-blue-100' : 'bg-gray-100'}`}>
//     //       <CalendarDays className={`w-5 h-5 ${isActive('/schedule') ? 'text-blue-500' : 'text-gray-400'}`} />
//     //     </div>
//     //   </Link>
      
//     //   <Link href="/profile" className="flex flex-col items-center">
//     //     <div className={`w-8 h-8 rounded-full overflow-hidden ${isActive('/profile') ? 'ring-2 ring-blue-500' : ''}`}>
//     //       <Image src="/happy-man.jpg" alt="Profile" width={32} height={32} />
//     //     </div>
//     //   </Link>
//     // </div>
//   )
// }

// export default BottomNav 