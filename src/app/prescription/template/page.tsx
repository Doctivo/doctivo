'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Printer, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrescriptionTemplate() {
  const router = useRouter();

  const visitData = {
    doctorName: "Dr. Prince Yadav",
    patientName: "Pk bhai pkk",
    timeSlot: "11:30 AM",
    date: "06/07/2026",
    fee: "Rs. 510",
    paymentStatus: "Paid"
  };

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-10 flex flex-col items-center print:bg-white print:p-0">
      {/* Action Header */}
      <div className="w-full max-w-[800px] mb-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-black text-slate-800">Prescription Preview</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="font-bold rounded-xl">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button className="bg-blue-600 font-bold rounded-xl shadow-lg shadow-blue-600/20">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Actual Prescription Design (A4 Ratio) */}
      <div className="bg-white w-full max-w-[794px] min-h-[1123px] relative shadow-2xl overflow-hidden font-sans print:shadow-none print:m-0 flex flex-col print:w-[210mm] print:h-[297mm]">
        
        {/* Header Design Shapes */}
        <div className="absolute top-0 left-0 w-full h-[280px] pointer-events-none">
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 800 280" preserveAspectRatio="none">
            <path d="M0 0 H800 V120 C650 220 350 50 0 160 Z" fill="#007cc3" />
            <path d="M0 145 C150 180 300 50 500 150 C650 230 800 150 800 130 V160 C750 190 650 240 500 175 C300 100 150 210 0 175 Z" fill="#a6ce39" />
          </svg>
        </div>

        {/* Hospital/Clinic Info Content */}
        <div className="relative pt-10 pr-12 text-right space-y-1 z-10">
          <h2 className="text-4xl font-black text-white drop-shadow-md">DOCTIVO</h2>
          <p className="text-sm font-black text-white italic pr-1">Healthcare Simplified</p>
          <div className="pt-6 text-[10px] font-bold text-slate-100 leading-tight">
            <p>Medical Road, Asuran Chauraha</p>
            <p>Gorakhpur, Uttar Pradesh - 273001</p>
            <p className="pt-1">Phone: +91 73079 86604</p>
          </div>
        </div>

        {/* Content */}
        <div className="relative mt-8 px-12 z-10 space-y-8">
           <div className="space-y-0.5">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Prescribing Doctor</p>
            <h3 className="text-xl font-black text-slate-800">{visitData.doctorName}</h3>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Token Number</p>
              <p className="text-4xl font-black text-blue-600">#1</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification Code</p>
              <p className="text-3xl font-black text-slate-800 tracking-wider">651528</p>
            </div>
          </div>

          <div className="space-y-6 pt-4">
             <div className="flex items-end border-b border-dotted border-slate-300 pb-1">
                <span className="text-sm font-black text-slate-800 mr-4">Name :</span>
                <span className="text-base font-bold text-slate-700">{visitData.patientName}</span>
             </div>
             <div className="grid grid-cols-3 gap-4">
               <div><p className="text-[9px] font-black text-slate-400 uppercase">Date</p><p className="font-bold text-sm">{visitData.date}</p></div>
               <div><p className="text-[9px] font-black text-slate-400 uppercase">Slot</p><p className="font-bold text-sm">{visitData.timeSlot}</p></div>
               <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Status</p><p className="font-black text-sm text-green-600">PAID</p></div>
             </div>
          </div>

          {/* Rx Section */}
          <div className="pt-12 relative flex-1">
             <span className="text-5xl font-serif font-black text-slate-200 absolute top-0 -left-4">Rx</span>
             <div className="mt-12 space-y-12">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="border-b border-slate-100 h-1"></div>
               ))}
             </div>
          </div>
        </div>

        {/* Footer Design */}
        <div className="relative w-full h-[100px] pointer-events-none mt-auto">
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 800 100" preserveAspectRatio="none">
            <path d="M800 100 L0 100 L0 70 C200 40 450 110 800 40 Z" fill="#a6ce39" />
            <path d="M800 100 L400 100 C550 70 650 90 800 60 Z" fill="#007cc3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
