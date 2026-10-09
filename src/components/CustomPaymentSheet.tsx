'use client';

import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, CreditCard, Landmark, Wallet, QrCode, Smartphone, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CustomPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  paymentSessionId: string;
  orderId: string;
  amount: number;
  doctorName: string;
  environment: string;
}

const NETBANKING_BANKS = [
  { code: 'HDF', name: 'HDFC Bank', logo: '🏦' },
  { code: 'SBI', name: 'State Bank of India', logo: '🏦' },
  { code: 'ICI', name: 'ICICI Bank', logo: '🏦' },
  { code: 'UTI', name: 'Axis Bank', logo: '🏦' },
  { code: 'KKB', name: 'Kotak Mahindra Bank', logo: '🏦' },
  { code: 'PNB', name: 'Punjab National Bank', logo: '🏦' },
];

const WALLETS = [
  { code: 'amazonpay', name: 'Amazon Pay', logo: '👛' },
  { code: 'paytm', name: 'Paytm Wallet', logo: '👛' },
  { code: 'mobikwik', name: 'MobiKwik', logo: '👛' },
  { code: 'airtelmoney', name: 'Airtel Money', logo: '👛' },
];

import { cancelPendingBooking } from '@/actions/appointments';

export function CustomPaymentSheet({
  isOpen,
  onClose,
  paymentSessionId,
  orderId,
  amount,
  doctorName,
  environment
}: CustomPaymentSheetProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const getCashfreeInstance = async () => {
    if (!(window as any).Cashfree) {
      toast({ variant: 'destructive', title: 'Script Error', description: 'Cashfree SDK not loaded. Please refresh page.' });
      return null;
    }
    return await (window as any).Cashfree({ mode: environment || 'sandbox' });
  };

  // Launch Cashfree Modal Checkout
  const handleLaunchCheckout = async () => {
    setIsLoading(true);
    try {
      const cashfree = await getCashfreeInstance();
      if (!cashfree) { setIsLoading(false); return; }

      await cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal"
      });
    } catch (err: any) {
      console.error('Cashfree Checkout Error:', err);
      toast({ variant: 'destructive', title: 'Payment Failed', description: err.message || 'Could not open payment gateway.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSheet = async () => {
    try {
      await cancelPendingBooking(orderId);
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom duration-300 flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appointment Payment</h2>
            <p className="text-xs text-slate-500">Confirm details to proceed to secure checkout</p>
          </div>
          <button onClick={handleCloseSheet} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">

          {/* Doctor & Fee Summary */}
          <div className="bg-blue-50/50 dark:bg-slate-800/60 p-4 rounded-2xl border border-blue-100 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Dr. {doctorName}</span>
            </div>
            <div className="flex items-center justify-between border-t border-blue-100 dark:border-slate-700 pt-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consultation Fee</span>
              <span className="text-base font-black text-primary">₹{amount}</span>
            </div>
          </div>

          {/* Payment Methods Supported Preview */}
          <div className="space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Accepted Payment Methods</p>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/30 dark:bg-slate-800/30">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                <span className="text-lg">📱</span>
                <span>UPI Apps (PhonePe, GPay, Paytm, BHIM, QR)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-lg">💳</span>
                <span>Credit / Debit Cards (Visa, MasterCard, RuPay)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-lg">🏦</span>
                <span>Netbanking & Wallets</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleLaunchCheckout}
            disabled={isLoading}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <span>Proceed to Pay ₹{amount}</span>
              </>
            )}
          </Button>

        </div>

        {/* Footer Security Badge */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>256-bit Encrypted • Secured by Cashfree Payment</span>
        </div>

      </div>
    </div>
  );
}
