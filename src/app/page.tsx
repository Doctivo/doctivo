'use client';

import { useRouter } from 'next/navigation';
import { 
  Stethoscope, Calendar, Users, Phone, ArrowRight, 
  ShieldCheck, Download, Award, Clock, MapPin, 
  Building2, Activity, Star, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function LandingPage() {
  const router = useRouter();
  const [isPhysioOpen, setIsPhysioOpen] = useState(false);

  const specialties = [
    { name: 'Cardiologist', icon: '❤️', desc: 'Heart specialist consultations & ECG tracking.', href: '/doctors?specialty=Cardiologist' },
    { name: 'Eye Specialist', icon: '👁️', desc: 'Vision testing, refractive errors & general checkups.', href: '/doctors?specialty=Eye%20Specialist' },
    { name: 'Physiotherapist', icon: '💪', desc: 'Joint rehab, back therapy & customized recovery programs.', onClick: () => setIsPhysioOpen(true) },
    { name: 'General Physician', icon: '🩺', desc: 'Viral fever, chronic health reviews & physicals.', href: '/doctors?specialty=General%20Physician' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 md:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xl">D</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">DOCTIVO</h1>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">Healthcare Simplified</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-8">
          <a href="tel:+919876543210" className="hidden sm:flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <Phone className="h-4 w-4 mr-2" /> +91 87079 86604
          </a>
          <Button 
            onClick={() => router.push('/login')} 
            variant="outline" 
            className="h-11 px-6 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => router.push('/home')} 
            className="h-11 px-6 rounded-xl font-black bg-blue-600 text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700"
          >
            Book Appointment
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Decorative Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-300/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-8 text-center lg:text-left z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>Gorakhpur's Smart OPD Network</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-slate-800 leading-tight tracking-tight max-w-xl mx-auto lg:mx-0">
            Skip the Waiting Room. Book in <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Seconds.</span>
          </h2>

          <p className="text-slate-500 font-medium text-base md:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Doctivo connects you with premium specialist doctors in Gorakhpur. Track your token queue status live from your phone and arrive on time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Button 
              onClick={() => router.push('/home')} 
              className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-blue-600 text-white font-black text-base shadow-xl shadow-blue-600/20 hover:bg-blue-700 flex items-center justify-center gap-2 group"
            >
              Book Doctor Appointment <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              onClick={() => router.push('/download-app')} 
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-black text-base flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" /> Download App
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100 max-w-md mx-auto lg:mx-0">
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-800">10k+</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bookings</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-800">15+</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Specialists</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-800">0 min</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Waiting Time</p>
            </div>
          </div>
        </div>

        {/* Hero Image / Card Panel */}
        <div className="flex justify-center z-10 relative">
          <div className="w-full max-w-[480px] bg-white border border-slate-100 shadow-2xl rounded-[3rem] p-8 space-y-6 relative overflow-hidden">
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

            {/* Mock Queue Widget */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Patient</span>
                <span>Queue Number</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-800">Ramesh Verma</span>
                <span className="bg-blue-100 text-blue-600 px-3.5 py-1 rounded-full font-black text-sm">Token #04</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 text-xs">
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
                <span>Download PWA App locally on any Android or iOS device.</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span>Share receipt tickets instantly via native WhatsApp intent.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Categories */}
      <section className="bg-white py-20 px-6 md:px-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Specialties</h3>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Our Premium Medical Specialties</h2>
            <p className="text-slate-400 font-bold text-sm max-w-md mx-auto leading-relaxed">
              Choose a specialist to check schedules, fee boundaries, and book instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((spec) => (
              <Card 
                key={spec.name} 
                onClick={spec.onClick || (() => router.push(spec.href!))}
                className="border-none bg-slate-50/50 hover:bg-white hover:shadow-xl hover:scale-102 transition-all rounded-[2rem] p-6 cursor-pointer group"
              >
                <CardContent className="p-0 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-2xl group-hover:bg-blue-600 transition-colors">
                    <span>{spec.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">{spec.name}</h4>
                    <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">{spec.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Workflow</h3>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Book in 3 Simple Steps</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="space-y-4 text-center">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 font-black rounded-[1.5rem] flex items-center justify-center text-xl mx-auto shadow-md">
              1
            </div>
            <h4 className="text-lg font-black text-slate-800">Login or Verify</h4>
            <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs mx-auto">
              Enter your mobile number. Admins or doctors verify with a secure 1-time email OTP code.
            </p>
          </div>

          <div className="space-y-4 text-center">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 font-black rounded-[1.5rem] flex items-center justify-center text-xl mx-auto shadow-md">
              2
            </div>
            <h4 className="text-lg font-black text-slate-800">Select Doctor & Mode</h4>
            <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs mx-auto">
              Pick a specialist and select your consultation mode (Home Visit or Clinic Visit).
            </p>
          </div>

          <div className="space-y-4 text-center">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 font-black rounded-[1.5rem] flex items-center justify-center text-xl mx-auto shadow-md">
              3
            </div>
            <h4 className="text-lg font-black text-slate-800">Get Live Token Ticket</h4>
            <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs mx-auto">
              Download your digital receipt. Share the confirmation with your family on WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* App Download Promo */}
      <section className="bg-slate-900 text-white py-16 px-6 md:px-12 border-t border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,0.15),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Get the Doctivo Mobile App
            </h2>
            <p className="text-slate-400 font-medium text-sm md:text-base leading-relaxed">
              Install the lightweight PWA application to receive immediate notifications, check queue timings, and access your offline tickets instantly.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/download-app')}
            className="h-16 px-10 rounded-2xl bg-blue-600 text-white font-black text-base shadow-xl shadow-blue-600/30 hover:bg-blue-700 flex items-center justify-center gap-2 group shrink-0"
          >
            Download Android App (Fat APK) <Download className="h-5 w-5 shrink-0" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 md:px-12 border-t border-slate-100 text-xs font-bold text-slate-500 leading-relaxed">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <span className="text-slate-800 font-black tracking-tight text-sm">DOCTIVO</span>
            </div>
            <p className="text-slate-400 max-w-xs">
              Gorakhpur's premium live queue tracking and clinic consultation booking system.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-800 font-black uppercase text-xs tracking-wider">Clinics & Locations</h4>
            <p className="text-slate-400 flex items-start">
              <MapPin className="h-4 w-4 mr-2 text-slate-300 shrink-0" />
              <span>Medical Road, Asuran Chauraha, Gorakhpur, UP - 273001</span>
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-800 font-black uppercase text-xs tracking-wider">Support</h4>
            <p className="text-slate-400 flex items-center">
              <Phone className="h-4 w-4 mr-2 text-slate-300 shrink-0" />
              <span>+91 98765 43210</span>
            </p>
            <p className="text-slate-400">
              Email: gaurav@doctivo.in
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
          <span>© {new Date().getFullYear()} Doctivo Inc. All rights reserved.</span>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Physiotherapy mode modal */}
      <Dialog open={isPhysioOpen} onOpenChange={setIsPhysioOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-[2.5rem] p-6 border-none shadow-2xl bg-white">
          <DialogHeader className="text-center pb-4 border-b border-slate-50">
            <DialogTitle className="text-xl font-black text-slate-800">Physiotherapy Visit</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select Consultation Mode</p>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <button 
              onClick={() => {
                setIsPhysioOpen(false);
                router.push('/doctors?specialty=Physiotherapist&mode=Clinic');
              }}
              className="w-full p-5 rounded-[2rem] border-2 border-slate-100 hover:border-primary bg-white flex items-center group active:scale-98 transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="ml-5 text-left flex-1">
                <p className="text-base font-black text-slate-800 leading-none">Visit Clinic</p>
                <p className="text-xs text-slate-400 font-bold mt-1.5 uppercase tracking-tight">क्लिनिक पर जाएँ</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
            </button>

            <button 
              onClick={() => {
                setIsPhysioOpen(false);
                router.push('/doctors?specialty=Physiotherapist&mode=Home');
              }}
              className="w-full p-5 rounded-[2rem] border-2 border-slate-100 hover:border-primary bg-white flex items-center group active:scale-98 transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="ml-5 text-left flex-1">
                <p className="text-base font-black text-slate-800 leading-none">Home Visit</p>
                <p className="text-xs text-slate-400 font-bold mt-1.5 uppercase tracking-tight">घर पर बुलाएँ</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ChevronRight helper component since it is imported/used
function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
