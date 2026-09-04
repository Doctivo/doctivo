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
      <div className="hidden md:flex flex-col max-w-6xl mx-auto p-10">
        
        {/* Desktop Carousel Banner replacing static Welcome banner */}
        <Banner homeBanners={homeBanners} user={user} isMobile={false} />

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {isLoadingData ? (
            [0, 1, 2, 3].map((i) => (
              <div key={`sk-dt-${i}`} className="rounded-[2rem] p-6 h-full flex flex-col items-center justify-center text-center animate-pulse border border-slate-100/50 bg-slate-100 dark:bg-slate-800">
                <div className="h-16 w-16 rounded-2xl mb-4 bg-slate-200 dark:bg-slate-700"></div>
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
                <div className="h-10 w-10 mt-auto rounded-full bg-slate-200 dark:bg-slate-700"></div>
              </div>
            ))
          ) : (
            quickActions.map((action, idx) => {
              const Content = (
              <div className={cn("rounded-[2rem] p-6 h-full flex flex-col items-center justify-center text-center cursor-pointer border border-transparent hover:shadow-lg transition-all group relative overflow-hidden", action.bgColor, "dark:bg-opacity-20")}>
                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-white shadow-sm dark:bg-slate-800")}>
                  <action.icon className={cn("h-7 w-7", action.textColor)} strokeWidth={2.5} />
                </div>
                <h3 className={cn("font-bold text-sm mb-2", action.textColor)}>{action.label}</h3>
                <p className={cn("text-xs mb-6 leading-relaxed px-2 opacity-80", action.textColor)}>{action.desc}</p>
                
                <div className={cn("h-10 w-10 mt-auto rounded-full flex items-center justify-center transition-transform group-hover:scale-110 bg-white shadow-sm dark:bg-slate-800", action.textColor)}>
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </div>
            );
            return action.href ? (
              <Link key={idx} href={action.href} className="h-full">{Content}</Link>
            ) : (
              <div key={idx} onClick={action.onClick} className="h-full">{Content}</div>
            );
          })
          )}
        </div>

        {/* Lower Panels */}
        <div className="grid grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{t("Upcoming Appointments")}</h3>
              <Link href="/appointments" className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">{t("View all")}</Link>
            </div>
            
            {/* Sample Appointment Card (In real app, map over actual upcoming appointments) */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 group hover:border-blue-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-5">
                <div className="text-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 w-14 shadow-sm">
                  <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">MAY</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">20</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">TUE</p>
                </div>
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex items-center justify-center">
                  <UserCircle className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-0.5">Physiotherapy Session</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dr. Neha Verma</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center mt-1 font-medium">
                    <MapPin className="h-3 w-3 mr-1" /> Care Wellness Clinic
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 pr-2">
                <p className="font-bold text-slate-600 dark:text-slate-300 text-xs flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400"/> 10:30 AM
                </p>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">
                  Confirmed
                </span>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
            
            {/* If no appointments: 
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Calendar className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No upcoming appointments</p>
            </div> */}
          </div>

          {/* Support Panel */}
          <div className="col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-6">{t("Need Help?")}</h3>
            <div className="flex gap-4">
              <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100/50 dark:border-blue-800/30">
                <Headset className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="flex-1 flex flex-col">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  {t("Our support team is available 24/7 to help you.")}
                </p>
                <Link href="/support" className="mt-auto">
                  <Button variant="outline" className="w-full justify-between h-12 rounded-xl font-bold border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                    {t("Contact Support")} <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
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

