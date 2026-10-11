'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');
  const source = searchParams.get('source') || 'web';
  const environment = searchParams.get('env') || 'production';

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && source) {
      sessionStorage.setItem('doctivo_payment_source', source);
      localStorage.setItem('doctivo_payment_source', source);
    }
    // Launch immediately on mount
    if (sessionId) {
      launchCashfree();
    }
  }, [sessionId, source]);

  const launchCashfree = async () => {
    if (!sessionId) {
      setErrorMsg('Payment session ID is missing or expired.');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
      (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
        action: 'startCashfreePayment',
        paymentSessionId: sessionId,
        orderId: orderId,
        environment: environment || 'production'
      }));
      return;
    }

    if (!(window as any).Cashfree) {
      // If Cashfree script not loaded yet, onLoad callback will handle it
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
      setErrorMsg(err.message || 'Failed to connect to payment gateway.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 select-none">
      <Script 
        src="https://sdk.cashfree.com/js/v3/cashfree.js" 
        onLoad={launchCashfree}
      />

      {errorMsg ? (
        <div className="flex flex-col items-center max-w-xs text-center space-y-4 animate-in fade-in duration-300">
          <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Unable to Connect</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{errorMsg}</p>
          </div>
          <div className="flex gap-2 w-full pt-2">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl h-11 text-xs font-bold" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
            <Button 
              className="flex-1 rounded-xl h-11 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={launchCashfree}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in duration-300 max-w-sm">
          {/* Interactive Pulsing Security Hub */}
          <div className="relative flex items-center justify-center">
            {/* Pulsing outer aura */}
            <div className="absolute h-24 w-24 rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-ping"></div>
            {/* Spinning gradient ring */}
            <div className="h-20 w-20 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
            {/* Center icon */}
            <div className="absolute h-12 w-12 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>

          {/* Clean Interactive Redirect Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-100 font-bold text-base">
              <span>Connecting to Secure Payment</span>
              <span className="flex gap-0.5">
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
                <span className="animate-bounce delay-300">.</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Redirecting you to Cashfree Gateway
            </p>
          </div>

          {/* Sleek Animated Progress Line */}
          <div className="w-44 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-2/3 animate-[pulse_1s_ease-in-out_infinite]"></div>
          </div>

          {/* Minimal security guarantee note */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pt-2">
            <span>🔒 256-bit encrypted • Do not press back</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
