'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface BannerProps {
  homeBanners: any[];
  user?: any;
  isMobile?: boolean;
}

export default function Banner({ homeBanners, user, isMobile = false }: BannerProps) {
  const { t } = useTranslation();
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const updateCurrent = () => setCurrent(api.selectedScrollSnap());
    api.on("select", updateCurrent);
    updateCurrent();
    
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    
    return () => {
      clearInterval(interval);
      api.off("select", updateCurrent);
    };
  }, [api]);

  // Fallback if no banners are returned from the backend (only for desktop view based on original code)
  if (!homeBanners || homeBanners.length === 0) {
    if (!isMobile) {
      return (
        <div className="w-full h-64 rounded-[2.5rem] overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 relative flex items-center px-16 justify-between bg-blue-600 mb-8">
          <div className="absolute right-0 bottom-0 w-[35%] max-w-[200px] aspect-square translate-y-[15%] translate-x-[10%]">
            <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full border-4 border-white/50 dark:border-slate-700 shadow-2xl overflow-hidden p-3">
              <img src="/modern_clinic.jpg" alt="Clinic" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="relative z-20 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {t("Welcome back")}, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm font-medium opacity-90 text-white max-w-md leading-relaxed">
              {t("Find the best doctors and book your appointments easily.")}
            </p>
            <Link href="/doctors" className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black w-fit hover:bg-slate-50 transition-colors mt-2 shadow-xl shadow-black/10 inline-block">
              {t("Book Appointment")}
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={cn("relative", !isMobile && "w-full mb-8")}>
      <Carousel setApi={setApi} opts={{ loop: true, align: "start" }} className="w-full">
        <CarouselContent>
          {homeBanners.map((banner, idx) => {
            const b = typeof banner === 'string' ? { imageUrl: banner } : banner;
            const validBg = b.bgColor && b.bgColor.includes('gradient') ? b.bgColor : "bg-gradient-to-r from-blue-500 to-blue-600";
            
            return (
              <CarouselItem key={idx}>
                <div className={cn(
                  "w-full overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 relative flex items-center justify-between", 
                  isMobile ? "aspect-[21/9] rounded-[2rem] px-6" : "h-64 rounded-[2.5rem] px-16",
                  validBg
                )}>
                  <div className={cn("relative z-10 flex flex-col justify-center h-full text-white", isMobile ? "w-[60%] space-y-1" : "w-2/3 space-y-4")}>
                    {b.heading ? (
                      <h2 className={cn("font-black tracking-tight leading-tight", isMobile ? "text-lg" : "text-3xl lg:text-4xl")}>{b.heading}</h2>
                    ) : (
                      !isMobile && <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                        {t("Welcome back")}, {user?.name?.split(' ')[0]}! 👋
                      </h2>
                    )}
                    
                    {b.paragraph ? (
                      <p className={cn("font-medium opacity-90 leading-relaxed", isMobile ? "text-[10px] line-clamp-2" : "text-sm max-w-lg")}>{b.paragraph}</p>
                    ) : (
                      !isMobile && <p className="text-sm font-medium opacity-90 max-w-md leading-relaxed">
                        {t("Find the best doctors and book your appointments easily.")}
                      </p>
                    )}
                    
                    {b.ctaText && b.ctaLink && (
                      b.ctaLink.startsWith('http') ? (
                        <a href={b.ctaLink} target="_blank" rel="noopener noreferrer" className={cn("bg-white text-slate-900 rounded-full font-black w-fit hover:bg-slate-100 transition-colors mt-2", isMobile ? "px-3 py-1.5 text-[10px]" : "px-8 py-3 rounded-2xl shadow-xl shadow-black/10")}>
                          {b.ctaText}
                        </a>
                      ) : (
                        <Link href={b.ctaLink} className={cn("bg-white text-slate-900 rounded-full font-black w-fit hover:bg-slate-100 transition-colors mt-2", isMobile ? "px-3 py-1.5 text-[10px]" : "px-8 py-3 rounded-2xl shadow-xl shadow-black/10")}>
                          {b.ctaText}
                        </Link>
                      )
                    )}
                  </div>
                  {b.imageUrl && (
                    <div className={cn("shrink-0", isMobile ? "w-[120px] h-[120px] ml-2" : "w-[180px] h-[180px] ml-4")}>
                      <div className={cn("w-full h-full bg-white dark:bg-slate-800 shadow-2xl overflow-hidden", isMobile ? "rounded-xl" : "rounded-2xl")}>
                        <img src={b.imageUrl} alt={`Banner ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      
      <div className={cn("flex justify-center", isMobile ? "gap-1.5 mt-4" : "gap-2 mt-4")}>
        {homeBanners.map((_, i) => (
          <button
            key={i}
            className={cn(
              "rounded-full transition-all duration-300",
              isMobile ? "h-1.5" : "h-2",
              i === current ? (isMobile ? "w-6 bg-primary" : "w-8 bg-primary") : (isMobile ? "w-1.5 bg-slate-200 dark:bg-slate-700" : "w-2 bg-slate-200 dark:bg-slate-700")
            )}
            onClick={() => api?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
