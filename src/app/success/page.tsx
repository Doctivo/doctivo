'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ChevronRight, Share2, Download, MessageSquare, Printer, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAppointmentById } from '@/app/actions/appointment-actions';
import { Appointment } from '@/lib/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const storeAppointments = useStore(state => state.appointments);
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      const foundInStore = storeAppointments.find(a => a.id === id);
      if (foundInStore) {
        setAppointment(foundInStore);
        setIsLoading(false);
        return;
      }

      const data = await getAppointmentById(id);
      setAppointment(data);
      setIsLoading(false);
    }
    load();
  }, [id, storeAppointments]);



  const getShareText = () => {
    if (!appointment) return '';
    return `🏥 *Doctivo Appointment Confirmation*\n\n` +
      `*Token Number:* #${appointment.tokenNumber || 1}\n` +
      `*Booking ID:* #${appointment.id.slice(-6)}\n` +
      `*Patient Name:* ${appointment.patientName}\n` +
      `*Doctor:* ${appointment.doctorName}\n` +
      `*Date:* ${displayDate}\n` +
      `*Time Slot:* ${appointment.time}\n\n` +
      `Track your live queue here: ${window.location.origin}/appointments`;
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !appointment) return;
    
    if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
      setIsDownloading(true);
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm margin on each side
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.text('Doctivo Appointment Receipt', 10, 15);
        pdf.addImage(imgData, 'PNG', 10, 25, pdfWidth, pdfHeight);
        
        const pdfBase64 = pdf.output('datauristring');
        
        (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
          action: 'download',
          base64: pdfBase64,
          filename: `Doctivo_Booking_${appointment.id.slice(-6)}.pdf`
        }));
        
        toast({
          title: "Download Started",
          description: "Receipt is being downloaded to your device.",
        });
      } catch (error) {
        console.error('App PDF Generation Error:', error);
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: "Could not generate PDF.",
        });
      } finally {
        setIsDownloading(false);
      }
      return;
    }
    
    setIsDownloading(true);
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm margin on each side
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.text('Doctivo Appointment Receipt', 10, 15);
      pdf.addImage(imgData, 'PNG', 10, 25, pdfWidth, pdfHeight);
      pdf.save(`Doctivo_Booking_${appointment.id.slice(-6)}.pdf`);
      
      toast({
        title: "Success",
        description: "PDF Downloaded successfully.",
      });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not generate PDF file.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
      (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
        action: 'share',
        text: getShareText()
      }));
      return;
    }
    window.print();
  };

  const handleShare = async () => {
    if (!appointment) return;
    const shareText = getShareText();
    
    if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
      (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
        action: 'share',
        text: shareText
      }));
      return;
    }

    const shareData = {
      title: 'Doctivo Appointment Confirmation',
      text: `My appointment with ${appointment.doctorName} is confirmed! Token: #${appointment.tokenNumber}. Booking ID: ${appointment.id}`,
      url: window.location.href,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.warn('Navigator share failed:', err);
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} | Booking Link: ${shareData.url}`);
        toast({
          title: "Copied to Clipboard",
          description: "Booking details copied for sharing.",
        });
      }
    } catch (clipboardErr) {
      console.error('Clipboard copy failed:', clipboardErr);
      toast({
        variant: "destructive",
        title: "Share Failed",
        description: "Could not share details.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verifying Booking...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center min-h-screen bg-slate-50 p-10 text-center">
        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-red-300" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Booking Not Found</h2>
        <p className="text-sm text-slate-500 mb-8">We couldn't locate this appointment record.</p>
        <Button onClick={() => router.push('/home')} className="w-full h-14 rounded-2xl font-bold bg-slate-900">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const displayDate = typeof appointment.date === 'object' && appointment.date 
    ? (appointment.date as any).toLocaleDateString() 
    : String(appointment.date);

  return (
    <div className="mobile-container flex flex-col p-6 bg-slate-50 min-h-screen print:bg-white print:p-0">
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 pt-10 print:pt-0">
        <div className="relative mb-4 print:hidden">
          <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-25"></div>
          <div className="h-28 w-28 bg-green-500 rounded-full flex items-center justify-center relative z-10 shadow-2xl shadow-green-500/20">
            <CheckCircle2 className="h-16 w-16 text-white stroke-[3px]" />
          </div>
        </div>
        
        <div className="text-center space-y-2 print:mt-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Booking Done!</h1>
          <p className="text-slate-500 font-medium px-4">
            Your appointment with <span className="text-slate-900 font-black">{appointment.doctorName}</span> is confirmed.
          </p>
        </div>

        <div className="w-full bg-green-50 border-2 border-green-100 p-4 rounded-3xl flex items-center space-x-4 print:hidden">
          <div className="h-12 w-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/10">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-green-700 font-black uppercase tracking-wider mb-1">Confirmation Sent</p>
            <p className="text-[10px] text-green-600 font-bold leading-tight">Details & Token have been saved to your account.</p>
          </div>
        </div>

        {/* Capture Area */}
        <div ref={receiptRef} className="w-full">
          <Card className="w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white mt-4 relative print:shadow-none print:border print:rounded-2xl">
            <div className="absolute top-0 left-0 w-full h-3 bg-primary print:hidden"></div>
            <CardContent className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Your Token</p>
                  <p className="text-4xl font-black text-primary">#{appointment.tokenNumber || 1}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center min-w-[100px] print:bg-white">
                  <p className="text-slate-400 text-[9px] uppercase font-black tracking-tighter">Booking ID</p>
                  <p className="text-xs font-black text-slate-800">#{appointment.id.slice(-6)}</p>
                </div>
              </div>

              <div className="h-px w-full border-t border-dashed border-slate-200"></div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Patient Name</p>
                  <p className="text-sm font-black text-slate-800">{appointment.patientName}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Type</p>
                  <p className="text-sm font-black text-primary uppercase">{appointment.patientType.replace('_', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Date</p>
                  <p className="text-sm font-black text-slate-800">{displayDate}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Time Slot</p>
                  <p className="text-sm font-black text-slate-800">{appointment.time}</p>
                </div>
              </div>

              <div className="pt-6 flex justify-around border-t border-slate-50 print:hidden">
                <button onClick={handleShare} className="flex flex-col items-center gap-2 text-slate-400 hover:text-primary transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center"><Share2 className="h-5 w-5" /></div>
                  <span className="text-[9px] font-black uppercase">Share</span>
                </button>
                <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex flex-col items-center gap-2 text-slate-400 hover:text-primary transition-colors disabled:opacity-50">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    {isDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  </div>
                  <span className="text-[9px] font-black uppercase">PDF</span>
                </button>
                <button onClick={handlePrint} className="flex flex-col items-center gap-2 text-slate-400 hover:text-primary transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center"><Printer className="h-5 w-5" /></div>
                  <span className="text-[9px] font-black uppercase">Print</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10 mb-8 space-y-4 print:hidden">
        <Button 
          className="w-full h-18 text-xl font-black bg-primary rounded-[2rem] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
          onClick={() => router.push('/appointments')}
        >
          Track Live Queue <ArrowRight className="h-6 w-6" />
        </Button>
        <Button 
          variant="ghost" 
          className="w-full h-14 text-slate-400 font-bold hover:text-primary"
          onClick={() => router.push('/home')}
        >
          Go Back Home
        </Button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
