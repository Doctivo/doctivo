'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PhysioDialog({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: (val: boolean) => void 
}) {
  const router = useRouter();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-[3rem] p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader className="text-center pb-6 border-b border-slate-50 dark:border-slate-800">
          <DialogTitle className="text-2xl font-black text-slate-800 dark:text-slate-100">Physiotherapy Visit</DialogTitle>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Consultation Mode</p>
        </DialogHeader>

        <div className="space-y-4 py-8">
          <button 
            onClick={() => {
              onClose(false);
              router.push('/physio?mode=Clinic');
            }}
            className="w-full p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center group transition-all"
          >
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="ml-5 text-left">
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none">Visit Clinic</p>
              <p className="text-[10px] text-slate-400 font-black mt-2 uppercase">Professional OPD Setup</p>
            </div>
          </button>

          <button 
            onClick={() => {
              onClose(false);
              router.push('/physio?mode=Home');
            }}
            className="w-full p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 hover:border-purple-600 dark:hover:border-purple-500 bg-white dark:bg-slate-800 flex items-center group transition-all"
          >
            <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Users className="h-7 w-7" />
            </div>
            <div className="ml-5 text-left">
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none">Home Visit</p>
              <p className="text-[10px] text-slate-400 font-black mt-2 uppercase">Therapy at your doorstep</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
