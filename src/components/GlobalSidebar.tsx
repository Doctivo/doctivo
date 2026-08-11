'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';

import { Bell, Search, ChevronDown, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';

export function GlobalSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
    <div className="main-wrapper w-full min-h-screen flex flex-col md:flex-row">
      <BottomNav />
      <div className="flex-1 flex flex-col md:pl-64 w-full min-h-screen relative">
        {/* Desktop Top Header */}
        <div className="hidden md:flex h-20 items-center justify-between px-8 bg-slate-50 dark:bg-slate-950 w-full z-40 sticky top-0">
          {/* Search */}
          <div className="relative w-96 cursor-pointer" onClick={() => window.location.href = '/doctors'}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder={t("Search by specialty...")}
              className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none transition-all text-sm font-medium dark:text-slate-100 shadow-sm cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-100"
              readOnly
            />
          </div>
          
          {/* Profile & Notifications */}
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1.5 right-2 h-2.5 w-2.5 bg-blue-600 rounded-full border-2 border-slate-50 dark:border-slate-950"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <Link href="/profile" className="flex items-center gap-3 group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 pr-3 rounded-full transition-colors">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                {user?.imageUrl ? (
                  <Image src={user.imageUrl} alt="Profile" width={40} height={40} className="object-cover w-full h-full" />
                ) : (
                  <UserCircle className="h-full w-full text-slate-400" />
                )}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{user?.name?.split(' ')[0] || 'User'}</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t("View Profile")}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 ml-1 hidden lg:block" />
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
