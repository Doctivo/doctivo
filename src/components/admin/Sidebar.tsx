'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, UserCheck, Calendar, 
  Wallet, Download, LogOut, ShieldCheck, Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useEffect } from 'react';
import { logoutSession } from '@/app/actions/auth-actions';

const ALL_MENU_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { id: 'doctors', label: 'Doctor Catalog', icon: UserCheck, href: '/admin/doctors' },
  { id: 'bookings', label: 'Bookings Override', icon: Calendar, href: '/admin/bookings' },
  { id: 'payroll', label: 'Payroll Console', icon: Wallet, href: '/admin/payroll' },
  { id: 'settings', label: 'Platform Settings', icon: Settings, href: '/admin/settings' },
  { id: 'admins', label: 'Sub-Admins', icon: ShieldCheck, href: '/admin/admins' },
  { id: 'exporter', label: 'Bulk Exporter', icon: Download, href: '/admin/exporter' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const admin = useStore(state => state.admin);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const logout = useStore(state => state.logout);

  useEffect(() => {
    if (!isAuthenticated || !admin) {
      router.push('/login');
    }
  }, [isAuthenticated, admin, router]);

  const handleLogout = async () => {
    try {
      await logoutSession();
      logout();
      window.location.href = '/login';
    } catch (e) {
      router.replace('/login');
    }
  };

  const filteredMenuItems = ALL_MENU_ITEMS.filter(item => {
    if (!admin) return false;
    if (admin.role === 'Super Admin' || admin.email === 'admin@doctivo.com') return true;

    const perms = admin.permissions;
    if (!perms) return false;

    switch (item.id) {
      case 'dashboard': return perms.dashboard?.view;
      case 'doctors': return perms.doctors?.view;
      case 'bookings': return perms.bookings?.view;
      case 'payroll': return perms.payroll?.view;
      case 'settings': return perms.settings?.view;
      case 'exporter': return perms.exporter?.allow_export;
      case 'admins': return false;
      default: return false;
    }
  });

  // Render logic without early returns to avoid hook mismatch
  const shouldShowSidebar = !!admin;

  if (!shouldShowSidebar) return null;

  return (
    <div className={cn(
      "w-64 bg-slate-900 h-screen sticky top-0 flex flex-col border-r border-slate-800 transition-all"
    )}>
      <div className="p-8">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <span className="text-white font-black text-xl">D</span>
          </div>
          <span className="text-white font-black text-xl tracking-tight">DOCTIVO <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded ml-1">ADMIN</span></span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="px-4 py-3 mb-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Logged in as</p>
          <p className="text-sm font-bold text-white truncate">{String(admin?.full_name || 'Administrator')}</p>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{String(admin?.role || 'Admin')}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all w-full text-sm font-medium"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

