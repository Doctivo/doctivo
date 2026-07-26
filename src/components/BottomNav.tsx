'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, Settings, LayoutGrid, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function BottomNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const navItems = [
    { label: 'Home', icon: LayoutGrid, href: '/home' },
    { label: 'Patients', icon: Users, href: '/patients' },
    { label: 'Bookings', icon: Calendar, href: '/appointments' },
    { label: 'Settings', icon: Settings, href: '/profile' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className={cn("md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50", pathname?.startsWith('/book/') && "hidden")}>
        <div className="max-w-[480px] mx-auto h-20 flex items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 w-1/4 h-full transition-all",
                  isActive ? "text-primary" : "text-slate-400"
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px] scale-110")} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-primary" : "text-slate-400")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Top Navbar */}
      <div className="hidden md:flex sticky top-0 left-0 right-0 h-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-50 flex-row items-center justify-between pl-8 pr-12 shadow-sm">
        <Link href="/home" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30">
            D
          </div>
          <span className="font-black text-xl tracking-tight text-slate-800 dark:text-slate-100">DOCTIVO</span>
        </Link>
        
        <div className="flex flex-row gap-6 items-center h-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center h-full px-2 transition-all font-black text-[13px] uppercase tracking-widest border-b-2",
                  isActive ? "border-primary text-primary" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}