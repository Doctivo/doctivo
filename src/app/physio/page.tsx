'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, Users, ChevronRight, 
  MapPin, Loader2, Search, ArrowLeft 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getDoctors } from '@/app/actions/doctor-actions';
import { Doctor } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

function PhysioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const user = useStore(state => state.user);
  const mode = searchParams.get('mode') || 'Clinic';
  
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [manualAddress, setManualAddress] = useState('');
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(mode === 'Clinic');

  const [pullStartY, setPullStartY] = useState<number | null>(null);
  const [pullDeltaY, setPullDeltaY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDoctors('Physiotherapist');
      // Filter by mode
      const filtered = data.filter(d => (d.consultationModes || '').includes(mode));
      setDoctors(filtered);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLocationConfirmed) {
      fetchData();
    }
  }, [mode, isLocationConfirmed]);

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
    if (pullDeltaY > 80 && !isRefreshing && isLocationConfirmed) {
      setIsRefreshing(true);
      await fetchData();
      setIsRefreshing(false);
    }
    setPullStartY(null);
    setPullDeltaY(0);
  };



  return (
    <div 
      className="max-w-[480px] mx-auto pb-24 bg-white dark:bg-slate-950 min-h-screen relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 z-50 flex justify-center transition-all duration-200 ease-out"
        style={{ top: pullDeltaY > 0 ? `${Math.min(pullDeltaY, 80)}px` : '-50px', opacity: pullDeltaY > 0 ? pullDeltaY / 80 : 0 }}
      >
        <div className="h-10 w-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
          <Loader2 className={`h-5 w-5 text-primary ${isRefreshing ? "animate-spin" : ""}`} style={{ transform: `rotate(${pullDeltaY * 2}deg)` }} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 p-6 pt-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/home')} className="h-10 w-10 rounded-full dark:hover:bg-slate-800">
            <ArrowLeft className="h-6 w-6 dark:text-slate-200" />
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Physiotherapy</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{mode} Visit Mode</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {mode === 'Home' && !isLocationConfirmed ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[2rem] border border-blue-100 dark:border-blue-800/30 space-y-6 text-center mt-10">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl mx-auto flex items-center justify-center">
              <MapPin className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Where do you need therapy?</h2>
              <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">Enter your pincode or area name to find therapists available at your doorstep.</p>
            </div>
            <div className="relative text-left">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="e.g. 273001 or Rustampur" 
                className="pl-12 h-14 bg-white dark:bg-slate-900 border-none rounded-2xl font-bold text-slate-800 dark:text-slate-100 shadow-sm"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            </div>
            <Button 
              className="w-full h-14 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20"
              disabled={!manualAddress.trim()}
              onClick={() => setIsLocationConfirmed(true)}
            >
              Find Therapists
            </Button>
          </div>
        ) : (
          <>
            {mode === 'Home' && (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                    <MapPin className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Service Area</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{manualAddress}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsLocationConfirmed(false)} className="text-blue-600 font-bold text-xs hover:bg-blue-50 rounded-xl">Edit</Button>
              </div>
            )}
            
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Finding Therapists...</p>
                </div>
              ) : doctors.length > 0 ? doctors.map((doc) => (
                <Card 
                  key={doc.id} 
                  onClick={() => router.push(`/book/${doc.id}?mode=${mode}`)}
                  className="border-border dark:border-slate-800 shadow-sm rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border-2 cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 active:scale-[0.98] transition-all"
                >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex space-x-4">
                    <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden relative border border-border">
                      {doc.imageUrl ? <Image priority src={doc.imageUrl} alt={doc.name} fill className="object-cover" /> : <span className="text-3xl">💆</span>}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-black text-slate-900 text-[14px] uppercase tracking-tight">{doc.name}</h3>
                      <p className="text-[11px] font-bold text-primary leading-tight uppercase tracking-tighter">Physiotherapist</p>
                      <p className="text-[11px] font-bold text-slate-500">{doc.qualification || 'BPT, MPT'} • {doc.experience}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fee</p>
                    <p className="text-lg font-black text-slate-900 leading-none">₹{doc.fees}</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center text-[11px] font-bold text-slate-400 max-w-[200px] truncate">
                    <MapPin className="h-3 w-3 mr-1.5 text-red-500" />{doc.address}
                  </div>
                  <Button size="sm" className="h-11 px-8 rounded-xl font-black bg-primary shadow-lg shadow-primary/20 text-xs">Book Now</Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No therapists found in this area.</p>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default function PhysioPage() { 
  return <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>}><PhysioContent /></Suspense>; 
}

