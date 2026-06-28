'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, ChevronLeft, Bell } from 'lucide-react';
import { useStore } from '@/lib/store';
import { DOCTOR_CATEGORIES } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getDoctors } from '@/app/actions/doctor-actions';
import { Doctor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

function DoctorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterSpecialtyFromQuery = searchParams.get('specialty');
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

    async function loadDoctors() {
      setIsLoading(true);
      const data = await getDoctors(selectedCategory === 'All' ? undefined : selectedCategory);
      setDoctors(data);
      setIsLoading(false);
    }
    loadDoctors();
  }, [selectedCategory, isAuthenticated, router, hasHydrated]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => 
      doc.name.toLowerCase().includes(search.toLowerCase()) || 
      doc.specialty.toLowerCase().includes(search.toLowerCase())
    );
  }, [doctors, search]);

  if (!hasHydrated) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-[480px] mx-auto pb-24 bg-white min-h-screen">
      {/* Header Section */}
      <div className="bg-white sticky top-0 z-20 border-b border-border shadow-sm">
        <div className="p-4 flex items-center gap-3 bg-white">
          <button onClick={() => router.push('/home')} className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl border border-border">
            <ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or clinic..." 
              className="pl-9 h-11 bg-slate-50 border-border rounded-xl font-medium" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="px-4 pb-4 overflow-x-auto scroll-hide flex space-x-2">
          {DOCTOR_CATEGORIES.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.name)} 
              className={cn(
                "flex items-center space-x-2 px-5 py-2 rounded-full border transition-all font-bold text-xs whitespace-nowrap", 
                selectedCategory === cat.name ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-border text-slate-600"
              )}
            >
              <span>{cat.icon}</span><span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Available Doctors</h2>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredDoctors.length} Specialists Found</span>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Searching Profiles...</p>
            </div>
          ) : filteredDoctors.length > 0 ? filteredDoctors.map((doc) => (
            <Card key={doc.id} className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-white border-2">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex space-x-4">
                    <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden relative border border-border">
                      {doc.imageUrl ? <Image src={doc.imageUrl} alt={doc.name} fill className="object-cover" /> : <span className="text-3xl">🏥</span>}
                    </div>
                    
                    <div className="space-y-0.5">
                      <h3 className="font-black text-slate-900 text-[14px] uppercase tracking-tight">{doc.name}</h3>
                      <p className="text-[11px] font-bold text-primary leading-tight uppercase tracking-tighter">
                        {doc.specialty}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500">
                        {doc.qualification || 'MBBS, MD'} • {doc.experience}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fee</p>
                    <p className="text-lg font-black text-slate-900 leading-none">₹{doc.fees}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center text-[11px] font-bold text-slate-400 max-w-[200px] truncate">
                    <MapPin className="h-3 w-3 mr-1.5 text-red-500 fill-red-500/20" />
                    {doc.address}
                  </div>

                  <Button 
                    size="sm"
                    className="h-11 px-8 rounded-xl font-black bg-primary shadow-lg shadow-primary/20 text-xs"
                    onClick={() => router.push(`/book/${doc.id}`)}
                  >
                    Book Slot
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border-2 border-slate-100 border-dashed">
                <Search className="h-12 w-12" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-black text-lg">No doctors found</p>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Try adjusting your filters or search keywords.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DoctorsPage() { 
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DoctorsContent />
    </Suspense>
  ); 
}
