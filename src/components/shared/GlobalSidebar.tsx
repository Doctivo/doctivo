'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BottomNav } from './BottomNav';

import { Bell, Search, ChevronDown, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';

export function GlobalSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useStore(state => state.user);
  const { t } = useTranslation();
  
  // Hide sidebar on these specific routes
  const hidePaths = [
    '/', 
    '/login', 
    '/onboarding', 
    '/onboarding/part-a', 
    '/onboarding/part-b', 
    '/success', 
    '/verify',
    '/privacy-policy',
    '/terms'
  ];
  
  const isHidden = hidePaths.includes(pathname || '') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/doctor/') ||
    pathname?.startsWith('/attendant');

  if (isHidden) {
    return <div className="main-wrapper w-full min-h-screen flex flex-col">{children}</div>;
  }
  
  return (
    <div className="main-wrapper w-full min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      <BottomNav />
      <div className="flex-1 flex flex-col md:pl-64 w-full min-h-screen relative">
        {/* Desktop Top Header */}
        <div className="hidden md:flex h-24 items-center justify-between px-8 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800 w-full z-40 sticky top-0">
          {/* Search */}
          <div className="relative w-[400px] cursor-text" onClick={() => router.push('/doctors')}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder={t("Search")}
              readOnly
              className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm cursor-text focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
            />
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link 
              href="/notifications" 
              className="relative p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm h-12 w-12 flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link href="/doctors" className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 rounded-[20px] flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Quick Appointment
            </Link>
          </div>
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}


