
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DOCTOR_CATEGORIES } from '@/lib/mock-data';
import { ArrowRight, Sparkles } from 'lucide-react';

function CategoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recommended = searchParams.getAll('rec');

  const filteredRecommended = DOCTOR_CATEGORIES.filter(cat => 
    recommended.some(rec => rec.toLowerCase().includes(cat.name.toLowerCase()))
  );

  return (
    <div className="mobile-container flex flex-col p-6 bg-white overflow-y-auto">
      <div className="mt-6 mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Doctor Categories</h1>
        <p className="text-slate-500">Select a specialty to find best doctors</p>
      </div>

      {filteredRecommended.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Suggested for You</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredRecommended.map((cat) => (
              <Button
                key={cat.id}
                variant="outline"
                className="h-20 justify-between border-2 border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-4"
                onClick={() => router.push(`/home?specialty=${cat.name}`)}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{cat.icon}</span>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">{cat.name}</p>
                    <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">AI Recommended</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
              </Button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">All Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {DOCTOR_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => router.push(`/home?specialty=${cat.name}`)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] hover:border-primary/50 transition-all cursor-pointer group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-bold text-slate-700 text-center">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 mb-6">
        <Button 
          variant="ghost" 
          className="w-full text-slate-400"
          onClick={() => router.push('/home')}
        >
          Skip to Home
        </Button>
      </div>
    </div>
  );
}

export default function ChooseCategoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoriesContent />
    </Suspense>
  );
}

