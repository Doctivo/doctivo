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
import Image from 'next/image';
import { getAppSetting } from '@/app/actions/admin-actions';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Globe } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

const PhysioDialog = dynamic(() => import('@/components/PhysioDialog'), { ssr: false });

function HomeContent() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);
  
  const [isPhysioOpen, setIsPhysioOpen] = useState(false);
  const [serverImages, setServerImages] = useState<any>(null);
  const [homeBanners, setHomeBanners] = useState<string[]>([]);
  const [bannerApi, setBannerApi] = useState<any>();
  
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

  useEffect(() => {
    if (!bannerApi) return;
    const interval = setInterval(() => {
      bannerApi.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerApi]);

  useEffect(() => {
    async function loadImages() {
      try {
        const res = await getAppSetting('homeCardImages');
        if (res.success && res.value) {
          setServerImages(res.value);
        }
        const res2 = await getAppSetting('homeBanners');
        if (res2.success && res2.value) {
          setHomeBanners(res2.value);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
    loadImages();
  }, []);

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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
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
    <div className="mobile-container pb-24 md:pb-32 min-h-screen dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <div 
            className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary font-bold overflow-hidden relative shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer"
            onClick={() => router.push('/profile')}
          >
            {user?.imageUrl ? <Image priority src={user.imageUrl} alt="User Profile" fill className="object-cover" /> : <span>{user?.name?.charAt(0) || 'U'}</span>}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={placeholderText || "Search..."} 
              className="pl-9 h-11 md:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium cursor-pointer dark:text-slate-100" 
              onClick={() => router.push('/doctors')}
              readOnly
            />
          </div>
          <button 
            onClick={() => router.push('/notifications')}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 relative border border-slate-100 dark:border-slate-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-12 pt-10 space-y-12 flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {quickActions.map((action, idx) => {
            const Content = (
              <div className={cn(
                "flex flex-col items-center justify-center p-5 md:p-6 rounded-[2rem] md:rounded-3xl shadow-sm hover:shadow-md active:scale-95 transition-all group border border-slate-100/50 dark:border-slate-800/50 cursor-pointer h-full min-h-[150px]",
                action.bgColor, "dark:bg-opacity-20"
              )}>
                <div className="mb-3 transition-transform group-hover:scale-110">
                  {serverImages && serverImages[`card${idx}`] ? (
                    <div className="h-14 w-14 md:h-16 md:w-16 relative overflow-hidden rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 bg-white">
                      <Image priority src={serverImages[`card${idx}`]} alt={action.label} fill className="object-cover" />
                    </div>
                  ) : (
                    <action.icon className={cn("h-10 w-10 md:h-12 md:w-12", action.textColor)} strokeWidth={2.5} />
                  )}
                </div>
                <span className={cn("text-[10px] md:text-[11px] font-black uppercase tracking-widest text-center leading-tight px-1", action.textColor)}>
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
        
        {homeBanners && homeBanners.length > 0 ? (
          <Carousel setApi={setBannerApi} opts={{ loop: true, align: "start" }} className="w-full">
            <CarouselContent>
              {homeBanners.map((img, idx) => (
                <CarouselItem key={idx}>
                  <div className="w-full aspect-[21/9] md:aspect-[3/1] rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Banner ${idx}`} className="w-full h-full object-cover" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
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
        )}
      </div>


      {/* Physio Choice Pop-up */}
      {isPhysioOpen && (
        <PhysioDialog isOpen={isPhysioOpen} onClose={setIsPhysioOpen} />
      )}

      {/* Language Selection Modal */}
      <Dialog open={!language && hasHydrated && isAuthenticated && user?.isProfileComplete} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md rounded-3xl" hideClose>
          <DialogHeader className="space-y-4">
            <div className="mx-auto bg-blue-100 p-4 rounded-full">
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-slate-800">
              Select Language
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500 font-bold">
              Choose your preferred language for using Doctivo. You can change this later in settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
            <Button 
              onClick={() => {
                setLanguage('en');
                toast({ title: 'Welcome!', description: 'Language set to English.' });
              }} 
              variant="outline" 
              className="h-16 text-lg font-black rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              English
            </Button>
            <Button 
              onClick={() => {
                setLanguage('hi');
                toast({ title: 'स्वागत है!', description: 'भाषा हिंदी सेट की गई है।' });
              }} 
              variant="outline" 
              className="h-16 text-lg font-black rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              हिंदी
            </Button>
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
