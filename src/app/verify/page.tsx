
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * OTP system removed. 
 * This page now serves as a redirect for any legacy paths.
 */
export default function VerifyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="mobile-container flex items-center justify-center bg-[#F8FAFF]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Redirecting to Login...</p>
      </div>
    </div>
  );
}

