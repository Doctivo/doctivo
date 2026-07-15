'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, Search, Loader2, Stethoscope, Calendar, Users, 
  UserPlus, Building2, ChevronRight, MapPin, Activity
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

function HomeContent() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);
  const homeCardImages = useStore(state => state.homeCardImages);
  
  const [isPhysioOpen, setIsPhysioOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user && user.isProfileComplete === false) { router.push('/onboarding'); return; }
  }, [isAuthenticated, user, router, hasHydrated]);

  if (!hasHydrated) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>;

  const quickActions = [
    { 
      label: 'Book Appointment', 
      icon: Calendar, 
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      href: '/doctors' 
    },
    { 
      label: 'My Appointment', 
      icon: Stethoscope, 
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      href: '/appointments' 
    },
    { 
      label: 'Physiotherapist', 
      icon: Users, 
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      onClick: () => setIsPhysioOpen(true)
    },
    { 
      label: 'Add Patient', 
      icon: UserPlus, 
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      href: '/patients' 
    },
  ];

  return (
    <div className="mobile-container pb-24 md:pb-32 min-h-screen">
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <div 
            className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary font-bold overflow-hidden relative shadow-sm border border-slate-100 cursor-pointer"
            onClick={() => router.push('/profile')}
          >
            {user?.imageUrl ? <Image src={user.imageUrl} alt="User Profile" fill className="object-cover" /> : <span>{user?.name?.charAt(0) || 'U'}</span>}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search doctor, clinic..." 
              className="pl-9 h-11 md:h-12 bg-slate-50 border-none rounded-xl font-medium cursor-pointer" 
              onClick={() => router.push('/doctors')}
              readOnly
            />
          </div>
          <button 
            onClick={() => router.push('/notifications')}
            className="p-2.5 bg-slate-50 rounded-xl text-slate-500 relative border border-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-12 pt-10 space-y-12 flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {quickActions.map((action, idx) => {
            const Content = (
              <div className={cn(
                "flex flex-col items-center justify-center p-6 md:p-8 rounded-[2.5rem] md:rounded-3xl shadow-sm hover:shadow-md active:scale-95 transition-all group border border-slate-100/50 cursor-pointer h-full min-h-[140px]",
                action.bgColor
              )}>
                <div className="mb-3 transition-transform group-hover:scale-110">
                  {homeCardImages && homeCardImages[idx] ? (
                    <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl overflow-hidden relative border-2 border-white shadow-sm">
                      <Image src={homeCardImages[idx]} alt={action.label} fill className="object-cover" />
                    </div>
                  ) : (
                    <action.icon className={cn("h-10 w-10 md:h-12 md:w-12", action.textColor)} strokeWidth={2.5} />
                  )}
                </div>
                <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-widest text-center leading-tight px-2", action.textColor)}>
                  {action.label}
                </span>
              </div>
            );

            return action.href ? (
              <Link key={idx} href={action.href}>{Content}</Link>
            ) : (
              <div key={idx} onClick={action.onClick}>{Content}</div>
            );
          })}
        </div>
        
        <div className="hidden md:block bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden w-full max-w-full">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <h2 className="text-3xl font-black leading-tight">Welcome Back, {user?.name?.split(' ')[0]}</h2>
            <p className="text-slate-400 font-medium">Access Gorakhpur's premium medical network. Track your live OPD queue and arrive exactly on time.</p>
            <Link href="/doctors">
              <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl font-bold mt-4">Start Booking Now</Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-blue-600/20 to-transparent"></div>
          <Stethoscope className="absolute bottom-[-20px] right-10 h-40 w-40 text-white/5 rotate-12" />
        </div>
      </div>


      {/* Physio Choice Pop-up */}
      <Dialog open={isPhysioOpen} onOpenChange={setIsPhysioOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-[3rem] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="text-center pb-6 border-b border-slate-50">
            <DialogTitle className="text-2xl font-black text-slate-800">Physiotherapy Visit</DialogTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Consultation Mode</p>
          </DialogHeader>

          <div className="space-y-4 py-8">
            <button 
              onClick={() => {
                setIsPhysioOpen(false);
                router.push('/physio?mode=Clinic');
              }}
              className="w-full p-6 rounded-[2rem] border-2 border-slate-100 hover:border-blue-600 bg-white flex items-center group transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="ml-5 text-left">
                <p className="text-lg font-black text-slate-800 leading-none">Visit Clinic</p>
                <p className="text-[10px] text-slate-400 font-black mt-2 uppercase">Professional OPD Setup</p>
              </div>
            </button>

            <button 
              onClick={() => {
                setIsPhysioOpen(false);
                router.push('/physio?mode=Home');
              }}
              className="w-full p-6 rounded-[2rem] border-2 border-slate-100 hover:border-purple-600 bg-white flex items-center group transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="h-7 w-7" />
              </div>
              <div className="ml-5 text-left">
                <p className="text-lg font-black text-slate-800 leading-none">Home Visit</p>
                <p className="text-[10px] text-slate-400 font-black mt-2 uppercase">Therapy at your doorstep</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
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