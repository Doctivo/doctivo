'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Bell, Search, MapPin, Star, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { DOCTOR_CATEGORIES } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { getDoctors } from '@/app/actions/doctor-actions';
import { Doctor } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterSpecialtyFromQuery = searchParams.get('specialty');
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(filterSpecialtyFromQuery || 'All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user && user.isProfileComplete === false) { router.push('/onboarding'); return; }

    async function loadDoctors() {
      setIsLoading(true);
      const data = await getDoctors(selectedCategory === 'All' ? undefined : selectedCategory);
      setDoctors(data);
      setIsLoading(false);
    }
    loadDoctors();
  }, [selectedCategory, isAuthenticated, user, router, hasHydrated]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => 
      doc.name.toLowerCase().includes(search.toLowerCase()) || 
      doc.specialty.toLowerCase().includes(search.toLowerCase())
    );
  }, [doctors, search]);

  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "No new alerts at the moment.",
    });
  };

  if (!hasHydrated) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-[480px] mx-auto pb-24 bg-white min-h-screen">
      {/* Header Section */}
      <div className="bg-white sticky top-0 z-20 border-b border-border">
        <div className="p-4 flex items-center gap-3 bg-white">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary font-bold overflow-hidden relative shadow-sm border border-border">
            {user?.imageUrl ? <Image src={user.imageUrl} alt="Me" fill className="object-cover" /> : <span>{user?.name?.charAt(0) || 'U'}</span>}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search doctor, clinic..." className="pl-9 h-11 bg-slate-50 border-border rounded-xl font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button 
            onClick={handleNotificationClick}
            className="p-2.5 bg-slate-50 rounded-xl text-slate-500 relative border border-border"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Specialties Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Specialties</h2>
          <div className="flex space-x-3 overflow-x-auto pb-4 scroll-hide -mx-2 px-2">
            {DOCTOR_CATEGORIES.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.name)} 
                className={cn(
                  "flex items-center space-x-2 px-5 py-2 rounded-2xl border transition-all font-bold text-sm whitespace-nowrap", 
                  selectedCategory === cat.name ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-border text-slate-600"
                )}
              >
                <span>{cat.icon}</span><span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Doctors List Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Top Rated Doctors</h2>
            <button onClick={() => { setSelectedCategory('All'); setSearch(''); }} className="text-[10px] font-black text-primary uppercase">Clear</button>
          </div>
          <div className="space-y-4 mt-0">
            {isLoading ? (
              <div className="text-center py-20"><Loader2 className="animate-spin inline-block" /></div>
            ) : filteredDoctors.length > 0 ? filteredDoctors.map((doc) => (
              <Card key={doc.id} className="border-border shadow-sm rounded-[1.5rem] overflow-hidden bg-white border">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-4">
                      {/* Doctor Profile Image (Square) */}
                      <div className="h-20 w-20 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden relative border border-border">
                        {doc.imageUrl ? <Image src={doc.imageUrl} alt={doc.name} fill className="object-cover" /> : <span className="text-3xl">🏥</span>}
                      </div>
                      
                      {/* Doctor Text Details */}
                      <div className="space-y-0.5">
                        <h3 className="font-black text-slate-900 text-[13px] uppercase tracking-tight">{doc.name}</h3>
                        <p className="text-[11px] font-bold text-slate-500 leading-tight">
                          {doc.specialty} {doc.qualification ? `— ${doc.qualification}` : '— MBBS, MD'}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400">
                          {doc.experience}
                        </p>
                      </div>
                    </div>

                    {/* Fee Section (Top Right) */}
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fee</p>
                      <p className="text-base font-black text-slate-900 leading-none">₹{doc.fees}</p>
                    </div>
                  </div>

                  {/* Bottom Row: Location and Book Button */}
                  <div className="mt-4 flex items-end justify-between">
                    {/* Locality with Pin Icon */}
                    <div className="flex items-center text-[11px] font-bold text-slate-500">
                      <MapPin className="h-3 w-3 mr-1 text-red-500 fill-red-500/20" />
                      {doc.address}
                    </div>

                    {/* Book Button */}
                    <Button 
                      size="sm"
                      className="h-10 px-8 rounded-xl font-black bg-primary shadow-lg shadow-primary/20 text-xs"
                      onClick={() => router.push(`/book/${doc.id}`)}
                    >
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="font-bold text-slate-400">No doctors found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function HomePage() { 
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  ); 
}
