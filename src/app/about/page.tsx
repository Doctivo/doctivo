'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, Shield, Award, Users, Globe2, Activity } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutDoctivoPage() {
  const router = useRouter();

  return (
    <div className="mobile-container min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 flex items-center gap-4 sticky top-0 z-30 border-b border-slate-200/50 dark:border-slate-800/50">
        <button 
          onClick={() => router.back()} 
          className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </button>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">About Doctivo</h1>
      </div>

      <div className="space-y-6">
        
        {/* Hero Section */}
        <div className="relative bg-white dark:bg-slate-900 px-6 pt-10 pb-16 overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="h-24 w-24 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 p-3">
              <div className="relative w-full h-full">
                <Image priority src="/logo.png" alt="Doctivo Logo" fill sizes="96px" className="object-contain" />
              </div>
            </div>
            
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-4">
              Your Trusted <br/> <span className="text-primary">Health Partner</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">
              We bridge the gap between patients and top-tier healthcare professionals with cutting-edge technology.
            </p>
          </div>
        </div>

        {/* 12 Years Experience */}
        <div className="px-6">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-slate-800 group">
            <div className="absolute inset-0 z-0">
              <Image src="/modern_clinic.jpg" alt="Modern Clinic" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            </div>
            <div className="relative z-10 p-8 flex flex-col justify-end min-h-[300px]">
              <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white leading-none mb-2">12+ Years</h3>
              <p className="text-slate-200 font-medium text-sm leading-relaxed">
                Of excellence in providing both online and offline premium medical appointments. We have been transforming lives and building trust for over a decade.
              </p>
            </div>
          </div>
        </div>

        {/* Pan India Expansion */}
        <div className="px-6">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/20 border border-slate-200/50 dark:border-slate-800 group">
            <div className="absolute inset-0 z-0">
              <Image src="/pan_india_expansion.jpg" alt="Pan India Expansion" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20" />
            </div>
            <div className="relative z-10 p-8 flex flex-col justify-end min-h-[280px]">
              <div className="h-12 w-12 bg-blue-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30">
                <Globe2 className="h-6 w-6 text-blue-200" />
              </div>
              <h3 className="text-2xl font-black text-white leading-tight mb-2">Pan-India <br/> Expansion Plan</h3>
              <p className="text-blue-100 font-medium text-sm leading-relaxed">
                We are actively expanding our network across the entire nation. Very soon, Doctivo's premium healthcare services will be accessible in every major city in India.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-6 grid grid-cols-2 gap-4">
          <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 text-center space-y-2">
              <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="font-black text-2xl text-slate-800 dark:text-slate-100">100k+</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Happy Patients</p>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 text-center space-y-2">
              <div className="h-12 w-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Activity className="h-6 w-6" />
              </div>
              <h4 className="font-black text-2xl text-slate-800 dark:text-slate-100">500+</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expert Doctors</p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex items-center justify-center gap-3">
              <Heart className="h-5 w-5 text-red-500" />
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Our Core Values</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-5">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-800 dark:text-slate-200">Patient-First</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1 font-medium">
                    We prioritize your comfort and time by providing a seamless booking experience and minimizing wait times.
                  </p>
                </div>
              </div>
              <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
              <div className="flex gap-5">
                <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 border border-green-100 dark:border-green-900/50">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-800 dark:text-slate-200">Uncompromised Privacy</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1 font-medium">
                    Your medical data is solely yours. We employ military-grade security to ensure your records remain strictly private.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

