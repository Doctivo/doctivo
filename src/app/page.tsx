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

  // Prevent hydration mismatch by showing a skeleton/loading state until mounted
  if (!isMounted || !hasHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Doctivo...</p>
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