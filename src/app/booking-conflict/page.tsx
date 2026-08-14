'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, RefreshCcw, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

function ConflictContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const doctorId = searchParams?.get('doctorId');
  const date = searchParams?.get('date');
  const time = searchParams?.get('time');
  const txnId = searchParams?.get('txnId');

  const [isRefunding, setIsRefunding] = useState(false);
  const [refundStatus, setRefundStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleRefund = async () => {
    if (!txnId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Transaction ID missing' });
      return;
    }

    setIsRefunding(true);
    try {
      const res = await fetch('/api/refund-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setRefundStatus('success');
        toast({ title: 'Refund Successful', description: 'Your money will be credited to your account within 5-7 working days.' });
      } else {
        setRefundStatus('error');
        toast({ variant: 'destructive', title: 'Refund Failed', description: data.error || 'Something went wrong while processing the refund.' });
      }
    } catch (err) {
      setRefundStatus('error');
      toast({ variant: 'destructive', title: 'Error', description: 'Network error occurred. Please contact support.' });
    } finally {
      setIsRefunding(false);
    }
  };

  const handleChooseAnotherSlot = () => {
    if (doctorId && txnId && refundStatus !== 'success') {
      router.push(`/book/${doctorId}?bypassTxnId=${txnId}`);
    } else if (doctorId) {
      // If already refunded, they have to pay again, so no bypassTxnId
      router.push(`/book/${doctorId}`);
    } else {
      router.push('/doctors');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md border-2 border-red-100 dark:border-red-900 shadow-xl shadow-red-500/5 bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-orange-400" />
        
        <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center space-y-6">
          <div className="h-20 w-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center border-4 border-red-100 dark:border-red-900/50">
            <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400" strokeWidth={2.5} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Slot Already Booked!</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              We're sorry, but the slot on <strong>{date}</strong> at <strong>{time}</strong> was just booked by someone else a moment ago.
            </p>
          </div>

          {refundStatus === 'success' ? (
            <div className="bg-green-50 dark:bg-green-900/30 w-full p-4 rounded-2xl border border-green-100 dark:border-green-800/50 flex flex-col items-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <p className="text-sm font-bold text-green-700 dark:text-green-400">Refund Initiated</p>
              <p className="text-xs text-green-600 dark:text-green-500">Your transaction has been refunded.</p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction Status</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Payment Successful</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">You can either claim a refund or choose another time slot without paying again.</p>
            </div>
          )}

          <div className="w-full space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {refundStatus !== 'success' && (
              <Button 
                onClick={handleChooseAnotherSlot} 
                className="w-full h-14 rounded-2xl font-black text-[15px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                Choose Another Slot
              </Button>
            )}
            
            {refundStatus !== 'success' ? (
              <Button 
                onClick={handleRefund} 
                disabled={isRefunding}
                variant="outline"
                className="w-full h-14 rounded-2xl font-bold text-red-600 dark:text-red-400 border-2 border-red-100 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200"
              >
                {isRefunding ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Refund...</>
                ) : (
                  <><CreditCard className="mr-2 h-5 w-5" /> Refund Payment</>
                )}
              </Button>
            ) : (
              <Button 
                onClick={() => router.push('/home')} 
                className="w-full h-14 rounded-2xl font-black text-[15px] bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800"
              >
                Go to Home
              </Button>
            )}
            
            <Button 
              onClick={() => router.back()} 
              variant="ghost"
              className="w-full h-12 rounded-xl font-bold text-slate-500 dark:text-slate-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingConflictPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>}>
      <ConflictContent />
    </Suspense>
  );
}

