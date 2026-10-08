'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, Settings, LayoutGrid, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

export function BottomNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const user = useStore(state => state.user);

  useEffect(() => setMounted(true), []);

  const navItems = [
    { label: 'Home', icon: LayoutGrid, href: '/home' },
    { label: 'Patients', icon: Users, href: '/patient/dashboard' },
    { label: 'Bookings', icon: Calendar, href: '/appointments' },
    { label: 'Settings', icon: Settings, href: '/profile' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className={cn("md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-50", pathname?.startsWith('/book/') && "hidden")}>
        <div className="max-w-[480px] mx-auto h-20 flex items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 w-1/4 h-full transition-all",
                  isActive ? "text-primary dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px] scale-110")} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-primary dark:text-blue-400" : "text-slate-400 dark:text-slate-500")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800 z-50 p-6">
        <Link href="/home" className="flex items-center gap-3 mb-8 pl-2">
          <div className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-lg shadow-md shadow-blue-600/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-800 dark:text-slate-100">doctivo.</span>
        </Link>
        
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 pl-4">Menu</div>
        <div className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-[13px]",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Profile Card & Dark Mode Toggle */}
        <div className="mt-auto flex items-center gap-2">
          <Link href="/profile" className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors overflow-hidden">
            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-800">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">{user?.name || 'Account'}</h4>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider truncate">User Account</p>
            </div>
          </Link>
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shrink-0"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

