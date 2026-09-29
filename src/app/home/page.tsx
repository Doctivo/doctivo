'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, Search, Loader2, Stethoscope, Calendar, Users, 
  UserPlus, Building2, ChevronRight, MapPin, Activity,
  ArrowRight, Headset, Clock, UserCircle
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { getAppSetting } from '@/actions/admin';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Globe } from 'lucide-react';
import Banner from '@/components/shared/Banner';

const PhysioDialog = dynamic(() => import('@/components/patient/PhysioDialog'), { ssr: false });

function HomeContent() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);
  const homeCardImagesStore = useStore(state => state.homeCardImages);
  const setHomeCardImages = useStore(state => state.setHomeCardImages);
  const homeBannersStore = useStore(state => state.homeBanners);
  const setHomeBannersStore = useStore(state => state.setHomeBanners);
  const homeDataLastFetched = useStore(state => state.homeDataLastFetched);
  const setHomeDataLastFetched = useStore(state => state.setHomeDataLastFetched);

  const [serverImages, setServerImages] = useState<Record<string, string>>({});
  const [homeBanners, setHomeBanners] = useState<any[]>([]);
  const [isPhysioOpen, setIsPhysioOpen] = useState(false);
  
  const { t } = useTranslation();
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);

  const searchPhrases = ["Search doctors...", "Find top clinics...", "Book appointments...", "Search by specialty..."];
  const [placeholderText, setPlaceholderText] = useState("");

  useEffect(() => {
    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    let timeout: NodeJS.Timeout;

    const type = () => {
      const currentPhrase = searchPhrases[currentPhraseIndex];
      
      if (isDeleting) {
        setPlaceholderText(currentPhrase.substring(0, currentCharIndex - 1));
        currentCharIndex--;
        typingSpeed = 50;
      } else {
        setPlaceholderText(currentPhrase.substring(0, currentCharIndex + 1));
        currentCharIndex++;
        typingSpeed = 100;
      }

      if (!isDeleting && currentCharIndex === currentPhrase.length) {
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % searchPhrases.length;
        typingSpeed = 500;
      }

      timeout = setTimeout(type, typingSpeed);
    };

    timeout = setTimeout(type, typingSpeed);
    return () => clearTimeout(timeout);
  }, []);

  const [pullStartY, setPullStartY] = useState<number | null>(null);
  const [pullDeltaY, setPullDeltaY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchData = async (force = false) => {
    setIsLoadingData(true);
    const now = Date.now();
    const THIRTY_MINUTES = 30 * 60 * 1000;
    
    if (
      !force &&
      homeDataLastFetched && 
      (now - homeDataLastFetched < THIRTY_MINUTES) &&
      Object.keys(homeCardImagesStore).length > 0
    ) {
      setServerImages(homeCardImagesStore);
      setHomeBanners(homeBannersStore);
      setIsLoadingData(false);
      return;
    }

    try {
      const res = await getAppSetting('homeCardImages');
      if (res.success && 'value' in res && res.value) {
        setServerImages(res.value);
        setHomeCardImages(res.value);
      }
      
      const res2 = await getAppSetting('homeBanners');
      if (res2.success && 'value' in res2 && res2.value) {
        setHomeBanners(res2.value.map((b: any) => typeof b === 'string' ? { imageUrl: b } : b));
        setHomeBannersStore(res2.value.map((b: any) => typeof b === 'string' ? { imageUrl: b } : b));
      }
      setHomeDataLastFetched(now);
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) setPullStartY(e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY !== null) {
      const delta = e.touches[0].clientY - pullStartY;
      if (delta > 0 && delta < 150) setPullDeltaY(delta);
    }
  };
  const handleTouchEnd = async () => {
    if (pullDeltaY > 80 && !isRefreshing) {
      setIsRefreshing(true);
      await fetchData(true);
      setIsRefreshing(false);
    }
    setPullStartY(null);
    setPullDeltaY(0);
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user && user.isProfileComplete === false) { router.push('/onboarding'); return; }
  }, [isAuthenticated, user, router, hasHydrated]);

  if (!hasHydrated || !isAuthenticated || (user && user.isProfileComplete === false)) {
    return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="h-24 w-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-600/20">
          <span className="text-white font-black text-5xl">D</span>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 leading-none">DOCTIVO</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{t("Loading...")}</p>
        </div>
      </div>
    </div>
  );
}
const quickActions = [
  { 
    label: t('Book Appointment'), 
    desc: t('Schedule a new appointment'),
    icon: Calendar, 
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    href: '/doctors' 
  },
  { 
    label: t('My Appointment'), 
    desc: t('View your upcoming appointments'),
    icon: Stethoscope, 
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    href: '/appointments' 
  },
  { 
    label: t('Physiotherapist'), 
    desc: t('Consult with our physiotherapy experts'),
    icon: Users, 
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    onClick: () => setIsPhysioOpen(true)
  },
  { 
    label: t('Add Patient'), 
    desc: t('Add new patient information'),
    icon: UserPlus, 
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    href: '/patient/dashboard' 
  },
];

  return (
    <div 
      className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-12"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* ---------------- MOBILE VIEW ---------------- */}
      <div className="md:hidden relative">
        {/* Pull to refresh indicator */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-50 flex justify-center transition-all duration-200 ease-out"
          style={{ top: pullDeltaY > 0 ? `${Math.min(pullDeltaY, 80)}px` : '-50px', opacity: pullDeltaY > 0 ? pullDeltaY / 80 : 0 }}
        >
          <div className="h-10 w-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <Loader2 className={cn("h-5 w-5 text-primary", isRefreshing ? "animate-spin" : "")} style={{ transform: `rotate(${pullDeltaY * 2}deg)` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-4">
            <div 
              className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary font-bold overflow-hidden relative shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer"
              onClick={() => router.push('/profile')}
            >
              {user?.imageUrl ? <Image priority src={user.imageUrl} alt="User Profile" fill className="object-cover" /> : <span>{user?.name?.charAt(0) || 'U'}</span>}
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={placeholderText || t("Search...")} 
                className="pl-9 h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium cursor-pointer dark:text-slate-100" 
                onClick={() => router.push('/doctors')}
                readOnly
              />
            </div>
            <button 
              onClick={() => router.push('/notifications')}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 relative border border-slate-100 dark:border-slate-700"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
          </div>
        </div>

        <div className="p-6 pt-10 space-y-12">
          <Banner homeBanners={homeBanners} user={user} isMobile={true} />

          <div className="grid grid-cols-2 gap-4">
            {isLoadingData ? (
              [0, 1, 2, 3].map((i) => (
                <div key={`sk-${i}`} className="flex flex-col items-center justify-center p-5 rounded-[2rem] shadow-sm animate-pulse border border-slate-100/50 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-800 h-full min-h-[150px]">
                  <div className="mb-3 h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))
            ) : (
              quickActions.map((action, idx) => {
                const Content = (
                <div className={cn(
                  "flex flex-col items-center justify-center p-5 rounded-[2rem] shadow-sm active:scale-95 transition-all border border-slate-100/50 dark:border-slate-800/50 h-full min-h-[150px]",
                  "bg-blue-100", "dark:bg-opacity-20"
                )}>
                  <div className="mb-3">
                    {serverImages && serverImages[`card${idx}`] ? (
                      <div className="h-14 w-14 relative overflow-hidden rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 bg-white">
                        <Image priority src={serverImages[`card${idx}`]} alt={action.label} fill className="object-cover" />
                      </div>
                    ) : (
                      <action.icon className={cn("h-10 w-10", "text-blue-700")} strokeWidth={2.5} />
                    )}
                  </div>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest text-center leading-tight px-1", "text-blue-700")}>
                    {action.label}
                  </span>
                </div>
              );
              return action.href ? (
                <Link key={idx} href={action.href}>{Content}</Link>
              ) : (
                <div key={idx} onClick={action.onClick}>{Content}</div>
              );
            })
            )}
          </div>
        </div>
      </div>

      {/* ---------------- DESKTOP VIEW ---------------- */}
      <div className="hidden md:block max-w-7xl mx-auto p-10 pt-6 space-y-8">
        
        {/* Desktop Hero Banner */}
        <div className="w-full bg-[#1A56DB] rounded-[2.5rem] p-12 px-16 flex items-center justify-between shadow-xl shadow-blue-600/20 relative overflow-hidden">
          <div className="w-2/3 space-y-5 relative z-10">
            <h1 className="text-4xl font-black text-white tracking-tight">Book Appointment</h1>
            <p className="text-blue-100 font-medium max-w-lg leading-relaxed text-[15px]">
              Thankyou For Visiting Our Appointment Booking App. Book verified specialist doctors and physiotherapists instantly.
            </p>
            <Link href="/doctors" className="inline-block mt-4 bg-white text-slate-900 px-8 py-3.5 rounded-full font-black text-sm hover:bg-slate-50 transition-all shadow-lg shadow-black/10 hover:scale-105">
              Book Now
            </Link>
          </div>
          <div className="relative z-10 shrink-0">
            <div className="w-[140px] h-[140px] bg-white rounded-3xl shadow-2xl flex items-center justify-center p-6 transform rotate-3 hover:rotate-0 transition-transform relative">
              <Calendar className="w-full h-full text-[#1A56DB]" strokeWidth={1.5} />
              <div className="absolute top-0 right-0 bg-[#10B981] w-8 h-8 rounded-full border-4 border-white flex items-center justify-center translate-x-2 -translate-y-2">
                <span className="text-white text-xl font-black mb-[2px] leading-none">+</span>
              </div>
              <div className="absolute bottom-0 right-0 bg-[#1A56DB] w-12 h-12 rounded-full border-4 border-white flex items-center justify-center translate-x-2 translate-y-2">
                <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          {/* Pagination dots below banner (decorative) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-6 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-6">
          <Link href="/doctors" className="bg-white rounded-[2rem] p-8 h-[200px] flex flex-col items-center justify-center text-center border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="h-16 w-16 bg-[#EFF6FF] text-[#1A56DB] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <div className="relative">
                <Calendar className="h-7 w-7" strokeWidth={2.5} />
                <div className="absolute -top-1 -right-1 bg-[#1A56DB] rounded-full p-0.5 border-2 border-[#EFF6FF]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
            </div>
            <h3 className="font-black text-[13px] uppercase tracking-wider text-[#1E293B] mb-2">Book Appointment</h3>
            <p className="text-xs font-medium text-slate-500">Schedule visit with top doctors</p>
          </Link>

          <Link href="/appointments" className="bg-white rounded-[2rem] p-8 h-[200px] flex flex-col items-center justify-center text-center border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="h-16 w-16 bg-[#EFF6FF] text-[#1A56DB] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <div className="relative">
                <Calendar className="h-7 w-7" strokeWidth={2.5} />
                <div className="absolute -top-1 -right-1 bg-[#10B981] rounded-full p-0.5 border-2 border-[#EFF6FF]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
            </div>
            <h3 className="font-black text-[13px] uppercase tracking-wider text-[#1E293B] mb-2">My Appointment</h3>
            <p className="text-xs font-medium text-slate-500">Check upcoming & past visits</p>
          </Link>

          <div onClick={() => setIsPhysioOpen(true)} className="bg-white rounded-[2rem] p-8 h-[200px] flex flex-col items-center justify-center text-center border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
            <div className="h-16 w-16 bg-[#EFF6FF] text-[#1A56DB] rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <h3 className="font-black text-[13px] uppercase tracking-wider text-[#1E293B] mb-2">Physiotherapist</h3>
            <p className="text-xs font-medium text-slate-500">Specialized muscle & rehab care</p>
          </div>

          <Link href="/patient/dashboard" className="bg-white rounded-[2rem] p-8 h-[200px] flex flex-col items-center justify-center text-center border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="h-16 w-16 bg-[#EFF6FF] text-[#1A56DB] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <div className="relative">
                <Users className="h-7 w-7" strokeWidth={2.5} />
                <div className="absolute -top-1 -right-1 bg-[#1A56DB] rounded-full p-0.5 border-2 border-[#EFF6FF]">
                  <span className="text-white text-[10px] font-black leading-none block">+</span>
                </div>
              </div>
            </div>
            <h3 className="font-black text-[13px] uppercase tracking-wider text-[#1E293B] mb-2">Add Patient</h3>
            <p className="text-xs font-medium text-slate-500">Add family members or records</p>
          </Link>
        </div>

        {/* Lower Grid: Recent Appointments & Overview */}
        <div className="grid grid-cols-3 gap-6 pt-2">
          {/* Left: Recent Appointments */}
          <div className="col-span-2 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-black text-[17px] text-slate-800 tracking-tight">My Recent Appointments</h3>
                <p className="text-xs font-medium text-slate-400 mt-1">Overview of your scheduled consultations</p>
              </div>
              <Link href="/appointments" className="text-blue-600 font-bold text-[13px] hover:underline flex items-center">
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor / Specialist</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  <tr>
                    <td className="py-5 font-black text-sm text-slate-800">Dr. Alex Smith</td>
                    <td className="py-5 font-medium text-[13px] text-slate-500">Physiotherapy Rehabilitation</td>
                    <td className="py-5 font-medium text-[13px] text-slate-500">Today, 10:30 AM</td>
                    <td className="py-5 text-right">
                      <span className="bg-[#DCFCE7] text-[#166534] px-4 py-1.5 rounded-full text-[11px] font-bold">Confirmed</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-5 font-black text-sm text-slate-800">Dr. Neha Verma</td>
                    <td className="py-5 font-medium text-[13px] text-slate-500">Spine Specialist</td>
                    <td className="py-5 font-medium text-[13px] text-slate-500">Tomorrow, 02:15 PM</td>
                    <td className="py-5 text-right">
                      <span className="bg-[#FEF9C3] text-[#A16207] px-4 py-1.5 rounded-full text-[11px] font-bold">Pending</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-5 font-black text-sm text-slate-800">Dr. R. K. Kapoor</td>
                    <td className="py-5 font-medium text-[13px] text-slate-500">General Health Checkup</td>
                    <td className="py-5 font-medium text-[13px] text-slate-500">04 Oct 2026, 11:00 AM</td>
                    <td className="py-5 text-right">
                      <span className="bg-[#EFF6FF] text-[#1D4ED8] px-4 py-1.5 rounded-full text-[11px] font-bold">Upcoming</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Overview */}
          <div className="col-span-1 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-black text-[17px] text-slate-800 tracking-tight">Overview</h3>
            <p className="text-xs font-medium text-slate-400 mt-1 mb-8">Your healthcare activity</p>

            <div className="space-y-4 flex-1">
              <div className="bg-slate-50 border border-slate-100 rounded-[1.25rem] p-5 flex items-center gap-5">
                <div className="h-12 w-12 bg-[#EFF6FF] text-[#3B82F6] rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-black text-[17px] text-slate-800 leading-tight">03</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Active Bookings</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[1.25rem] p-5 flex items-center gap-5">
                <div className="h-12 w-12 bg-[#DCFCE7] text-[#22C55E] rounded-xl flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <h4 className="font-black text-[17px] text-slate-800 leading-tight">12</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Completed Sessions</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[1.25rem] p-5 flex items-center gap-5">
                <div className="h-12 w-12 bg-[#F3E8FF] text-[#A855F7] rounded-xl flex items-center justify-center shrink-0">
                  <UserPlus className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-black text-[17px] text-slate-800 leading-tight">02</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Saved Family Profiles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Physio Choice Pop-up */}
      {isPhysioOpen && (
        <PhysioDialog isOpen={isPhysioOpen} onClose={setIsPhysioOpen} />
      )}


    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-12 animate-pulse">
      {/* Mobile Header Skeleton */}
      <div className="md:hidden bg-white dark:bg-slate-900 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      
      {/* Mobile Content Skeleton */}
      <div className="md:hidden p-6 space-y-6">
        <div className="w-full h-40 rounded-[2.5rem] bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />)}
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />)}
          </div>
        </div>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden md:flex flex-col max-w-6xl mx-auto p-10 space-y-8">
        <div className="w-full h-64 rounded-[2.5rem] bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-[2rem]" />)}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() { 
  const hasHydrated = useStore(state => state._hasHydrated);
  if (!hasHydrated) return <HomeSkeleton />;
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  ); 
}

