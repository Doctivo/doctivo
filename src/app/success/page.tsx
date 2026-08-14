'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Share2, Download, Printer, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAppointmentById } from '@/app/actions/appointment-actions';
import { Appointment } from '@/lib/types';
import { generateProfessionalPDF, getPDFBase64, getPDFBlob } from '@/lib/pdf-generator';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const storeAppointments = useStore(state => state.appointments);
  const { toast } = useToast();

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
      if (foundInStore) { setAppointment(foundInStore); setIsLoading(false); return; }
      const data = await getAppointmentById(id);
      setAppointment(data);
      setIsLoading(false);
    }
    load();
  }, [id, storeAppointments]);

  const handleDownloadPDF = async () => {
    if (!appointment) return;
    setIsDownloading(true);
    try {
      const dataUrl = await getPDFBase64(appointment);
      const base64Str = dataUrl.split(',')[1];
      const filename = `Doctivo_Ticket_${appointment.id.slice(-6).toUpperCase()}.pdf`;
      
      if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
        (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
          action: 'download',
          base64: base64Str,
          filename: filename
        }));
        toast({ title: "Success", description: "Downloading Ticket..." });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Success", description: "Booking Ticket downloaded." });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate PDF.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!appointment) return;
    const shareUrl = `${window.location.origin}/prescription/${appointment.id}`;
    const shareText = `🏥 *Doctivo Appointment*\nToken: #${appointment.tokenNumber}\nDoctor: ${appointment.doctorName}\nTrack Live: ${shareUrl}`;
    
    try {
      if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
        const dataUrl = await getPDFBase64(appointment);
        const base64Str = dataUrl.split(',')[1];
        const filename = `Doctivo_Ticket_${appointment.id.slice(-6).toUpperCase()}.pdf`;
        (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
          action: 'sharePDF',
          base64: base64Str,
          filename: filename
        }));
      } else if (navigator.share) {
        const pdfBlob = await getPDFBlob(appointment);
        const file = new File([pdfBlob], `Doctivo_Ticket_${appointment.tokenNumber}.pdf`, { type: 'application/pdf' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: 'Doctivo Booking Ticket', text: shareText, files: [file] }).catch(e => {
            console.error(e);
            // Fallback: Download PDF
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Doctivo_Ticket_${appointment.tokenNumber}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast({ title: "PDF Downloaded", description: "Browser blocked sharing. PDF downloaded instead." });
          });
          return;
        }
        // Fallback if file sharing is not supported
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Doctivo_Ticket_${appointment.tokenNumber}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        toast({ title: "PDF Downloaded", description: "Sharing not supported. PDF downloaded instead." });
      } else {
        toast({ title: 'Error', description: 'Sharing not supported on this device.' });
      }
    } catch (err) {
      console.error('Share failed:', err);
      toast({ title: "Error", description: "Failed to generate or share PDF." });
    }
  };

  const handlePrintPDF = async () => {
    if (!appointment) return;
    if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
      setIsDownloading(true);
      try {
        const dataUrl = await getPDFBase64(appointment);
        const base64Str = dataUrl.split(',')[1];
        const filename = `Doctivo_Ticket_${appointment.id.slice(-6).toUpperCase()}.pdf`;
        (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
          action: 'printPDF',
          base64: base64Str,
          filename: filename
        }));
      } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not prepare print.' });
      } finally {
        setIsDownloading(false);
      }
    } else {
      window.open(`/prescription/${appointment.id}`, '_blank');
    }
  };

  if (isLoading) return <div className="mobile-container flex flex-col items-center justify-center min-h-screen bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!appointment) return <div className="mobile-container flex flex-col items-center justify-center min-h-screen bg-slate-50 p-10"><Button onClick={() => router.push('/home')}>Home</Button></div>;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 min-h-screen">
      <div className="w-full max-w-md flex flex-col space-y-6 pt-10">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="h-28 w-28 bg-green-500 rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle2 className="h-16 w-16 text-white stroke-[3px]" />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Booking Done!</h1>
            <p className="text-slate-500 font-medium px-4">Your appointment with <span className="text-slate-900 font-black">{appointment.doctorName}</span> is confirmed.</p>
          </div>
        </div>

        <div className="w-full">
          <Card className="w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white mt-4 relative">
            <div className="absolute top-0 left-0 w-full h-3 bg-primary"></div>
            <CardContent className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-black">Your Token</p>
                  <p className="text-4xl font-black text-primary">#{appointment.tokenNumber}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl text-center min-w-[100px]">
                  <p className="text-slate-400 text-[9px] uppercase font-black">Booking ID</p>
                  <p className="text-xs font-black text-slate-800">#{appointment.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-blue-50 border border-blue-100 flex flex-col items-center space-y-1">
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-wider">Verification OTP</p>
                <p className="text-2xl font-black text-blue-700 tracking-widest">{appointment.visit_otp}</p>
              </div>

              <div className="pt-6 flex justify-around border-t border-slate-50">
                <button onClick={handleShare} className="flex flex-col items-center gap-2 text-slate-400 transition-transform active:scale-95 hover:text-blue-500">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-blue-50 flex items-center justify-center"><Share2 className="h-5 w-5" /></div>
                  <span className="text-[9px] font-black uppercase">Share Link</span>
                </button>
                <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex flex-col items-center gap-2 text-slate-400 transition-transform active:scale-95 hover:text-blue-500">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-blue-50 flex items-center justify-center">
                    {isDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  </div>
                  <span className="text-[9px] font-black uppercase">Download</span>
                </button>
                <button onClick={handlePrintPDF} disabled={isDownloading} className="flex flex-col items-center gap-2 text-slate-400 transition-transform active:scale-95 hover:text-blue-500">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-blue-50 flex items-center justify-center"><Printer className="h-5 w-5" /></div>
                  <span className="text-[9px] font-black uppercase">Print</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 mb-8 space-y-4">
          <Button className="w-full h-14 text-lg font-black bg-primary rounded-[2rem] shadow-2xl hover:bg-blue-700 transition-all" onClick={() => router.push('/appointments')}>Track Live Queue</Button>
          <Button variant="ghost" className="w-full h-12 text-slate-400 font-bold hover:bg-slate-200 rounded-xl transition-all" onClick={() => router.push('/home')}>Go Back Home</Button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<Loader2 className="animate-spin" />}>
      <SuccessContent />
    </Suspense>
  );
}

