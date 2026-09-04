'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { unifiedLogin, verifyAdminOtp, verifyPatientOtp } from '@/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { Patient } from '@/types';
import Image from 'next/image';

export default function LoginPage() {
  const [loginInput, setLoginInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const user = useStore(state => state.user);
  const admin = useStore(state => state.admin);
  const setUserStore = useStore(state => state.setUser);
  const setAdminStore = useStore(state => state.setAdmin);
  const setPatientsStore = useStore(state => state.setPatients);
  const setAppointmentsStore = useStore(state => state.setAppointments);
  const setIsAuthenticated = useStore(state => state.setIsAuthenticated);

  const [isMobile, setIsMobile] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileUA || userAgent.includes('DoctivoApp') || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Automatic redirect if session exists
  useEffect(() => {
    if (isAuthenticated) {
      const callbackUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('callbackUrl') : null;
      if (user?.id) {
        if (user.isProfileComplete) {
          router.replace(callbackUrl || '/home');
        } else {
          router.replace('/onboarding');
        }
      } else if (admin?.role === 'Attendant') {
        router.replace(`/attendant/dashboard`);
      } else if (admin?.role === 'Doctor') {
        router.replace(`/doctor/dashboard`);
      } else if (admin) {
        router.replace('/admin');
      }
    }
  }, [isAuthenticated, user, admin, router]);

  const handleLogin = async () => {
    const inputStr = loginInput.trim();
    if (!inputStr) return;

    // Strict validation: if input is only digits, it must be a valid 10-digit Indian number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (/^\d+$/.test(inputStr) && !phoneRegex.test(inputStr)) {
      toast({ variant: 'destructive', title: 'Invalid Format', description: 'Please enter a valid 10-digit Indian phone number.' });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await unifiedLogin(inputStr);
      
      if (result.success) {
        // DOCTOR / ADMIN EMAIL OTP
        if ((result as any).requireOtp) {
          setOtpSent(true);
          setOtpEmail((result as any).email || '');
          toast({ title: 'Verification Email Sent', description: 'Enter the 6-digit OTP code sent to your email.' });
          setIsLoading(false);
          return;
        }

        // PATIENT SMS OTP (New logic)
        if ((result as any).requirePhoneOtp) {
          setOtpSent(true);
          setOtpEmail((result as any).phone || ''); 
          toast({ title: 'Verification SMS Sent', description: `Enter the 6-digit OTP code sent to ${(result as any).phone}` });
          setIsLoading(false);
          return;
        }

        // OTHER ROLES (No OTP Required)
        if ((result as any).role === 'Admin') {
          setUserStore(null);
          setAdminStore((result as any).user as any);
          setIsAuthenticated(true);
          router.refresh();
          setTimeout(() => {
            router.replace('/admin');
          }, 100);
        } else if ((result as any).role === 'Doctor') {
          setUserStore(null);
          setAdminStore({
            admin_id: (result as any).user.doctor_id,
            full_name: (result as any).user.full_name,
            email: (result as any).user.email || "",
            role: 'Doctor',
            permissions: {} as any
          });
          setIsAuthenticated(true);
          router.refresh();
          setTimeout(() => {
            router.replace(`/doctor/dashboard`);
          }, 100);
        } else if ((result as any).role === 'Attendant') {
          setUserStore(null);
          setAdminStore({
            admin_id: (result as any).user.attendant_id,
            full_name: (result as any).user.full_name,
            email: "",
            role: 'Attendant',
            permissions: {} as any,
            doctor_id: (result as any).user.doctor_id
          });
          setIsAuthenticated(true);
          router.refresh();
          setTimeout(() => {
            router.replace(`/attendant/dashboard`);
          }, 100);
        }
      } else {
        toast({ variant: "destructive", title: "Login Failed", description: result.error });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'Please enter a 6-digit OTP code.' });
      return;
    }
    setIsVerifying(true);
    try {
      const isPhoneOtp = /^\d{10}$/.test(otpEmail);
      
      // Verification call based on Phone vs Email
      const result = isPhoneOtp 
        ? await verifyPatientOtp(otpEmail, otpInput)
        : await verifyAdminOtp(otpEmail, otpInput);

      if (result.success) {
        setUserStore(null);
        setPatientsStore([]);
        setAppointmentsStore([]);
        
        // Handle successful patient verification
        if (result.role === 'Patient') {
          setUserStore(result.user as any);
          const fullPatientList: Patient[] = [
            { ...result.user, relation: 'Self' } as Patient,
            ...((result as any).familyMembers || [])
          ];
          setPatientsStore(fullPatientList);
          setAppointmentsStore((result as any).appointments || []);
          setIsAuthenticated(true);
          
          router.refresh();
          setTimeout(() => {
            const callbackUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('callbackUrl') : null;
            if (result.user.isProfileComplete) router.replace(callbackUrl || '/home');
            else router.replace('/onboarding');
          }, 100);
        } 
        // Handle successful doctor verification
        else if (result.role === 'Doctor') {
          setAdminStore({
            admin_id: result.user.doctor_id,
            full_name: result.user.full_name,
            email: result.user.email || "",
            role: 'Doctor',
            permissions: {} as any
          });
          setIsAuthenticated(true);
          router.refresh();
          setTimeout(() => {
            router.replace(`/doctor/dashboard`);
          }, 100);
        } 
        // Handle successful admin verification
        else {
          setAdminStore(result.user as any);
          setIsAuthenticated(true);
          router.refresh();
          
          setTimeout(() => {
            router.replace('/admin');
          }, 100);
        }
      } else {
        toast({ variant: "destructive", title: "Verification Failed", description: result.error });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-blue-600 via-blue-700 to-indigo-900 p-16 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
        <div className="flex items-center space-x-4 z-10">
          <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <span className="font-black text-2xl tracking-tighter text-white">D</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-white">DOCTIVO</h1>
            <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest leading-none">Healthcare Simplified</p>
          </div>
        </div>
        <div className="space-y-6 z-10 max-w-md">
          <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight">Experience Premium Medical Management.</h2>
          <p className="text-white/70 font-medium leading-relaxed">Track live OPD queue status, manage family health records, and schedule consultations in seconds.</p>
        </div>
        <div className="text-xs font-bold text-white/40 z-10">© {new Date().getFullYear()} Doctivo Inc. All rights reserved.</div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-[#F8FAFF]">
        <div className="w-full max-w-[440px] flex flex-col min-h-[85vh] lg:min-h-0 justify-between lg:justify-center lg:space-y-10 py-8">
          <div className="flex flex-col items-center space-y-3 lg:hidden">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden bg-white">
              <Image priority src="/logo.png" alt="Logo" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain p-2" />
             </div>
             <div className="text-center">
               <h1 className="text-xl font-black tracking-tight text-slate-800">DOCTIVO</h1>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Healthcare Simplified</p>
             </div>
           </div>

           <div>
             <h2 className="text-3xl font-black text-slate-800 mb-2 px-1 tracking-tight">{otpSent ? "Verify OTP" : "Login"}</h2>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest px-1 mb-8">
               {otpSent ? `Enter the 6-digit code sent to ${otpEmail}` : (isMobile ? "Enter your mobile number to continue" : "Access your portal using credentials")}
             </p>

             <Card className="w-full bg-white dark:bg-slate-900 border-none shadow-[0_4px_25px_rgba(0,0,0,0.03)] dark:shadow-none rounded-[2.5rem] overflow-hidden">
               <CardContent className="pt-10 px-8 pb-10 space-y-10">
                 {otpSent ? (
                   <div className="space-y-6">
                     <div className="space-y-1 px-1">
                       <label className="text-[10px] font-black text-primary uppercase tracking-widest">Verification Code</label>
                       <div className="flex items-center border-b-2 border-slate-200 focus-within:border-primary transition-all py-3">
                         <input type="tel" maxLength={6} placeholder="000000" className="border-none shadow-none outline-none focus:ring-0 h-10 text-2xl font-black text-slate-800 placeholder:text-slate-200 p-0 bg-transparent w-full text-center tracking-[0.5em]" value={otpInput || ''} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()} />
                       </div>
                     </div>
                     <Button className="w-full h-16 text-lg font-black bg-primary text-white rounded-full transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20 hover:bg-primary/90" onClick={handleVerifyOtp} disabled={otpInput.length !== 6 || isVerifying}>
                       {isVerifying ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Verify Code <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>}
                     </Button>
                     <div className="flex justify-between items-center px-1 pt-2 text-xs font-bold">
                       <button onClick={handleLogin} className="text-primary hover:underline">Resend Code</button>
                       <button onClick={() => { setOtpSent(false); setOtpInput(''); }} className="text-slate-400 hover:text-slate-600">Change Identifier</button>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-10">
                     <div className="space-y-6">
                       <div className="space-y-1 px-1">
                         <label className="text-[10px] font-black text-primary uppercase tracking-widest">{isMobile ? "Mobile Number" : "Identifier"}</label>
                         <div className="flex items-center border-b-2 border-slate-200 focus-within:border-primary transition-all py-3">
                           {isMobile && <span className="text-slate-400 font-bold text-xl mr-3">+91</span>}
                           <input type={isMobile ? "tel" : "text"} placeholder={isMobile ? "00000 00000" : "Mobile, email, or attendant ID"} className="border-none shadow-none outline-none focus:ring-0 h-10 text-lg font-black text-slate-800 placeholder:text-slate-200 p-0 bg-transparent w-full" value={loginInput || ''} onChange={(e) => { const val = e.target.value; if (isMobile) setLoginInput(val.replace(/\D/g, '').slice(0, 10)); else setLoginInput(val); }} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                         </div>
                       </div>
                     </div>
                     {(!isMobile || loginInput.length === 10) && (
                       <Button className="w-full h-16 text-lg font-black bg-primary text-white rounded-full transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20 hover:bg-primary/90" onClick={handleLogin} disabled={isLoading}>
                         {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Continue <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>}
                       </Button>
                     )}
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
           <div className="text-center text-[10px] text-slate-400 font-medium lg:hidden">© {new Date().getFullYear()} Doctivo Inc.</div>
         </div>
       </div>
     </div>
   );
}