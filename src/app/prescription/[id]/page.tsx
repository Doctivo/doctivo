'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Printer, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAppointmentById } from '@/app/actions/appointment-actions';
import { Appointment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateProfessionalPDF, getPDFBase64 } from '@/lib/pdf-generator';
import Image from 'next/image';

export default function PublicPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getAppointmentById(id);
      setAppointment(data);
      setLoading(false);
    }
    load();
  }, [id]);

  const handlePrint = async () => {
    if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
      if (!appointment) return;
      setIsDownloading(true);
      try {
        const dataUrl = await getPDFBase64(appointment);
        const base64Str = dataUrl.split(',')[1];
        const filename = `Doctivo_Ticket_${String(appointment.id || '').slice(-6).toUpperCase()}.pdf`;
        (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
          action: 'printPDF',
          base64: base64Str,
          filename: filename
        }));
      } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to build PDF for print.' });
      } finally {
        setIsDownloading(false);
      }
    } else {
      window.print();
    }
  };

  const handleDownload = async () => {
    if (!appointment) return;
    setIsDownloading(true);
    try {
      const dataUrl = await getPDFBase64(appointment);
      const base64Str = dataUrl.split(',')[1];
      const filename = `Doctivo_Ticket_${String(appointment.id || '').slice(-6).toUpperCase()}.pdf`;
      
      if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
        (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
          action: 'download',
          base64: base64Str,
          filename: filename
        }));
        toast({ title: 'Success', description: 'Downloading Ticket...' });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Success', description: 'Booking Ticket downloaded.' });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to build PDF.' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!appointment) return <div className="p-10 text-center font-black text-slate-400 uppercase tracking-widest">Record Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-0 md:p-10 print:bg-white print:p-0 overflow-x-hidden selection:bg-blue-100">
      <div className="w-full max-w-[800px] mb-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden mx-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-black text-slate-800 hidden sm:block">Digital Booking Ticket</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="font-bold rounded-xl h-11">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading} className="bg-blue-600 font-bold rounded-xl shadow-lg shadow-blue-600/20 h-11">
            {isDownloading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Download className="mr-2 h-4 w-4" />} PDF
          </Button>
        </div>
      </div>

      <div id="prescription-ticket" className="bg-white w-full max-w-[794px] min-h-[1123px] max-h-[1123px] relative shadow-2xl overflow-hidden font-sans print:shadow-none print:m-0 flex flex-col print:h-[297mm] print:w-[210mm]">
        
        <div className="absolute top-0 left-0 w-full h-[280px] pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 800 280" preserveAspectRatio="none">
            <path d="M0 0 H800 V120 C600 70 300 240 0 170 Z" fill="#007cc3" />
            <path d="M0 190 C180 140 450 260 800 130 V155 C450 285 180 165 0 215 Z" fill="#a6ce39" />
          </svg>
        </div>

        <div className="absolute top-6 left-12 z-10">
          <div className="h-24 w-24 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30">
            <Image src="/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg" alt="Logo" width={96} height={96} className="object-cover" />
          </div>
        </div>

        <div className="relative pt-10 pr-12 text-right space-y-1 z-10">
          <h2 className="text-5xl font-black text-white drop-shadow-lg">DOCTIVO</h2>
          <p className="text-sm font-black text-black italic opacity-90 pr-1 tracking-tight">Healthcare Simplified</p>
          <div className="pt-6 text-[11px] font-bold text-black leading-tight opacity-80">
            <p>Medical Road, Gorakhpur, UP - 273001</p>
            <p>Phone: +91 73079 86604</p>
          </div>
        </div>

        <div className="relative mt-8 px-12 z-10 space-y-6">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">CONSULTATION RECEIPT</p>
            <div className="h-1.5 w-32 bg-blue-600 rounded-full" />
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center shadow-2xl">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Token Number</p>
              <p className="text-5xl font-black text-blue-400 leading-none">#{appointment.tokenNumber}</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Visit OTP</p>
              <p className="text-3xl font-black text-white tracking-[0.3em] leading-none">{appointment.visit_otp}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Slot Time</p>
              <p className="text-lg font-black text-blue-400 leading-none">{appointment.time}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-4 pt-2">
            <div className="flex flex-col space-y-1 border-b border-slate-100 pb-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Patient Details</p>
              <div className="flex items-center flex-wrap gap-x-6">
                <span className="text-2xl font-black text-slate-800 uppercase tracking-tight">{appointment.patientName}</span>
                <div className="flex items-center space-x-3 text-xs font-bold text-slate-500 pt-1">
                  <span>Age: {appointment.patientAge || 'N/A'}</span>
                  <span className="h-1 w-1 bg-slate-300 rounded-full" />
                  <span>Gender: {appointment.patientGender || 'N/A'}</span>
                  <span className="h-1 w-1 bg-slate-300 rounded-full" />
                  <span>Blood: {appointment.patientBloodGroup || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Symptoms & Concerns</p>
              <p className="text-sm font-bold text-slate-600 leading-relaxed italic border-l-4 border-blue-500/20 pl-4 bg-slate-50/50 py-2 rounded-r-xl">
                {appointment.current_symptoms || 'General Health Consultation & Routine Checkup'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-4 bg-slate-50 p-6 rounded-[2rem]">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Referral</p>
                <p className="text-sm font-black text-slate-800">{appointment.doctorName}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Date</p>
                <p className="text-sm font-black text-slate-800">{appointment.date}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase">Payment</p>
                <p className="text-sm font-black text-emerald-600 uppercase">{appointment.payment_status}</p>
              </div>
            </div>
          </div>

          <div className="pt-10 relative flex-1 min-h-[350px]">
             <span className="text-6xl font-serif font-black text-slate-100 absolute -top-4 -left-6 select-none">Rx</span>
          </div>
        </div>

        <div className="mt-auto relative w-full h-[100px] pointer-events-none z-0">
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 800 100" preserveAspectRatio="none">
            <path d="M800 100 L0 100 L0 50 C200 30 450 120 800 40 Z" fill="#a6ce39" />
            <path d="M800 100 L400 100 C550 70 650 90 800 60 Z" fill="#007cc3" />
          </svg>
          <div className="absolute bottom-4 left-12 text-[10px] text-white font-black uppercase tracking-widest z-10 opacity-90">
            Digital Doctivo Record • Valid only for visit on {appointment.date}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 0; }
          #prescription-ticket { border: none; box-shadow: none; margin: 0; }
        }
      `}</style>
    </div>
  );
}
