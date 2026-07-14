'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, Settings, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

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

      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex fixed top-0 left-0 bottom-0 w-[250px] bg-white border-r border-slate-200 z-50 flex-col">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30">
              D
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800">DOCTIVO</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 px-4 py-8 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest",
                  isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        

      </div>
    </>
  );
}