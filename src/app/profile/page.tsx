'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserCircle, MapPin, Edit3, Users, History, 
  Settings, LogOut, ChevronRight,
  HeartPulse, MessageCircleQuestion, Download
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { logoutSession } from '@/app/actions/auth-actions';

export default function ProfilePage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const isAuthenticated = useStore(state => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      // 1. Clear server sessions (cookies)
      await logoutSession();
      // 2. Clear client state (Zustand & LocalStorage)
      logout();
      // 3. Force hard redirect to login to clear all memory
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback redirect
      router.replace('/login');
    }
  };

  if (!isAuthenticated) return null;

  const menuItems = [
    { label: 'Edit Profile', subLabel: 'Update Name, Age, Location', icon: Edit3, color: 'bg-blue-50 text-blue-500', href: '/onboarding' },
    { label: 'Manage Family', subLabel: 'Add Mother, Father or Spouse', icon: Users, color: 'bg-indigo-50 text-indigo-500', href: '/patients' },
    { label: 'Medical History Log', subLabel: 'Vitals: Blood Group, Height, Weight', icon: HeartPulse, color: 'bg-purple-50 text-purple-500', href: '/onboarding' },
    { label: 'Past Appointments', subLabel: 'View your booking history', icon: History, color: 'bg-green-50 text-green-500', href: '/appointments' },
    { label: 'My Downloads', subLabel: 'Access saved tickets & receipts', icon: Download, color: 'bg-orange-50 text-orange-500', href: '/profile/downloads' },
    { label: 'Help & Support', subLabel: 'Contact clinic support', icon: MessageCircleQuestion, color: 'bg-yellow-50 text-yellow-500', href: '#' },
    { label: 'Settings', subLabel: 'App Preferences', icon: Settings, color: 'bg-slate-50 text-slate-500', href: '#' },
  ];

  return (
    <div className="mobile-container pb-24 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Profile Header */}
      <div className="bg-white p-8 pt-12 rounded-b-[3rem] shadow-sm flex flex-col items-center border-b border-border">
        <div className="h-28 w-28 bg-slate-50 rounded-full flex items-center justify-center mb-4 relative ring-4 ring-slate-100 overflow-hidden border border-border">
          {user?.imageUrl ? (
            <Image src={user.imageUrl} alt="P" fill className="object-cover" />
          ) : (
            <UserCircle className="h-16 w-16 text-slate-300" />
          )}
          <button 
            onClick={() => router.push('/onboarding')}
            className="absolute bottom-1 right-1 bg-primary h-8 w-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg"
          >
            <Edit3 className="h-3 w-3 text-white" />
          </button>
        </div>
        
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{user?.name || 'Full Name'}</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">+91 {user?.phone || '9807XXXXXX'}</p>
        
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-black text-[9px] uppercase">
            <MapPin className="h-2.5 w-2.5 mr-1" /> {user?.city || 'Gorakhpur'}, {user?.state || 'UP'}
          </Badge>
          <Badge className="bg-red-50 text-red-600 border-none px-3 py-1 font-black text-[9px] uppercase">
            {user?.blood_group || 'O+'}
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Settings Group */}
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Account Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <button 
                key={item.label}
                onClick={() => item.href !== '#' && router.push(item.href)}
                className="w-full bg-white p-4 rounded-[1.5rem] shadow-sm border border-border flex items-center group active:scale-95 transition-all"
              >
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="ml-4 flex-1 text-left min-w-0">
                  <p className="text-sm font-black text-slate-800 leading-none">{item.label}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 truncate">{item.subLabel}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Action Zone */}
        <div className="pt-4">
          <Button 
            variant="ghost" 
            className="w-full h-16 bg-white text-red-500 font-black rounded-2xl border-2 border-red-50 shadow-sm flex items-center justify-center hover:bg-red-50 active:scale-95 transition-all"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" /> Sign Out from Device
          </Button>
          
          <p className="text-center text-[10px] text-slate-300 mt-10 font-black uppercase tracking-widest">
            Doctivo OS • v2.5.0-Gorakhpur
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
