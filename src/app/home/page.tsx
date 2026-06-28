'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Loader2, Calendar, Users, Stethoscope, UserPlus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

function HomeContent() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user && user.isProfileComplete === false) { router.push('/onboarding'); return; }
  }, [isAuthenticated, user, router, hasHydrated]);

  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "No new alerts at the moment.",
    });
  };

  if (!hasHydrated) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>;

  const quickActions = [
    { 
      label: 'Book Appointment', 
      icon: Calendar, 
      bgColor: 'bg-blue-600', 
      onClick: () => router.push('/doctors') 
    },
    { 
      label: 'My Appointment', 
      icon: Stethoscope, 
      bgColor: 'bg-emerald-600', 
      onClick: () => router.push('/appointments') 
    },
    { 
      label: 'Physiotherapist', 
      icon: Users, 
      bgColor: 'bg-indigo-600', 
      onClick: () => router.push('/doctors?specialty=Orthopedic') 
    },
    { 
      label: 'Add Patient', 
      icon: UserPlus, 
      bgColor: 'bg-orange-500', 
      onClick: () => router.push('/patients') 
    },
  ];

  return (
    <div className="max-w-[480px] mx-auto pb-24 bg-white min-h-screen">
      {/* Header Section */}
      <div className="bg-white sticky top-0 z-20 border-b border-border">
        <div className="p-4 flex items-center gap-3 bg-white">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary font-bold overflow-hidden relative shadow-sm border border-border">
            {user?.imageUrl ? <Image src={user.imageUrl} alt="Me" fill className="object-cover" /> : <span>{user?.name?.charAt(0) || 'U'}</span>}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search doctor, clinic..." 
              className="pl-9 h-11 bg-slate-50 border-border rounded-xl font-medium" 
              onClick={() => router.push('/doctors')}
              readOnly
            />
          </div>
          <button 
            onClick={handleNotificationClick}
            className="p-2.5 bg-slate-50 rounded-xl text-slate-500 relative border border-border"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>

      <div className="p-6 pt-10 space-y-8">
        {/* Quick Actions Grid - Solid Color Cards */}
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, idx) => (
            <button 
              key={idx}
              onClick={action.onClick}
              className={cn(
                "flex flex-col items-center justify-center p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 hover:opacity-95 active:scale-95 transition-all group aspect-square border-none",
                action.bgColor
              )}
            >
              <div className="h-16 w-16 rounded-[1.5rem] bg-white/20 flex items-center justify-center mb-4 transition-transform group-active:scale-90">
                <action.icon className="h-8 w-8 text-white" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-white text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function HomePage() { 
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  ); 
}
