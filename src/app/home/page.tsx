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

  if (!hasHydrated) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  const quickActions = [
    { label: 'Book Appointment', icon: Calendar, color: 'bg-blue-50 text-blue-600', onClick: () => router.push('/doctors') },
    { label: 'My Appointment', icon: Stethoscope, color: 'bg-green-50 text-green-600', onClick: () => router.push('/appointments') },
    { label: 'Physiotherapist', icon: Users, color: 'bg-purple-50 text-purple-600', onClick: () => router.push('/doctors?specialty=Orthopedic') },
    { label: 'Add Patient', icon: UserPlus, color: 'bg-orange-50 text-orange-600', onClick: () => router.push('/patients') },
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

      <div className="p-6 space-y-8">
        <div className="py-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Hello, {user?.name?.split(' ')[0] || 'User'}!</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">How can we help you today?</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, idx) => (
            <button 
              key={idx}
              onClick={action.onClick}
              className="flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-white border-2 border-slate-50 shadow-sm hover:border-primary/20 transition-all group aspect-square"
            >
              <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center mb-4 transition-transform group-active:scale-90", action.color)}>
                <action.icon className="h-8 w-8" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-600/20">
          <div className="relative z-10 space-y-4">
            <h3 className="text-xl font-black leading-tight">Book your first <br/> consultation today!</h3>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Top specialists in Gorakhpur.</p>
            <Button 
              className="bg-white text-blue-600 hover:bg-blue-50 font-black rounded-xl h-12 px-6"
              onClick={() => router.push('/doctors')}
            >
              Browse Doctors
            </Button>
          </div>
          <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/10 rounded-full blur-3xl"></div>
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
