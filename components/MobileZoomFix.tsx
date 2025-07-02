'use client';

import { useMobileZoomFix } from '@/hooks/useMobileZoomFix';

const MobileZoomFix = () => {
  useMobileZoomFix();
  return null; // This component doesn't render anything, it just applies the zoom fix
};

export default MobileZoomFix; 
