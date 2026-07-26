'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, Heart, Award, Briefcase, Rocket } from 'lucide-react';

export default function AboutFounderPage() {
  const router = useRouter();

  return (
    <div className="mobile-container min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 flex items-center gap-4 sticky top-0 z-30 border-b border-border shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full border border-border"
        >
          <ChevronLeft className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </button>
        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">About Founder</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-border shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/10 rounded-bl-[100px] z-0"></div>
          <div className="relative z-10">
            <div className="h-28 w-28 mx-auto bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-5 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
              <span className="text-5xl">👨‍💻</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Gaurav Singh Shrinet</h2>
            <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1">Founder & CEO, DOCTIVO</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">The Mission</h3>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
            Gaurav Singh Shrinet is the Founder & CEO of DOCTIVO, a healthcare technology startup committed to transforming the way patients access healthcare in India. With a vision to make healthcare more accessible, organized, and technology-driven, he founded DOCTIVO to simplify doctor appointment booking, digital health record management, and patient care, particularly for people living in Tier-2 and Tier-3 cities.
          </p>
        </div>

        {/* Education & Experience */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Education & Work</h3>
          </div>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="h-2 w-2 rounded-full bg-purple-400 mt-2 shrink-0"></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                He is currently a CA Student and is pursuing a Master's degree in Finance and Marketing, combining strong academic knowledge with practical business and financial expertise.
              </p>
            </li>
            <li className="flex gap-4">
              <div className="h-2 w-2 rounded-full bg-purple-400 mt-2 shrink-0"></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                Alongside DOCTIVO, Gaurav is the Co-Founder of G.M. Home Tuition Bureau, an education platform dedicated to connecting qualified tutors with students and promoting quality education.
              </p>
            </li>
            <li className="flex gap-4">
              <div className="h-2 w-2 rounded-full bg-purple-400 mt-2 shrink-0"></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                Professionally, he works as an Accounting Expert at Chegg Inc., a US-based education technology company, where he assists students with advanced accounting concepts and develops high-quality academic solutions.
              </p>
            </li>
          </ul>
        </div>

        {/* Vision */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -top-4 -right-4 h-24 w-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Rocket className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white">The Vision</h3>
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
              "To make healthcare accessible, efficient, and hassle-free for every patient across India through innovative digital solutions."
            </p>
            <p className="text-sm font-medium text-slate-300 leading-relaxed border-t border-white/20 pt-4 mt-2">
              Driven by innovation and social impact, Gaurav is passionate about building technology solutions that solve real-world problems. His long-term vision is to establish DOCTIVO as one of India's most trusted digital healthcare platforms, enabling millions of patients to access quality healthcare seamlessly through technology.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
