'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Loader2, Stethoscope, Calendar, Users, UserPlus, Home as HomeIcon, Building2, ChevronRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function HomeContent() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);
  const { toast } = useToast();
  const [isPhysioOpen, setIsPhysioOpen] = useState(false);
  
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user && user.isProfileComplete === false) { router.push('/onboarding'); return; }
  }, [isAuthenticated, user, router, hasHydrated]);

  const handleNotificationClick = () => {
    router.push('/notifications');
  };

  if (!hasHydrated) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>;

  const quickActions = [
    { 
      label: 'Book Appointment', 
      icon: Calendar, 
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      onClick: () => router.push('/doctors') 
    },
    { 
      label: 'My Appointment', 
      icon: Stethoscope, 
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      onClick: () => router.push('/appointments') 
    },
    { 
      label: 'Physiotherapist', 
      icon: Users, 
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      onClick: () => setIsPhysioOpen(true) 
    },
    { 
      label: 'Add Patient', 
      icon: UserPlus, 
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      onClick: () => router.push('/patients') 
    },
  ];

  return (
    <div className="max-w-[480px] mx-auto pb-24 bg-white min-h-screen">
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100">
        <div className="p-4 flex items-center gap-3 bg-white">
          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary font-bold overflow-hidden relative shadow-sm border border-slate-100">
            {user?.imageUrl ? <Image src={user.imageUrl} alt="Me" fill className="object-cover" /> : <span>{user?.name?.charAt(0) || 'U'}</span>}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search doctor, clinic..." 
              className="pl-9 h-11 bg-slate-50 border-none rounded-xl font-medium" 
              onClick={() => router.push('/doctors')}
              readOnly
            />
          </div>
          <button 
            onClick={handleNotificationClick}
            className="p-2.5 bg-slate-50 rounded-xl text-slate-500 relative border border-slate-100"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>

      <div className="p-6 pt-10 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, idx) => (
            <button 
              key={idx}
              onClick={action.onClick}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-[2.5rem] shadow-sm hover:opacity-80 active:scale-95 transition-all group aspect-square border-none",
                action.bgColor
              )}
            >
              <div className="mb-4 transition-transform group-active:scale-90 bg-none p-0">
                <action.icon className={cn("h-10 w-10", action.textColor)} strokeWidth={2} />
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-widest text-center leading-tight px-2", action.textColor)}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <Dialog open={isPhysioOpen} onOpenChange={setIsPhysioOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-[2.5rem] p-6 border-none shadow-2xl bg-white">
          <DialogHeader className="text-center pb-4 border-b border-slate-50">
            <DialogTitle className="text-xl font-black text-slate-800">Physiotherapy Visit</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select Consultation Mode</p>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <button 
              onClick={() => {
                setIsPhysioOpen(false);
                router.push('/doctors?specialty=Physiotherapist&mode=Clinic');
              }}
              className="w-full p-5 rounded-[2rem] border-2 border-slate-100 hover:border-primary bg-white flex items-center group active:scale-98 transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="ml-5 text-left flex-1">
                <p className="text-base font-black text-slate-800 leading-none">Visit Clinic</p>
                <p className="text-xs text-slate-400 font-bold mt-1.5 uppercase tracking-tight">क्लिनिक पर जाएँ</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
            </button>

            <button 
              onClick={() => {
                setIsPhysioOpen(false);
                router.push('/doctors?specialty=Physiotherapist&mode=Home');
              }}
              className="w-full p-5 rounded-[2rem] border-2 border-slate-100 hover:border-primary bg-white flex items-center group active:scale-98 transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <HomeIcon className="h-7 w-7" />
              </div>
              <div className="ml-5 text-left flex-1">
                <p className="text-base font-black text-slate-800 leading-none">Home Visit</p>
                <p className="text-xs text-slate-400 font-bold mt-1.5 uppercase tracking-tight">घर पर बुलाएँ</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
}

export default function HomePage() { 
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>}>
      <HomeContent />
    </Suspense>
  ); 
}