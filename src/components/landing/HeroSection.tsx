import Link from 'next/link';
import { ArrowRight, Download, Activity, Stethoscope, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
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
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Bookings</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-black text-slate-800">15+</p>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Specialists</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-black text-slate-800">0 min</p>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Wait Time</p>
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
            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
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
  );
}

