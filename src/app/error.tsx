'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Crash:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-[480px] w-full bg-white border border-slate-100 shadow-2xl rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
        {/* Error Decoration */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-red-500/5 rounded-full -mr-10 -mt-10 blur-2xl" />
        
        {/* Branding & Icon */}
        <div className="space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl overflow-hidden shadow-md">
            <Image 
              src="/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg" 
              alt="Logo" 
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Something Went Wrong</h2>
          <p className="text-sm font-medium text-slate-400 leading-relaxed">
            We encountered an unexpected error while processing your request. Our medical team has been alerted.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-slate-300 pt-2 uppercase tracking-tighter">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-4 pt-4">
          <Button 
            onClick={() => reset()}
            className="h-14 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="h-5 w-5" /> Try Again
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              onClick={() => router.push('/home')}
              className="h-14 border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" /> Dashboard
            </Button>
            <Button 
              variant="outline"
              className="h-14 border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2"
              onClick={() => window.open('https://wa.me/917307986604', '_blank')}
            >
              <MessageCircle className="h-4 w-4" /> Support
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] pt-4">
          Emergency Recovery Mode Active
        </p>
      </div>
    </div>
  );
}
