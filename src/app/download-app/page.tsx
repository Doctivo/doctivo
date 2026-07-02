'use client';

import { Smartphone, ShieldCheck, Zap, BellRing, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DownloadAppPage() {
  const router = useRouter();
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsApp(navigator.userAgent.includes('DoctivoApp'));
    }
  }, []);

  const features = [
    {
      icon: ShieldCheck,
      title: "Secure Payments",
      desc: "UPI & Card transactions verified securely.",
      color: "bg-green-50 text-green-600 border-green-100",
    },
    {
      icon: Zap,
      title: "Live Queue Status",
      desc: "Track your token number in real-time.",
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      icon: BellRing,
      title: "Instant Push Alerts",
      desc: "Get notified when your turn is close.",
      color: "bg-blue-50 text-blue-600 border-blue-100",
    }
  ];

  return (
    <div className="mobile-container bg-white min-h-screen flex flex-col p-6 pt-16 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12 my-auto">
        {/* Visual Brand Identity */}
        <div className="space-y-4">
          <div className="h-24 w-24 bg-blue-50 rounded-[2.5rem] mx-auto flex items-center justify-center border-2 border-blue-100/50 shadow-sm relative">
            <Smartphone className="h-12 w-12 text-primary" />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 leading-tight">
              {isApp ? "Doctivo App Active" : "Doctivo App Available Now!"}
            </h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
              Healthcare Simplified
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="w-full space-y-8">
          <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-xs mx-auto">
            {isApp 
              ? "You are running the official Doctivo App. Enjoy real-time tracking and secure healthcare management!"
              : "To book appointments, track live queue status, and receive real-time updates, please install our official app."}
          </p>

          <div className="grid grid-cols-1 gap-3 text-left">
            {features.map((feature, i) => (
              <Card key={i} className="border border-slate-100 bg-slate-50/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center space-x-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-slate-800">{feature.title}</h3>
                    <p className="text-xs text-slate-400 font-medium">{feature.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pb-8 pt-10 space-y-4">
        {isApp ? (
          <Button 
            className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all duration-300"
            onClick={() => router.push('/home')}
          >
            <Home className="h-5 w-5" />
            Open Home Screen
          </Button>
        ) : (
          <Button 
            className="w-full h-16 bg-primary hover:bg-primary/95 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group transition-all duration-300"
            onClick={() => window.open('https://play.google.com/store', '_blank')}
          >
            Download on Play Store
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
        
        <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.25em]">
          Optimized for Android & iOS
        </p>
      </div>
    </div>
  );
}
