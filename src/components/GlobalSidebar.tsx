'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';

export function GlobalSidebar() {
  const pathname = usePathname();
  
  // Hide sidebar on these specific routes
  const hidePaths = [
    '/', 
    '/login', 
    '/onboarding', 
    '/onboarding/part-a', 
    '/onboarding/part-b', 
    '/success', 
    '/verify'
  ];
  
  if (hidePaths.includes(pathname || '')) {
    return null;
  }
  
  return <BottomNav />;
}
