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
      <div className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-slate-50 border-r border-slate-200/50 z-50 p-6">
        <Link href="/home" className="flex items-center gap-3 mb-8 pl-2">
          <div className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-lg shadow-md shadow-blue-600/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-800">doctivo.</span>
        </Link>
        
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pl-4">Menu</div>
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
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Profile Card */}
        <Link href="/profile" className="mt-auto bg-white rounded-2xl p-3 border border-slate-200 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="font-black text-sm text-slate-800 truncate">Rohan Sharma</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">User Account</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m9 18 6-6-6-6"/></svg>
        </Link>
      </div>
    </>
  );
}
