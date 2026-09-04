'use client';

import { useRouter } from 'next/navigation';
import { Home, Search, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-[480px] w-full space-y-10">
        {/* Branding & Visual */}
        <div className="space-y-6">
          <div className="relative h-32 w-32 mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-white">
            <Image priority 
              src="/logo.png" 
              alt="Doctivo Logo" 
              fill 
              sizes="128px"
              className="object-cover"
            />
          </div>
          <div className="relative">
            <h1 className="text-[120px] font-black text-slate-200 leading-none select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center pt-8">
              <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-xl rotate-12">
                <Search className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Page Not Found</h2>
          <p className="text-slate-500 font-medium px-8 leading-relaxed">
            The medical record or page you are looking for doesn't exist or has been moved to a new clinic.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          <Button 
            onClick={() => router.push('/home')}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 transition-all"
          >
            <Home className="h-6 w-6" />
            Go Back Home
          </Button>
          
          <button 
            onClick={() => router.back()}
            className="text-slate-400 font-bold text-sm uppercase tracking-widest hover:text-slate-600 flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Go Previous
          </button>
        </div>

        {/* Support Footer */}
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em] pt-10">
          Doctivo OS • System Integrity
        </p>
      </div>
    </div>
  );
}


