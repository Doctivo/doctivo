'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createAppointment } from '@/actions/appointments';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';

import { Suspense } from 'react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const addAppointmentStore = useStore(state => state.addAppointment);

  useEffect(() => {
    if (!orderId) {
      router.replace('/home');
      return;
    }

    const verifyPayment = async () => {
      try {
        // 1. Verify with Backend which now handles EVERYTHING
        const { verifyAndConfirmBooking } = await import('@/actions/appointments');
        const res = await verifyAndConfirmBooking(orderId);

        if (res.success) {
          // Add to local store if needed for instant UI update
          if (res.data) {
            addAppointmentStore(res.data as any);
          }
          setStatus('success');
          setMessage('Booking Confirmed! Redirecting...');
          
          setTimeout(() => {
            router.replace(`/success?id=${res.appointmentId}`);
          }, 1500);
        } else {
          setStatus('error');
          setMessage(res.error || 'Payment verification failed.');
          setTimeout(() => {
            router.replace('/appointments'); // Redirect to appointments list where they can retry or see the failure
          }, 4000);
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('An unexpected error occurred during verification.');
      }
    };

    verifyPayment();
  }, [orderId, router, addAppointmentStore]);

  return (
    <div className="mobile-container flex flex-col items-center justify-center min-h-[70vh] p-6 bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center space-y-6 text-center bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 w-full max-w-sm">
        {status === 'loading' && (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Processing Payment</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            </div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
              <CheckCircle2 className="h-16 w-16 text-green-500 relative z-10 animate-in zoom-in" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Payment Successful</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
              <XCircle className="h-16 w-16 text-red-500 relative z-10 animate-in zoom-in" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Payment Failed</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            </div>
            <button onClick={() => router.replace('/home')} className="mt-4 px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium">
              Go to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="mobile-container flex flex-col items-center justify-center min-h-[70vh] p-6 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
