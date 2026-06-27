'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { loginWithoutOtp } from '@/app/actions/auth-actions';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { Patient } from '@/lib/types';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const user = useStore(state => state.user);
  const setUserStore = useStore(state => state.setUser);
  const setPatientsStore = useStore(state => state.setPatients);
  const setAppointmentsStore = useStore(state => state.setAppointments);
  const setIsAuthenticated = useStore(state => state.setIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      if (user.isProfileComplete) {
        router.push('/home');
      } else {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async () => {
    if (phone.length !== 10) return;
    
    setIsLoading(true);
    try {
      const result = await loginWithoutOtp(phone);
      
      if (result.success) {
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
      {/* Logo Section */}
      <div className="flex flex-col items-center mt-12 mb-16 space-y-3 w-full">
        <div className="bg-primary h-16 w-16 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white text-3xl font-black">D</span>
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
                <label className="text-[11px] font-black text-primary uppercase tracking-widest">Mobile Number</label>
                
                {/* Fixed Underlined input with better visibility */}
                <div className="flex items-center border-b-2 border-slate-200 focus-within:border-primary transition-all py-3">
                  <span className="text-slate-400 font-bold text-xl mr-3">+91</span>
                  <Input 
                    type="tel" 
                    placeholder="00000 00000" 
                    className="border-none shadow-none focus-visible:ring-0 h-10 text-xl font-black text-slate-800 placeholder:text-slate-200 p-0 bg-transparent"
                    value={phone || ''}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-16 text-lg font-black bg-primary text-white rounded-full transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20 hover:bg-primary/90"
              onClick={handleLogin}
              disabled={phone.length !== 10 || isLoading}
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
