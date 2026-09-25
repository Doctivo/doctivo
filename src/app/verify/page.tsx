'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createAppointment } from '@/actions/appointments';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';

export default function VerifyPage() {
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
        const pendingBookingStr = localStorage.getItem('pending_cashfree_booking');
        if (!pendingBookingStr) {
          setStatus('error');
          setMessage('Booking data lost. If money was deducted, please contact support.');
          return;
        }

        const pendingBooking = JSON.parse(pendingBookingStr);

        // Make sure order IDs match to prevent cross-contamination
        if (pendingBooking.orderId !== orderId) {
          setStatus('error');
          setMessage('Invalid order session.');
          return;
        }

        // 1. Verify with Cashfree API
        const verifyRes = await fetch('/api/cashfree-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId })
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
          setStatus('error');
          setMessage('Payment could not be verified or failed.');
          setTimeout(() => {
            router.replace(`/book/${pendingBooking.doc.id}`);
          }, 3000);
          return;
        }

        // 2. Create the appointment
        const { doc, user, patient, selectedDate, selectedSlot, selectedReasons, symptoms } = pendingBooking;
        
        const appData = {
          id: `${Math.floor(100000 + Math.random() * 900000)}`,
          doctorId: doc.id,
          doctorName: doc.name,
          patientId: user.id,
          patientName: patient.name,
          patientAge: patient.age,
          patientGender: patient.gender,
          patientBloodGroup: patient.blood_group,
          patientType: patient.id === user.id ? 'Self' as const : 'Family_Member' as const,
          date: selectedDate,
          time: selectedSlot,
          current_symptoms: [...selectedReasons, symptoms].filter(Boolean).join(', '),
          consultation_fee_amount: doc.fees,
          payment_status: 'Paid' as const,
          payment_mode: 'Online_UPI' as const,
          transaction_id: orderId, // using orderId so refunds work
          status: 'Confirmed' as const
        };

        const res = await createAppointment(appData as any);
        
        if (res.success) {
          addAppointmentStore({...appData, tokenNumber: res.data.token_number, visit_otp: res.data.visit_otp} as any);
          localStorage.removeItem('pending_cashfree_booking');
          setStatus('success');
          setMessage('Booking Confirmed! Redirecting...');
          
          setTimeout(() => {
            router.replace(`/success?id=${appData.id}`);
          }, 1500);
        } else {
          setStatus('error');
          setMessage(res.error || 'Failed to secure the booking. Your money will be refunded automatically.');
          // Automated refund API logic is already active in backend if there is a slot conflict, 
          // or we can explicitly call /api/refund-payment here, but the backend doesn't save the appointment anyway.
          // Let's call refund explicitly if it failed due to slot conflict
          if (res.error && res.error.includes('already booked')) {
            await fetch('/api/refund-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactionId: orderId })
            });
            setMessage('Slot was already booked. Your payment has been refunded.');
          }

          setTimeout(() => {
            router.replace(`/book/${pendingBooking.doc.id}`);
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
