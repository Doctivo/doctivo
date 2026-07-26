'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Filter, Loader2, Circle, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Info, CheckCircle2, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserAppointments, updateAppointmentStatus } from '@/app/actions/appointment-actions';
import { Appointment } from '@/lib/types';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { differenceInDays, parseISO, isWithinInterval, subDays, subMonths } from 'date-fns';
import Image from 'next/image';
import { generateProfessionalPDF, getPDFBase64 } from '@/lib/pdf-generator';

type TimeFilter = 'All' | 'This Week' | 'Last Month' | 'Last 3 Months';

export default function AppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const appointments = useStore(state => state.appointments);
  const setAppointments = useStore(state => state.setAppointments);
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const downloadedTickets = useStore(state => state.downloadedTickets);
  const setDownloadedTickets = useStore(state => state.setDownloadedTickets);
  
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async (appId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setIsCancelling(true);
    const res = await updateAppointmentStatus(appId, 'Cancelled');
    setIsCancelling(false);
    if (res.success) {
      toast({ title: 'Success', description: 'Booking cancelled successfully.' });
      setAppointments(appointments.map(a => a.id === appId ? { ...a, status: 'Cancelled' } : a));
      setSelectedApp(null);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to cancel.' });
    }
  };

  const handleShare = async (app: any) => {
    try {
      setIsDownloading(true);
      const textToShare = `My appointment with ${app.doctorName} is confirmed for ${app.time}. Token: #${app.tokenNumber}`;
      
      if (navigator.share) {
        const dataUrl = await getPDFBase64(app);
        const filename = `Doctivo_Ticket_${String(app.id || '').slice(-6).toUpperCase()}.pdf`;
        
        // Convert base64 to Blob
        const base64Data = dataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Doctivo Appointment',
            text: textToShare,
            files: [file]
          }).catch(e => {
            console.error('Share promise failed', e);
            if (navigator.clipboard) navigator.clipboard.writeText(textToShare);
            toast({ title: 'Copied', description: 'Details copied to clipboard' });
          });
        } else {
          await navigator.share({
            title: 'Doctivo Appointment',
            text: textToShare,
          }).catch(e => {
            console.error('Share promise failed', e);
            if (navigator.clipboard) navigator.clipboard.writeText(textToShare);
            toast({ title: 'Copied', description: 'Details copied to clipboard' });
          });
        }
      } else {
        if (navigator.clipboard) navigator.clipboard.writeText(textToShare);
        toast({ title: 'Copied', description: 'Details copied to clipboard' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to share.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async (appointment: any) => {
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
        toast({ title: "Success", description: "Downloading Ticket..." });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (!downloadedTickets.includes(appointment.id)) {
          setDownloadedTickets([...downloadedTickets, appointment.id]);
        }
  
        toast({ title: 'Success', description: 'Ticket downloaded successfully.' });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate ticket PDF.' });
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    async function syncData() {
      if (user?.id) {
        const data = await getUserAppointments(user.id);
        setAppointments(data);
      }
      setLoading(false);
    }
    syncData();
  }, [isAuthenticated, user?.id, router, setAppointments]);

  const filteredByTime = useMemo(() => {
    if (timeFilter === 'All') return appointments;
    const now = new Date();
    
    return appointments.filter(app => {
      const appDate = parseISO(app.date);
      if (timeFilter === 'This Week') {
        return isWithinInterval(appDate, { start: subDays(now, 7), end: now });
      }
      if (timeFilter === 'Last Month') {
        return isWithinInterval(appDate, { start: subMonths(now, 1), end: now });
      }
      if (timeFilter === 'Last 3 Months') {
        return isWithinInterval(appDate, { start: subMonths(now, 3), end: now });
      }
      return true;
    });
  }, [appointments, timeFilter]);

  const upcoming = filteredByTime.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.status !== 'Missed');
  const past = filteredByTime.filter(a => a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'Missed');
  const currentList = activeTab === 'Upcoming' ? upcoming : past;

  const formatDate = (dateVal: any) => {
    if (!dateVal) return '';
    const dateStr = String(dateVal);
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const getQueuePosition = (app: any, index: number) => {
    if (app.status === 'Waiting') return index + 1;
    if (app.status === 'In Consultation') return 'NOW';
    return index + 2; 
  };

  if (!isAuthenticated) return null;

  return (
    <div className="mobile-container pb-24 min-h-screen bg-slate-50">
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6 px-6 pt-8 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl overflow-hidden relative shadow-sm border border-slate-100 shrink-0 bg-white">
              <Image src="/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg" alt="Logo" fill className="object-contain p-1" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bookings</h1>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2.5 bg-slate-100 rounded-full text-slate-500 border border-slate-300 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {timeFilter !== 'All' && <span className="text-[10px] font-black text-primary uppercase">{timeFilter}</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-2 border-slate-100">
              {(['All', 'This Week', 'Last Month', 'Last 3 Months'] as TimeFilter[]).map((f) => (
                <DropdownMenuItem 
                  key={f} 
                  onClick={() => setTimeFilter(f)}
                  className="p-3 rounded-xl font-bold text-sm cursor-pointer flex justify-between items-center"
                >
                  {f}
                  {timeFilter === f && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-100 max-w-sm mx-6 mb-6">
          <button 
            onClick={() => setActiveTab('Upcoming')}
            className={cn(
              "flex-1 py-3 text-xs font-black rounded-xl transition-all",
              activeTab === 'Upcoming' ? "bg-white text-primary shadow-md" : "text-slate-500"
            )}
          >
            Active
          </button>
          <button 
            onClick={() => setActiveTab('Past')}
            className={cn(
              "flex-1 py-3 text-xs font-black rounded-xl transition-all",
              activeTab === 'Past' ? "bg-white text-primary shadow-md" : "text-slate-500"
            )}
          >
            History
          </button>
        </div>
      </div>

      <div className="p-6 md:p-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Appointments...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentList.map((app, index) => {
              const pos = getQueuePosition(app, index);
              const isMissed = app.status === 'Missed';
              
              return (
                <Card 
                  key={app.id} 
                  onClick={activeTab === 'Past' ? undefined : () => setSelectedApp(app)}
                  className={cn(
                    "border-slate-100 shadow-lg rounded-[2.5rem] overflow-hidden bg-white border-2 transition-all",
                    activeTab !== 'Past' && "cursor-pointer hover:border-blue-500/50 active:scale-[0.98]",
                    isMissed && "opacity-75 border-slate-200 grayscale-[0.5]"
                  )}
                >
                  <CardContent className="p-6 space-y-5">
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[11px] font-black text-slate-500 tracking-tight">ID: #APT-{app.id.slice(-6).toUpperCase()}</p>
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        app.status === 'Confirmed' ? "bg-green-100 text-green-700" : 
                        app.status === 'Cancelled' ? "bg-red-100 text-red-700" : 
                        app.status === 'Missed' ? "bg-slate-100 text-slate-500" : "bg-orange-100 text-orange-700"
                      )}>
                        {app.status === 'Confirmed' ? 'BOOKED' : isMissed ? 'MISSED' : app.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-5">
                      <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-bold text-2xl border border-slate-100 shrink-0">
                        <span>🏥</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight">{app.doctorName}</h3>
                        <p className="text-[11px] font-bold text-slate-500">Patient: {app.patientName}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-3 bg-slate-50 p-3 rounded-[1.5rem]">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-[12px] font-black text-slate-700">{formatDate(app.date)}</span>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-[12px] font-black text-slate-700">{app.time}</span>
                      </div>
                    </div>

                    {activeTab === 'Upcoming' && app.status !== 'Cancelled' && (
                      <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl">
                        <div className="flex items-center divide-x divide-slate-800">
                          <div className="flex-1 text-center pr-4">
                            <p className="text-2xl font-black text-blue-400">{typeof pos === 'number' ? `#${pos}` : pos}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Your Turn</p>
                          </div>
                          <div className="flex-1 text-center pl-4">
                            <p className="text-2xl font-black text-blue-400">
                              {pos === 'NOW' ? '0' : (typeof pos === 'number' ? (pos * 12) : 15)}m
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Wait Time</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {currentList.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-center space-y-6">
                <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border-2 border-slate-100 border-dashed">
                  <Calendar className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-900 font-black text-lg">No records found</p>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Adjust filters or book a new session.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) setSelectedApp(null); }}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="text-center space-y-2 pb-4 border-b border-slate-100">
            <DialogTitle className="text-2xl font-black text-slate-800">Booking Ticket</DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Your Token</p>
                  <p className="text-3xl font-black text-blue-600">#{selectedApp.tokenNumber || 1}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Verification OTP</p>
                  <p className="text-3xl font-black text-blue-600 tracking-wider">{selectedApp.visit_otp || '123456'}</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-5 rounded-[1.8rem] text-xs">
                <div className="flex justify-between items-center"><span className="font-bold text-slate-400">Doctor:</span><span className="font-black text-slate-800">{selectedApp.doctorName}</span></div>
                <div className="flex justify-between items-center"><span className="font-bold text-slate-400">Patient:</span><span className="font-black text-slate-800">{selectedApp.patientName}</span></div>
                <div className="flex justify-between items-center"><span className="font-bold text-slate-400">Slot:</span><span className="font-black text-slate-800">{selectedApp.time}</span></div>
                <div className="flex justify-between items-center"><span className="font-bold text-slate-400">Fee:</span><span className="font-black text-slate-800">Rs. {selectedApp.consultation_fee_amount}</span></div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button onClick={() => handleShare(selectedApp)} variant="outline" className="h-14 w-14 bg-slate-50 border-slate-200 rounded-2xl shrink-0">
                    <Share2 className="h-5 w-5 text-slate-600" />
                  </Button>
                  <Button onClick={() => handleDownloadPDF(selectedApp)} disabled={isDownloading} className="flex-1 h-14 bg-blue-600 font-black rounded-2xl gap-2">
                    {isDownloading ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
                    Download Ticket
                  </Button>
                </div>
                {activeTab === 'Upcoming' && selectedApp.status !== 'Cancelled' && selectedApp.status !== 'Completed' && (
                  <Button variant="outline" onClick={() => handleCancel(selectedApp.id)} disabled={isCancelling} className="w-full h-14 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 font-black rounded-2xl gap-2">
                    {isCancelling ? <Loader2 className="animate-spin h-5 w-5" /> : 'Cancel Booking'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
