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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50">
      <div className="max-w-[480px] md:max-w-5xl mx-auto h-20 md:h-24 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-1/4 h-full transition-all hover:bg-slate-50 md:rounded-2xl",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              <item.icon className={cn("h-6 w-6 md:h-7 md:w-7", isActive && "stroke-[2.5px] scale-110")} />
              <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-widest", isActive ? "text-primary" : "text-slate-400")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}