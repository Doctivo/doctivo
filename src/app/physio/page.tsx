'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, Users, ChevronRight, 
  MapPin, Loader2, Search, ArrowLeft 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
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
  
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getDoctors('Physiotherapist');
      // Filter by mode
      const filtered = data.filter(d => (d.consultationModes || '').includes(mode));
      setDoctors(filtered);
      setLoading(false);
    }
    load();
  }, [mode]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Geolocation is not supported.' });
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
        toast({ title: 'Location Locked', description: 'Showing closest therapists.' });
      },
      () => {
        setLocationLoading(false);
        toast({ variant: 'destructive', title: 'Denied', description: 'Enable GPS for better results.' });
      }
    );
  };

  return (
    <div className="max-w-[480px] mx-auto pb-24 bg-white min-h-screen">
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100 p-6 pt-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/home')} className="h-10 w-10 rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-800">Physiotherapy</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{mode} Visit Mode</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest">Find Nearby</h3>
            <Button onClick={handleLocate} disabled={locationLoading} variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-blue-600">
              {locationLoading ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
              {coords ? 'Refresh GPS' : 'Use GPS'}
            </Button>
          </div>
          <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
            {mode === 'Home' 
              ? "Showing specialized therapists who provide therapy at your doorstep." 
              : "Showing professional clinics in Gorakhpur with modern OPD setups."}
          </p>
        </div>

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
              className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-white border-2 cursor-pointer hover:border-primary/50 active:scale-[0.98] transition-all"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex space-x-4">
                    <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden relative border border-border">
                      {doc.imageUrl ? <Image src={doc.imageUrl} alt={doc.name} fill className="object-cover" /> : <span className="text-3xl">💆</span>}
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
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <Users className="h-12 w-12 text-slate-200" />
              <p className="text-slate-500 font-bold text-sm">No therapists found for {mode} visit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PhysioPage() { 
  return <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>}><PhysioContent /></Suspense>; 
}