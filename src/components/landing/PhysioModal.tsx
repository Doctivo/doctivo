import { useRouter } from 'next/navigation';
import { Users, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function PhysioModal({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
  const router = useRouter();
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-[3rem] p-8 border-none shadow-2xl bg-white">
        <DialogHeader className="text-center pb-6 border-b border-slate-50">
          <DialogTitle className="text-2xl font-black text-slate-800">Physiotherapy Visit</DialogTitle>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Select Consultation Mode</p>
        </DialogHeader>

        <div className="space-y-4 py-8">
          <button 
            onClick={() => {
              setIsOpen(false);
              router.push('/doctors?specialty=Physiotherapist&mode=Clinic');
            }}
            className="w-full p-6 rounded-[2rem] border-2 border-slate-100 hover:border-blue-600 bg-white flex items-center group transition-all"
          >
            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="ml-5 text-left">
              <p className="text-lg font-black text-slate-800 leading-none">Visit Clinic</p>
              <p className="text-[10px] text-slate-500 font-black mt-2 uppercase">Professional OPD Setup</p>
            </div>
          </button>

          <button 
            onClick={() => {
              setIsOpen(false);
              router.push('/doctors?specialty=Physiotherapist&mode=Home');
            }}
            className="w-full p-6 rounded-[2rem] border-2 border-slate-100 hover:border-purple-600 bg-white flex items-center group transition-all"
          >
            <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="h-7 w-7" />
            </div>
            <div className="ml-5 text-left">
              <p className="text-lg font-black text-slate-800 leading-none">Home Visit</p>
              <p className="text-[10px] text-slate-500 font-black mt-2 uppercase">Therapy at your doorstep</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
