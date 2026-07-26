'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, Heart, Shield, Users } from 'lucide-react';
import Image from 'next/image';

export default function AboutDoctivoPage() {
  const router = useRouter();

  return (
    <div className="mobile-container min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 flex items-center gap-4 sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700"
        >
          <ChevronLeft className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">About DOCTIVO</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* App Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="h-24 w-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700 overflow-hidden relative">
            <Image src="/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg" alt="Logo" fill className="object-cover p-2" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">DOCTIVO</h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">YOUR HEALTH PARTNER</p>
        </div>

        {/* What is Doctivo */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Info className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">What is DOCTIVO?</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            DOCTIVO is a next-generation healthcare platform designed to bridge the gap between patients and healthcare providers. We simplify the process of finding the right doctors, booking appointments, and managing your medical history all in one place.
          </p>
        </div>

        {/* Core Values */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Heart className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Our Core Values</h3>
          </div>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Patient-Centric Approach</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                  We prioritize your comfort and time by providing a seamless booking experience and reducing wait times.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Privacy & Security</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                  Your medical data is yours. We employ top-tier security measures to ensure your records are private and protected.
                </p>
              </div>
            </li>
          </ul>
        </div>
        
      </div>
    </div>
  );
}
