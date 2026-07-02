'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { unifiedLogin } from '@/app/actions/auth-actions';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { Patient } from '@/lib/types';
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

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.id) {
        if (user.isProfileComplete) {
          router.push('/home');
        } else {
          router.push('/onboarding');
        }
      } else if (admin?.role === 'Attendant' || admin?.role === 'Doctor') {
        router.push('/doctor/dashboard');
      } else if (admin) {
        router.push('/admin');
      }
    }
  }, [isAuthenticated, user, admin, router]);

  const handleLogin = async () => {
    if (!loginInput.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await unifiedLogin(loginInput.trim());
      
      if (result.success) {
        if (result.role === 'Patient') {
          // Clear admin state
          setAdminStore(null);

          if (result.newUser) {
            setUserStore(result.user as any);
            setIsAuthenticated(true);
            toast({ title: "Welcome!", description: "Please complete your profile to start booking." });
            router.push('/onboarding');
          } else {
            setUserStore(result.user as any);
            
            const fullPatientList: Patient[] = [
              { ...result.user, relation: 'Self' } as Patient,
              ...(result.familyMembers || [])
            ];
            
            setPatientsStore(fullPatientList);
            setAppointmentsStore(result.appointments || []);
            setIsAuthenticated(true);
            
            toast({ title: "Welcome Back!", description: "Your health records are synced." });
            
            if (result.user.isProfileComplete) {
              router.push('/home');
            } else {
              router.push('/onboarding');
            }
          }
        } else if (result.role === 'Admin') {
          // Clear patient state
          setUserStore(null);
          setPatientsStore([]);
          setAppointmentsStore([]);

          setAdminStore(result.user as any);
          setIsAuthenticated(true);
          toast({ title: 'Welcome Admin!', description: 'Dashboard loaded successfully.' });
          router.push('/admin');
        } else if (result.role === 'Doctor') {
          // Clear patient state
          setUserStore(null);
          setPatientsStore([]);
          setAppointmentsStore([]);

          setAdminStore({
            admin_id: result.user.doctor_id,
            full_name: result.user.full_name,
            email: result.user.email || "",
            role: 'Doctor',
            permissions: {} as any
          });
          setIsAuthenticated(true);
          toast({ title: 'Welcome Doctor!', description: 'Your Clinic Dashboard loaded successfully.' });
          router.push('/doctor/dashboard');
        } else if (result.role === 'Attendant') {
          // Clear patient state
          setUserStore(null);
          setPatientsStore([]);
          setAppointmentsStore([]);

          setAdminStore({
            admin_id: result.user.attendant_id,
            full_name: result.user.full_name,
            email: "",
            role: 'Attendant',
            permissions: {} as any
          });
          setIsAuthenticated(true);
          toast({ title: 'Welcome Attendant!', description: 'Queue Dashboard loaded successfully.' });
          router.push('/doctor/dashboard');
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

  return (
    <div className="mobile-container flex flex-col p-6 bg-[#F8FAFF] min-h-screen overflow-hidden">
      {/* Logo Section (Using high-quality Image 8) */}
      <div className="flex flex-col items-center mt-12 mb-16 space-y-3 w-full">
        <div className="h-20 w-20 rounded-[1.5rem] flex items-center justify-center shadow-lg relative overflow-hidden">
          <Image src="/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg" alt="Logo" fill className="object-cover" priority />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-slate-800">DOCTIVO</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Healthcare Simplified</p>
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-bold text-slate-700 mb-6 px-2">Login</h2>

        <Card className="w-full bg-white border-none shadow-[0_4px_25px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden">
          <CardContent className="pt-10 px-8 pb-10 space-y-10">
            <div className="space-y-6">
              <div className="space-y-1 px-1">
                <label className="text-[11px] font-black text-primary uppercase tracking-widest">
                  {isMobile ? "Mobile Number" : "Identifier"}
                </label>
                
                <div className="flex items-center border-b-2 border-slate-200 focus-within:border-primary transition-all py-3">
                  {isMobile && (
                    <span className="text-slate-400 font-bold text-xl mr-3">+91</span>
                  )}
                  <input 
                    type={isMobile ? "tel" : "text"}
                    placeholder={isMobile ? "00000 00000" : "Mobile, email, or attendant ID"} 
                    className="border-none shadow-none outline-none focus:ring-0 h-10 text-lg font-black text-slate-800 placeholder:text-slate-200 p-0 bg-transparent w-full"
                    value={loginInput || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (isMobile) {
                        setLoginInput(val.replace(/\D/g, '').slice(0, 10));
                      } else {
                        // On desktop, if input consists only of digits, restrict to 10
                        if (/^\d+$/.test(val)) {
                          setLoginInput(val.slice(0, 10));
                        } else {
                          setLoginInput(val);
                        }
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>
            </div>
 
            <Button 
              className="w-full h-16 text-lg font-black bg-primary text-white rounded-full transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20 hover:bg-primary/90"
              onClick={handleLogin}
              disabled={!loginInput.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>Continue <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="pb-10 text-center px-6">
        <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
          Secure, direct access to <br/> Gorakhpur's top specialists.
        </p>
      </div>
    </div>
  );
}
