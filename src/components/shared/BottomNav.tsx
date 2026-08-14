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
    { label: 'Patients', icon: Users, href: '/patient/dashboard' },
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

      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-50 p-6">
        <Link href="/home" className="flex items-center gap-3 mb-10 pl-2">
          <div className="h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center font-black text-lg shadow-md shadow-primary/30">
            D
          </div>
          <span className="font-black text-xl tracking-tight text-slate-800 dark:text-slate-100">DOCTIVO</span>
        </Link>
        
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                  isActive 
                    ? "bg-primary text-white dark:bg-primary dark:text-white shadow-md shadow-primary/20" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Promotional Card */}
        <div className="mt-auto bg-blue-50 dark:bg-slate-900 rounded-2xl p-5 border border-blue-100 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 leading-tight">
              Better care,<br/>better life
            </h4>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Manage your appointments and health in one place.
          </p>
          <Link href="/about">
            <button className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold text-xs py-2.5 rounded-xl transition-colors flex justify-center items-center gap-1 shadow-sm border border-slate-100 dark:border-slate-700">
              Learn More
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
