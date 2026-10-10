'use client';

import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, CreditCard, Landmark, Wallet, QrCode, Smartphone, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cancelPendingBooking, payWithCashfreeS2S } from '@/actions/appointments';

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
  { code: '3022', name: 'HDFC Bank', logo: '🏦' },
  { code: '3004', name: 'State Bank of India', logo: '🏦' },
  { code: '3019', name: 'ICICI Bank', logo: '🏦' },
  { code: '3003', name: 'Axis Bank', logo: '🏦' },
  { code: '3032', name: 'Kotak Mahindra Bank', logo: '🏦' },
  { code: '3038', name: 'Punjab National Bank', logo: '🏦' },
];

const WALLETS = [
  { code: 'amazonpay', name: 'Amazon Pay', logo: '👛' },
  { code: 'paytm', name: 'Paytm Wallet', logo: '👛' },
  { code: 'mobikwik', name: 'MobiKwik', logo: '👛' },
  { code: 'airtelmoney', name: 'Airtel Money', logo: '👛' },
];

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
  const [view, setView] = useState<'options' | 'upi_id' | 'card' | 'netbanking' | 'wallets' | 'collect_waiting'>('options');
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Form states
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    const checkMobile = () => {
      const ua = typeof window !== 'undefined' ? navigator.userAgent || '' : '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isSmall = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
      setIsMobileDevice(isMobileUA || isSmall);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let timer: any;
    let pollInterval: any;

    if (view === 'collect_waiting') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            clearInterval(pollInterval);
            toast({ variant: 'destructive', title: 'Payment Expired', description: 'Collect request expired. Please try again.' });
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Poll verification API every 3 seconds
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/cashfree-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            clearInterval(timer);
            clearInterval(pollInterval);
            toast({ title: 'Payment Successful', description: 'Redirecting...' });
            router.replace(`/verify?order_id=${orderId}`);
          }
        } catch (e) {}
      }, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [view, orderId, router, toast, onClose]);

  const launchSdkCheckoutFallback = async () => {
    try {
      if (!paymentSessionId) {
        toast({ variant: 'destructive', title: 'Payment Session Expired', description: 'Please close and retry booking.' });
        return false;
      }
      if (!(window as any).Cashfree) return false;
      const cashfree = await (window as any).Cashfree({ mode: environment || 'sandbox' });
      await cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal"
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  // 1. Direct Native UPI App Launch via S2S REST API (PhonePe, GPay, Paytm, BHIM)
  const handleDirectUpiApp = async (appCode: string) => {
    setLoadingApp(appCode);
    try {
      const res = await payWithCashfreeS2S(paymentSessionId, {
        upi: {
          channel: 'intent',
          upi_app: appCode
        }
      });

      if (res.success && res.data) {
        const payload = res.data.payment_method?.upi?.data?.payload || res.data.data?.payload;
        if (payload) {
          window.location.href = payload;
        } else if (res.data.data?.url) {
          window.location.href = res.data.data.url;
        } else {
          await launchSdkCheckoutFallback();
        }
      } else {
        if (res.error?.includes('not enabled') || res.error?.includes('not approved')) {
          const launched = await launchSdkCheckoutFallback();
          if (launched) return;
        }
        toast({ variant: 'destructive', title: 'Payment Failed', description: res.error || 'Failed to launch UPI app via API.' });
      }
    } catch (err: any) {
      const launched = await launchSdkCheckoutFallback();
      if (!launched) {
        toast({ variant: 'destructive', title: 'Error', description: err.message || 'UPI App launch error.' });
      }
    } finally {
      setLoadingApp(null);
    }
  };

  // 2. Pay by UPI ID / Collect via S2S REST API
  const handleUpiCollect = async () => {
    if (!upiId || !upiId.includes('@')) {
      toast({ variant: 'destructive', title: 'Invalid UPI ID', description: 'Please enter a valid VPA / UPI ID (e.g. user@ybl).' });
      return;
    }
    setLoadingApp('collect');
    try {
      const res = await payWithCashfreeS2S(paymentSessionId, {
        upi: {
          channel: 'collect',
          upi_id: upiId.trim()
        }
      });

      if (res.success) {
        setView('collect_waiting');
        setCountdown(300);
      } else {
        if (res.error?.includes('not enabled') || res.error?.includes('not approved')) {
          const launched = await launchSdkCheckoutFallback();
          if (launched) return;
        }
        toast({ variant: 'destructive', title: 'Collect Failed', description: res.error || 'Failed to send collect request.' });
      }
    } catch (err: any) {
      const launched = await launchSdkCheckoutFallback();
      if (!launched) {
        toast({ variant: 'destructive', title: 'Error', description: err.message || 'Collect request error.' });
      }
    } finally {
      setLoadingApp(null);
    }
  };

  // 3. Credit / Debit Card Pay via S2S REST API
  const handleCardPay = async () => {
    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15) {
      toast({ variant: 'destructive', title: 'Invalid Card Number', description: 'Please enter a valid card number.' });
      return;
    }
    if (!cardExpiry || !cardExpiry.includes('/')) {
      toast({ variant: 'destructive', title: 'Invalid Expiry', description: 'Expiry must be in MM/YY format.' });
      return;
    }
    const [mm, yy] = cardExpiry.split('/');
    if (!cardCvv || cardCvv.length < 3) {
      toast({ variant: 'destructive', title: 'Invalid CVV', description: 'Please enter CVV.' });
      return;
    }

    setLoadingApp('card');
    try {
      const res = await payWithCashfreeS2S(paymentSessionId, {
        card: {
          channel: 'post',
          card_number: cleanCard,
          card_holder_name: cardHolder.trim() || 'Cardholder',
          card_expiry_mm: mm,
          card_expiry_yy: yy,
          card_cvv: cardCvv
        }
      });

      if (res.success && res.data) {
        const redirectUrl = res.data.data?.url || res.data.action_data?.url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          toast({ title: 'Payment Processing', description: 'Verifying card payment...' });
          router.replace(`/verify?order_id=${orderId}`);
        }
      } else {
        toast({ variant: 'destructive', title: 'Card Payment Failed', description: res.error || 'Failed to process card payment.' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Card payment error.' });
    } finally {
      setLoadingApp(null);
    }
  };

  // 4. Netbanking Pay via S2S REST API
  const handleNetbankingPay = async (bankCode: string) => {
    setLoadingApp(bankCode);
    try {
      const res = await payWithCashfreeS2S(paymentSessionId, {
        netbanking: {
          channel: 'link',
          netbanking_bank_code: Number(bankCode) || bankCode
        }
      });

      if (res.success && res.data) {
        const redirectUrl = res.data.data?.url || res.data.action_data?.url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          toast({ variant: 'destructive', title: 'Failed', description: 'Netbanking portal URL not received.' });
        }
      } else {
        toast({ variant: 'destructive', title: 'Netbanking Failed', description: res.error || 'Failed to launch Netbanking.' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Netbanking error.' });
    } finally {
      setLoadingApp(null);
    }
  };

  // 5. Wallet Pay via S2S REST API
  const handleWalletPay = async (providerCode: string) => {
    setLoadingApp(providerCode);
    try {
      const res = await payWithCashfreeS2S(paymentSessionId, {
        app: {
          channel: 'link',
          provider: providerCode
        }
      });

      if (res.success && res.data) {
        const redirectUrl = res.data.data?.url || res.data.action_data?.url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          toast({ variant: 'destructive', title: 'Failed', description: 'Wallet payment URL not received.' });
        }
      } else {
        toast({ variant: 'destructive', title: 'Wallet Payment Failed', description: res.error || 'Failed to launch Wallet.' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Wallet payment error.' });
    } finally {
      setLoadingApp(null);
    }
  };

  const handleCloseSheet = async () => {
    try {
      await cancelPendingBooking(orderId);
    } catch (e) {}
    onClose();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            {view !== 'options' && view !== 'collect_waiting' && (
              <button onClick={() => setView('options')} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Checkout</h2>
              <p className="text-xs text-slate-500">Dr. {doctorName} • Fee: <span className="font-bold text-primary">₹{amount}</span></p>
            </div>
          </div>
          <button onClick={handleCloseSheet} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-6">

          {/* VIEW: MAIN OPTIONS */}
          {view === 'options' && (
            <>
              {/* Instant UPI Apps Section (Mobile Devices Only) */}
              {isMobileDevice && (
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Instant UPI Apps (Recommended)</p>
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* PhonePe Button */}
                    <button
                      onClick={() => handleDirectUpiApp('phonepe')}
                      disabled={loadingApp !== null}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all text-left bg-slate-50/50 dark:bg-slate-800/50 group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
                        {loadingApp === 'phonepe' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Pe'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">PhonePe</p>
                        <p className="text-[10px] text-slate-400">Direct App Launch</p>
                      </div>
                    </button>

                    {/* Google Pay Button */}
                    <button
                      onClick={() => handleDirectUpiApp('gpay')}
                      disabled={loadingApp !== null}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all text-left bg-slate-50/50 dark:bg-slate-800/50 group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
                        {loadingApp === 'gpay' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'GPay'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Google Pay</p>
                        <p className="text-[10px] text-slate-400">Direct App Launch</p>
                      </div>
                    </button>

                    {/* Paytm Button */}
                    <button
                      onClick={() => handleDirectUpiApp('paytm')}
                      disabled={loadingApp !== null}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-950/20 transition-all text-left bg-slate-50/50 dark:bg-slate-800/50 group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-sky-500 text-white font-bold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
                        {loadingApp === 'paytm' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Paytm'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Paytm UPI</p>
                        <p className="text-[10px] text-slate-400">Direct App Launch</p>
                      </div>
                    </button>

                    {/* BHIM Button */}
                    <button
                      onClick={() => handleDirectUpiApp('bhim')}
                      disabled={loadingApp !== null}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 transition-all text-left bg-slate-50/50 dark:bg-slate-800/50 group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center text-xs shadow-md group-hover:scale-105 transition-transform">
                        {loadingApp === 'bhim' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'BHIM'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">BHIM UPI</p>
                        <p className="text-[10px] text-slate-400">Direct App Launch</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Other Payment Options */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Other Payment Methods</p>
                <div className="space-y-2">
                  
                  <button
                    onClick={() => setView('upi_id')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Pay by UPI ID / VPA</p>
                        <p className="text-[10px] text-slate-400">user@ybl, user@okhdfcbank</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">›</span>
                  </button>

                  <button
                    onClick={() => setView('card')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Credit / Debit Card</p>
                        <p className="text-[10px] text-slate-400">Visa, Mastercard, RuPay</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">›</span>
                  </button>

                  <button
                    onClick={() => setView('netbanking')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Netbanking</p>
                        <p className="text-[10px] text-slate-400">HDFC, SBI, ICICI, Axis & All Banks</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">›</span>
                  </button>

                  <button
                    onClick={() => setView('wallets')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Wallets</p>
                        <p className="text-[10px] text-slate-400">Amazon Pay, Paytm Wallet, Mobikwik</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">›</span>
                  </button>

                </div>
              </div>
            </>
          )}

          {/* VIEW: UPI ID / VPA */}
          {view === 'upi_id' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enter UPI ID (VPA)</label>
                <Input
                  type="text"
                  placeholder="e.g. 9876543210@ybl or name@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                onClick={handleUpiCollect}
                disabled={loadingApp === 'collect'}
                className="w-full h-12 bg-primary text-white rounded-xl font-bold"
              >
                {loadingApp === 'collect' ? <Loader2 className="h-5 w-5 animate-spin" /> : `Send Collect Request (₹${amount})`}
              </Button>
            </div>
          )}

          {/* VIEW: CARD */}
          {view === 'card' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Card Number</label>
                <Input
                  type="text"
                  placeholder="4111 2222 3333 4444"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expiry (MM/YY)</label>
                  <Input
                    type="text"
                    placeholder="12/28"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">CVV</label>
                  <Input
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cardholder Name</label>
                <Input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                onClick={handleCardPay}
                disabled={loadingApp === 'card'}
                className="w-full h-12 bg-primary text-white rounded-xl font-bold"
              >
                {loadingApp === 'card' ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pay ₹${amount}`}
              </Button>
            </div>
          )}

          {/* VIEW: NETBANKING */}
          {view === 'netbanking' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Bank</p>
              <div className="grid grid-cols-2 gap-3">
                {NETBANKING_BANKS.map((bank) => (
                  <button
                    key={bank.code}
                    onClick={() => handleNetbankingPay(bank.code)}
                    disabled={loadingApp !== null}
                    className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-blue-50/30 transition-all text-left bg-slate-50/50 dark:bg-slate-800/50"
                  >
                    <span className="text-2xl">{bank.logo}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{bank.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: WALLETS */}
          {view === 'wallets' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Wallet</p>
              <div className="space-y-2">
                {WALLETS.map((w) => (
                  <button
                    key={w.code}
                    onClick={() => handleWalletPay(w.code)}
                    disabled={loadingApp !== null}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-blue-50/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{w.logo}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{w.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: COLLECT WAITING TIMER */}
          {view === 'collect_waiting' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Request Sent to {upiId}</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Please open your UPI app (PhonePe / GPay / Paytm) and approve the pending collect request of <span className="font-bold text-primary">₹{amount}</span>.
                </p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-xs font-mono font-bold text-primary">
                Time Remaining: {formatTime(countdown)}
              </div>
            </div>
          )}

        </div>

        {/* Footer Security Badge */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>256-bit Encrypted • Secured by Cashfree API</span>
        </div>

      </div>
    </div>
  );
}
