'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');
  const source = searchParams.get('source') || 'web';
  const environment = searchParams.get('env') || 'production';

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (source) {
        sessionStorage.setItem('doctivo_payment_source', source);
        localStorage.setItem('doctivo_payment_source', source);
      }
    }
  }, [source]);

  const launchCashfree = async () => {
    if (!sessionId) {
      setErrorMsg('Payment session ID is missing or expired.');
      setIsLoading(false);
      return;
    }

    if (!(window as any).Cashfree) {
      setErrorMsg('Payment Gateway script failed to load. Please refresh.');
      setIsLoading(false);
      return;
    }

    try {
      const cashfree = await (window as any).Cashfree({
        mode: environment || 'production'
      });

      cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: "_self"
      });
    } catch (err: any) {
      console.error('Cashfree launch error:', err);
      setErrorMsg(err.message || 'Failed to launch payment checkout.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <Script 
        src="https://sdk.cashfree.com/js/v3/cashfree.js" 
        onLoad={launchCashfree}
      />

      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Lock className="h-8 w-8" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Secure Payment</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Doctivo Payment Gateway</p>
        </div>

        {errorMsg ? (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold space-y-3">
            <p>{errorMsg}</p>
            <Button variant="outline" className="w-full font-bold" onClick={() => router.replace('/appointments')}>
              Return to Appointments
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Redirecting to Payment...</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Please wait while we open Cashfree Payment Gateway.</p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>256-bit Encrypted • Cashfree Checkout</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
