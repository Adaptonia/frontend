import Link from 'next/link';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export default function NavBar() {
  const isAdmin = useIsAdmin();
  
  return (
    <nav className="...">
      <div className="...">
        {/* Existing navigation items */}
        
        {/* Add admin link if user is admin */}
        {isAdmin && (
          <Link href="/admin" className="...">
            Admin
          </Link>
        )}
      </div>
    </nav>
  );
} 
