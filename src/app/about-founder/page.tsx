'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, Heart, Award, Briefcase, Rocket, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAppSetting } from '@/actions/admin';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

export default function AboutFounderPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [api, setApi] = useState<any>();

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await getAppSetting('founderImages');
        if (res.success && 'value' in res && res.value) {
          setImages(res.value);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchImages();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 selection:bg-blue-100">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors border border-slate-200/50 dark:border-slate-800"
          >
            <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </button>
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">About Founder</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8 mt-4">
        
        {images.length > 0 && (
          <Carousel setApi={setApi} opts={{ loop: true, align: "center" }} className="w-full mx-auto">
            <CarouselContent>
              {images.map((img, idx) => (
                <CarouselItem key={idx}>
                  <div className="w-full aspect-square md:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-xl group relative">
                    <div className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
                      <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg max-w-[50%] leading-tight">Gaurav Singh Shrinet</h2>
                      <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shrink-0">
                        <p className="text-[10px] md:text-xs font-black tracking-widest uppercase shadow-sm">FOUNDER & CEO, DOCTIVO</p>
                      </div>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Founder ${idx + 1}`} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}



        {/* Introduction */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">The Mission</h3>
          </div>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Gaurav Singh Shrinet is the Founder & CEO of DOCTIVO, a healthcare technology startup committed to transforming the way patients access healthcare in India. With a vision to make healthcare more accessible, organized, and technology-driven, he founded DOCTIVO to simplify doctor appointment booking, digital health record management, and patient care, particularly for people living in Tier-2 and Tier-3 cities.
          </p>
        </div>

        {/* Education & Experience */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">Education & Work</h3>
          </div>
          <ul className="space-y-5">
            <li className="flex gap-4 group">
              <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 mt-2 shrink-0 group-hover:bg-orange-500 transition-colors"></div>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                He is currently a CA Student and is pursuing a Master's degree in Finance and Marketing, combining strong academic knowledge with practical business and financial expertise.
              </p>
            </li>
            <li className="flex gap-4 group">
              <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 mt-2 shrink-0 group-hover:bg-orange-500 transition-colors"></div>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Alongside DOCTIVO, Gaurav is the Co-Founder of G.M. Home Tuition Bureau, an education platform dedicated to connecting qualified tutors with students and promoting quality education.
              </p>
            </li>
            <li className="flex gap-4 group">
              <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 mt-2 shrink-0 group-hover:bg-orange-500 transition-colors"></div>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Professionally, he works as an Accounting Expert at Chegg Inc., a US-based education technology company, where he assists students with advanced accounting concepts and develops high-quality academic solutions.
              </p>
            </li>
          </ul>
        </div>

        {/* Vision */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Rocket className="h-6 w-6" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">The Vision</h3>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 mb-5">
            <p className="text-base md:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-black italic">
              "To make healthcare accessible, efficient, and hassle-free for every patient across India through innovative digital solutions."
            </p>
          </div>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Driven by innovation and social impact, Gaurav is passionate about building technology solutions that solve real-world problems. His long-term vision is to establish DOCTIVO as one of India's most trusted digital healthcare platforms, enabling millions of patients to access quality healthcare seamlessly through technology.
          </p>
        </div>
      </div>
    </div>
  );
}

