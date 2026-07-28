'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';

import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { SpecialtiesSection } from '@/components/landing/SpecialtiesSection';
import { AppPromoSection } from '@/components/landing/AppPromoSection';
import { Footer } from '@/components/landing/Footer';
import { PhysioModal } from '@/components/landing/PhysioModal';

export default function LandingPage() {
  const router = useRouter();
  const [isPhysioOpen, setIsPhysioOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);

  useEffect(() => {
    setIsMounted(true);
    if (isAuthenticated && hasHydrated) {
      router.replace('/home');
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Prevent hydration mismatch or flash of landing page if authenticated
  if (!isMounted || !hasHydrated || isAuthenticated) {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans selection:bg-blue-600 selection:text-white">
      <Header isAuthenticated={isAuthenticated} />
      <HeroSection />
      <SpecialtiesSection setIsPhysioOpen={setIsPhysioOpen} />
      <AppPromoSection />
      <Footer />
      <PhysioModal isOpen={isPhysioOpen} setIsOpen={setIsPhysioOpen} />
    </div>
  );
}