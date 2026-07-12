'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, ChevronLeft, RefreshCcw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { DOCTOR_CATEGORIES } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getDoctors } from '@/app/actions/doctor-actions';
import { Doctor } from '@/lib/types';
import Image from 'next/image';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
}

function DoctorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterSpecialtyFromQuery = searchParams.get('specialty');
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);

  const userLat = parseFloat(searchParams.get('lat') || '');
  const userLng = parseFloat(searchParams.get('lng') || '');
  const isHomeVisit = searchParams.get('mode') === 'Home';
  const patientId = searchParams.get('patientId') || '';
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(filterSpecialtyFromQuery || 'All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDoctors = async () => {
    setIsLoading(true);
    const data = await getDoctors(selectedCategory === 'All' ? undefined : selectedCategory);
    setDoctors(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (filterSpecialtyFromQuery) {
      setSelectedCategory(filterSpecialtyFromQuery);
    }
  }, [filterSpecialtyFromQuery]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    loadDoctors();
  }, [selectedCategory, isAuthenticated, router, hasHydrated]);

  const processedDoctors = useMemo(() => {
    let list = [...doctors];
    const mode = searchParams.get('mode');
    if (mode) {
      list = list.filter(doc => (doc.consultationModes || '').includes(mode));
    }
    if (search) {
      list = list.filter(doc => 
        doc.name.toLowerCase().includes(search.toLowerCase()) || 
        doc.specialty.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (isHomeVisit && !isNaN(userLat) && !isNaN(userLng)) {
      list = list.map(doc => ({ ...doc, distance: getDistance(userLat, userLng, doc.latitude ?? 26.7606, doc.longitude ?? 83.3731) }));
      list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      const within10 = list.filter(d => (d.distance || 0) <= 10);
      return within10.length > 0 ? { items: within10, type: 'within10' as const } : { items: list.filter(d => (d.distance || 0) <= 30), type: 'within30' as const };
    }
    return { items: list, type: 'standard' as const };
  }, [doctors, search, isHomeVisit, userLat, userLng, searchParams]);

  if (!hasHydrated) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-[480px] mx-auto pb-24 bg-white min-h-screen">
      <div className="bg-white sticky top-0 z-20 border-b border-border shadow-sm">
        <div className="p-4 flex items-center gap-3 bg-white">
          <button onClick={() => router.push('/home')} className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl border border-border">
            <ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search doctor or clinic..." className="pl-9 h-11 bg-slate-50 border-border rounded-xl font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="px-4 pb-4 overflow-x-auto scroll-hide flex space-x-2">
          {DOCTOR_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={cn("flex items-center space-x-2 px-5 py-2 rounded-full border transition-all font-bold text-xs whitespace-nowrap", selectedCategory === cat.name ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-border text-slate-600")}>
              <span>{cat.icon}</span><span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Available Doctors</h2>
          <Button onClick={loadDoctors} variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><RefreshCcw className={isLoading ? "animate-spin" : ""} /></Button>
        </div>

        {processedDoctors.type === 'within30' && processedDoctors.items.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 font-bold text-xs">📍 No therapists found within 10km. Suggesting specialists within 30km range.</div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary mb-4" /><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Searching Profiles...</p></div>
          ) : processedDoctors.items.length > 0 ? processedDoctors.items.map((doc) => (
            <Card 
              key={doc.id} 
              onClick={() => router.push(`/book/${doc.id}?mode=${isHomeVisit ? 'Home' : 'Clinic'}${patientId ? `&patientId=${patientId}` : ''}`)}
              className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-white border-2 cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex space-x-4">
                    <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden relative border border-border">{doc.imageUrl ? <Image src={doc.imageUrl} alt={doc.name} fill className="object-cover" /> : <span className="text-3xl">🏥</span>}</div>
                    <div className="space-y-0.5">
                      <div className="flex items-center flex-wrap gap-1.5"><h3 className="font-black text-slate-900 text-[14px] uppercase tracking-tight">{doc.name}</h3>{doc.distance !== undefined && <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-black">{doc.distance.toFixed(1)} km away</span>}</div>
                      <p className="text-[11px] font-bold text-primary leading-tight uppercase tracking-tighter">{doc.specialty}</p>
                      <p className="text-[11px] font-bold text-slate-500">{doc.qualification || 'MBBS, MD'} • {doc.experience}</p>
                    </div>
                  </div>
                  <div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fee</p><p className="text-lg font-black text-slate-900 leading-none">₹{doc.fees}</p></div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center text-[11px] font-bold text-slate-400 max-w-[200px] truncate"><MapPin className="h-3 w-3 mr-1.5 text-red-500 fill-red-500/20" />{doc.address}</div>
                  <Button size="sm" className="h-11 px-8 rounded-xl font-black bg-primary shadow-lg shadow-primary/20 text-xs">Book Slot</Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border-2 border-slate-100 border-dashed"><Search className="h-12 w-12" /></div>
              <div className="space-y-1"><p className="text-slate-900 font-black text-lg">No specialists found</p><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Try adjusting filters or go to Admin to add doctors.</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DoctorsPage() { return <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>}><DoctorsContent /></Suspense>; }