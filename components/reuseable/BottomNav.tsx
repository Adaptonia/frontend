'use client'
import Link from 'next/link';
import { Home, Users, MessageCircle, User } from 'lucide-react';
import { usePathname,} from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  
   const isActive = (path: string) => {
     return pathname === path;
   };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center">
      <div className="bg-white rounded-full px-8 py-3 flex items-center gap-12 shadow-lg mb-4">
        <Link href="/" passHref>
          <div className="flex flex-col items-center cursor-pointer">
            <Home 
              size={20} 
              className={isActive('/') ? "text-black" : "text-gray-500"} 
            />
            {isActive('/') && <div className="border-b-2 border-black w-5 mt-1"></div>}
          </div>
        </Link>
        
        <Link href="/community" passHref>
          <div className="flex flex-col items-center cursor-pointer">
            <Users 
              size={20} 
              className={isActive('/community') ? "text-black" : "text-gray-500"} 
            />
            {isActive('/community') && <div className="border-b-2 border-black w-5 mt-1"></div>}
          </div>
        </Link>
        
        <Link href="/messages" passHref>
          <div className="flex flex-col items-center cursor-pointer">
            <MessageCircle 
              size={20}
              className={isActive('/messages') ? "text-black" : "text-gray-500"} 
            />
            {isActive('/messages') && <div className="border-b-2 border-black w-5 mt-1"></div>}
          </div>
        </Link>
        
        <Link href="/settings" passHref>
          <div className="flex flex-col items-center cursor-pointer">
            <div className={`w-6 h-6 rounded-full ${isActive('/settings') ? 'bg-orange-400' : 'bg-gray-300'} flex items-center justify-center`}>
              <User size={14} className="text-white" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}