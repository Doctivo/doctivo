'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Stethoscope, Calendar, Users, Phone, ArrowRight, 
  ShieldCheck, Download, Award, Clock, MapPin, 
  Building2, Activity, Star, CheckCircle2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/lib/store';

export default function LandingPage() {
  const router = useRouter();
  const [isPhysioOpen, setIsPhysioOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);

  useEffect(() => {
    setIsMounted(true);
    if (isAuthenticated && hasHydrated) {
      router.replace('/home');
    }
  }, [isAuthenticated, hasHydrated, router]);

  const specialties = [
    { name: 'Cardiologist', icon: '❤️', desc: 'Heart specialist consultations & ECG tracking.', href: '/doctors?specialty=Cardiologist' },
    { name: 'Eye Specialist', icon: '👁️', desc: 'Vision testing, refractive errors & general checkups.', href: '/doctors?specialty=Eye%20Specialist' },
    { name: 'Physiotherapist', icon: '💪', desc: 'Joint rehab, back therapy & customized recovery programs.', onClick: () => setIsPhysioOpen(true) },
    { name: 'General Physician', icon: '🩺', desc: 'Viral fever, chronic health reviews & physicals.', href: '/doctors?specialty=General%20Physician' },
  ];

  // Prevent hydration mismatch by showing a skeleton/loading state until mounted
  if (!isMounted || !hasHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Doctivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 md:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xl">D</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">DOCTIVO</h1>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">Healthcare Simplified</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-8">
          <a href="tel:+917307986604" className="hidden lg:flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <Phone className="h-4 w-4 mr-2" /> +91 73079 86604
          </a>
          
          {/* Client-only navigation buttons */}
          {!isAuthenticated ? (
            <Link href="/login">
              <Button variant="outline" className="h-11 px-6 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
                Sign In
              </Button>
            </Link>
          ) : (
            <Link href="/home">
              <Button variant="outline" className="h-11 px-6 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
                Dashboard
              </Button>
            </Link>
          )}
          
          <Link href={isAuthenticated ? "/home" : "/login"}>
            <Button className="h-11 px-6 rounded-xl font-black bg-blue-600 text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700">
              Book Now
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-24 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="space-y-8 text-center lg:text-left z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full text-blue-600 text-[10px] font-bold uppercase tracking-wider">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span>Gorakhpur's Smart OPD Network</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-slate-800 leading-tight tracking-tight max-w-xl mx-auto lg:mx-0">
            Skip the Waiting Room. Book in <span className="text-blue-600">Seconds.</span>
          </h2>

          <p className="text-slate-500 font-medium text-base md:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Doctivo connects you with premium specialist doctors in Gorakhpur. Track your token queue status live from your phone and arrive on time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/home" className="w-full sm:w-auto">
              <Button className="w-full h-16 px-8 rounded-2xl bg-blue-600 text-white font-black text-base shadow-xl shadow-blue-600/20 hover:bg-blue-700 flex items-center justify-center gap-2 group">
                Book Doctor Appointment <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/download-app" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-16 px-8 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-black text-base flex items-center justify-center gap-2">
                <Download className="h-5 w-5" /> Download App
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100 max-w-md mx-auto lg:mx-0">
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-800">10k+</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bookings</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-800">15+</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Specialists</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-800">0 min</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Wait Time</p>
            </div>
          </div>
        </div>

        {/* Live Status Card */}
        <div className="flex justify-center z-10 relative">
          <div className="w-full max-w-[420px] bg-white border border-slate-100 shadow-2xl rounded-[3rem] p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/5 rounded-full -mr-10 -mt-10 blur-2xl" />
            
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm">Doctivo Live OPD Queue</h4>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" /> Active Status
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100/50 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Patient</span>
                <span>Queue Number</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-800">Ramesh Verma</span>
                <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full font-black text-sm">Token #04</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 text-xs">
                <span className="font-bold text-slate-500">Estimated Arrival</span>
                <span className="font-black text-slate-800">10:45 AM</span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-500">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span>Confirm profiles for family members in 1-click.</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span>Download App locally on Android or iOS.</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span>Share receipt tickets instantly via WhatsApp.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="bg-white py-24 px-6 md:px-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Specialties</h3>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">Our Premium Medical Network</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((spec) => (
              <Card 
                key={spec.name} 
                onClick={spec.onClick || (() => router.push(spec.href!))}
                className="border-none bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[2.5rem] p-8 cursor-pointer group"
              >
                <CardContent className="p-0 space-y-6">
                  <div className="h-16 w-16 rounded-[1.25rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-3xl group-hover:bg-blue-600 transition-colors">
                    <span className="group-hover:scale-110 transition-transform">{spec.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-xl leading-tight group-hover:text-blue-600 transition-colors">{spec.name}</h4>
                    <p className="text-sm text-slate-400 font-medium mt-3 leading-relaxed">{spec.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* App Promo */}
      <section className="bg-slate-900 text-white py-20 px-6 md:px-12 border-t border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,0.15),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="space-y-6 max-w-xl text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Healthcare in Your Pocket.
            </h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Install the lightweight Doctivo PWA application to receive immediate notifications and access your booking tickets instantly.
            </p>
          </div>
          <Link href="/download-app">
            <Button className="h-20 px-12 rounded-[2rem] bg-blue-600 text-white font-black text-xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 flex items-center justify-center gap-3 group shrink-0">
              Get the Mobile App <Download className="h-7 w-7 group-hover:translate-y-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 px-6 md:px-12 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-center space-x-3 opacity-50">
            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">D</span>
            </div>
            <span className="text-slate-900 font-black tracking-tighter text-sm">DOCTIVO</span>
          </div>
          <p>© {new Date().getFullYear()} Doctivo Inc. Gorakhpur OS v2.5.0</p>
        </div>
      </footer>

      {/* Physio Modal */}
      <Dialog open={isPhysioOpen} onOpenChange={setIsPhysioOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-[3rem] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="text-center pb-6 border-b border-slate-50">
            <DialogTitle className="text-2xl font-black text-slate-800">Physiotherapy Visit</DialogTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Consultation Mode</p>
          </DialogHeader>

          <div className="space-y-4 py-8">
            <button 
              onClick={() => {
                setIsPhysioOpen(false);
                router.push('/doctors?specialty=Physiotherapist&mode=Clinic');
              }}
              className="w-full p-6 rounded-[2rem] border-2 border-slate-100 hover:border-blue-600 bg-white flex items-center group transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="ml-5 text-left">
                <p className="text-lg font-black text-slate-800 leading-none">Visit Clinic</p>
                <p className="text-[10px] text-slate-400 font-black mt-2 uppercase">Professional OPD Setup</p>
              </div>
            </button>

            <button 
              onClick={() => {
                setIsPhysioOpen(false);
                router.push('/doctors?specialty=Physiotherapist&mode=Home');
              }}
              className="w-full p-6 rounded-[2rem] border-2 border-slate-100 hover:border-purple-600 bg-white flex items-center group transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="h-7 w-7" />
              </div>
              <div className="ml-5 text-left">
                <p className="text-lg font-black text-slate-800 leading-none">Home Visit</p>
                <p className="text-[10px] text-slate-400 font-black mt-2 uppercase">Therapy at your doorstep</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}