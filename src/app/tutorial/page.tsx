'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import Image from 'next/image';

const TUTORIAL_STEPS = [
  {
    title: "Verify Yourself",
    description: "Secure login with your mobile number and direct access.",
    color: "bg-blue-500"
  },
  {
    title: "Create Profile",
    description: "Add your medical history and symptoms for smarter matches.",
    color: "bg-purple-500"
  },
  {
    title: "Book Instantly",
    description: "Choose specialists near you and book slots in seconds.",
    color: "bg-green-500"
  },
  {
    title: "Live Queue Tracking",
    description: "Track your turn in real-time. No more long waiting hours.",
    color: "bg-orange-500"
  }
];

export default function TutorialPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const isAuthenticated = useStore(state => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, router]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/login');
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="mobile-container bg-white flex flex-col items-center justify-between p-8 pt-20">
      <div className="w-full flex flex-col items-center space-y-12">
        {/* Logo Visual (Using high-quality Image 8 for all steps) */}
        <div className={cn(
          "h-48 w-48 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 transform relative overflow-hidden",
          TUTORIAL_STEPS[currentStep].color
        )}>
          <Image priority 
            src="/logo.png" 
            alt="Doctivo Logo" 
            fill 
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {TUTORIAL_STEPS[currentStep].title}
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed px-4">
            {TUTORIAL_STEPS[currentStep].description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex space-x-2">
          {TUTORIAL_STEPS.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                idx === currentStep ? "w-8 bg-primary" : "w-2 bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Footer Action */}
      <div className="w-full space-y-4 pb-8">
        <Button 
          className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group"
          onClick={handleNext}
        >
          {currentStep === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next Step'}
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
        <button 
          onClick={() => router.push('/login')}
          className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
        >
          Skip Introduction
        </button>
      </div>
    </div>
  );
}
