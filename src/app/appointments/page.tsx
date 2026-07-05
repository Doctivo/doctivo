'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Filter, Loader2, Circle, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import { Download, Info, CheckCircle2 } from 'lucide-react';
import { getUserAppointments } from '@/app/actions/appointment-actions';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { differenceInDays, parseISO, isWithinInterval, subDays, subMonths } from 'date-fns';
import Image from 'next/image';

type TimeFilter = 'All' | 'This Week' | 'Last Month' | 'Last 3 Months';

export default function AppointmentsPage() {
  const router = useRouter();
  const appointments = useStore(state => state.appointments);
  const setAppointments = useStore(state => state.setAppointments);
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async (appointment: any) => {
    if (!appointment) return;
    setIsDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = '#2563eb';
      const darkColor = '#1e293b';
      const lightColor = '#64748b';
      const bgColor = '#f8fafc';
      
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, 15, 180, 240, 5, 5, 'FD');

      pdf.setFillColor(37, 99, 235);
      pdf.rect(15, 15, 180, 5, 'F');

      pdf.setTextColor(primaryColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.text('DOCTIVO', 25, 40);

      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('HEALTHCARE SIMPLIFIED', 25, 46);

      pdf.setTextColor(darkColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('APPOINTMENT TICKET', 115, 42);

      pdf.setDrawColor(241, 245, 249);
      pdf.line(25, 55, 185, 55);

      // Token Box
      pdf.setFillColor(bgColor);
      pdf.roundedRect(25, 65, 75, 40, 4, 4, 'F');
      
      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('YOUR TOKEN NUMBER', 35, 76);

      pdf.setTextColor(primaryColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(36);
      pdf.text(`#${appointment.tokenNumber || 1}`, 35, 96);

      // OTP / ID Box
      pdf.setFillColor(bgColor);
      pdf.roundedRect(110, 65, 75, 40, 4, 4, 'F');

      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('BOOKING ID', 120, 76);
      pdf.setTextColor(darkColor);
      pdf.setFontSize(12);
      pdf.text(`#${String(appointment.id).slice(-6).toUpperCase()}`, 120, 83);

      pdf.setTextColor(lightColor);
      pdf.setFontSize(9);
      pdf.text('VISIT VERIFICATION OTP', 120, 93);
      pdf.setTextColor(primaryColor);
      pdf.setFontSize(14);
      pdf.text(`${appointment.visit_otp || '123456'}`, 120, 100);

      pdf.line(25, 120, 185, 120);

      pdf.setFontSize(10);
      
      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Patient Name', 25, 132);
      pdf.setTextColor(darkColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text(appointment.patientName, 25, 138);

      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Patient Type', 110, 132);
      pdf.setTextColor(darkColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(appointment.patientType || 'Other').replace('_', ' ').toUpperCase(), 110, 138);

      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Appointment Date', 25, 154);
      pdf.setTextColor(darkColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatDate(appointment.date), 25, 160);

      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Time Slot', 110, 154);
      pdf.setTextColor(darkColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text(appointment.time, 110, 160);

      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Consultation Fee', 25, 176);
      pdf.setTextColor(darkColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Rs. ${appointment.consultation_fee_amount || 500}`, 25, 182);

      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Payment Status', 110, 176);
      pdf.setTextColor(appointment.payment_status === 'Paid' ? '#16a34a' : '#d97706');
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(appointment.payment_status || 'Unpaid').toUpperCase(), 110, 182);

      // Doctor details
      pdf.setFillColor(bgColor);
      pdf.roundedRect(25, 195, 150, 22, 3, 3, 'F');
      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('ASSIGNED DOCTOR / THERAPIST', 32, 204);
      pdf.setTextColor(darkColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(appointment.doctorName, 32, 211);

      pdf.setTextColor(lightColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('Please arrive 10 minutes prior to your selected slot.', 25, 235);
      pdf.text('For cancellations or rescheduling, please contact support.', 25, 240);

      // Trigger download inside webview context or standard browser
      if (typeof window !== 'undefined' && (window as any).DoctivoAppChannel) {
        try {
          const pdfDataUri = pdf.output('datauri' as any) as unknown as string;
          const pdfBase64 = pdfDataUri.split(',')[1] || '';
          
          (window as any).DoctivoAppChannel.postMessage(JSON.stringify({
            action: 'download',
            base64: pdfBase64,
            filename: `Doctivo_Booking_${appointment.id.slice(-6).toUpperCase()}.pdf`
          }));
        } catch (webviewErr) {
          console.error(webviewErr);
          pdf.save(`Doctivo_Booking_${appointment.id.slice(-6).toUpperCase()}.pdf`);
        }
      } else {
        pdf.save(`Doctivo_Booking_${appointment.id.slice(-6).toUpperCase()}.pdf`);
      }
    } catch (err) {
      console.error(err);
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
    <div className="mobile-container pb-32 bg-slate-50 min-h-screen overflow-y-auto">
      <div className="bg-white px-6 pt-8 pb-4 sticky top-0 z-20 border-b border-slate-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl overflow-hidden relative shadow-sm border border-slate-100 shrink-0">
              <Image src="/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg" alt="Logo" fill className="object-cover" />
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

        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-300">
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

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Appointments...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentList.map((app, index) => {
              const pos = getQueuePosition(app, index);
              const isMissed = app.status === 'Missed';
              
              return (
                <Card 
                  key={app.id} 
                  onClick={() => setSelectedApp(app)}
                  className={cn(
                    "border-slate-300 shadow-lg rounded-[2.5rem] overflow-hidden bg-white border-2 cursor-pointer hover:border-blue-500/50 active:scale-[0.98] transition-all",
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
                        {app.status === 'Confirmed' ? 'BOOKED' : isMissed ? 'MISSED (AUTO-CANCEL)' : app.status.toUpperCase()}
                      </div>
                    </div>

                    <hr className="border-slate-200" />

                    <div className="flex items-center space-x-5">
                      <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-bold text-2xl border-2 border-slate-200 shadow-inner overflow-hidden relative">
                        <span>🏥</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight">{app.doctorName}</h3>
                        <p className="text-[12px] font-bold text-primary">Specialist</p>
                        <p className="text-[11px] font-bold text-slate-500">Patient: {app.patientName}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-3 bg-slate-50/80 border border-slate-200 p-3 rounded-[1.5rem]">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-[12px] font-black text-slate-700">{formatDate(app.date)}</span>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-[12px] font-black text-slate-700">{app.time}</span>
                      </div>
                    </div>

                    {activeTab === 'Upcoming' && app.status !== 'Cancelled' && (
                      <div className="bg-slate-900 text-white rounded-[2rem] p-6 mt-4 shadow-xl shadow-slate-900/10">
                        <div className="flex justify-between items-center mb-4 px-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Queue Status</p>
                          <div className="flex items-center space-x-1.5">
                            <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Live Updates</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center divide-x divide-slate-800">
                          <div className="flex-1 text-center pr-4">
                            <p className="text-2xl font-black text-blue-400">{typeof pos === 'number' ? `#${pos}` : pos}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                              {pos === 'NOW' ? 'Consulting' : 'Your Turn'}
                            </p>
                          </div>
                          <div className="flex-1 text-center pl-4">
                            <p className="text-2xl font-black text-blue-400">
                              {pos === 'NOW' ? '0' : (typeof pos === 'number' ? (pos * 12) : 15)}m
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Est. Wait Time</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {currentList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 border-2 border-slate-200 border-dashed">
                  <Calendar className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-900 font-black text-lg">No records found</p>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Adjust your filters or book a new session.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />

      <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) setSelectedApp(null); }}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="text-center space-y-2 pb-4 border-b border-slate-100">
            <DialogTitle className="text-2xl font-black text-slate-800">Booking Ticket</DialogTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              ID: #APT-{selectedApp?.id?.slice(-6).toUpperCase()}
            </p>
          </DialogHeader>

          {selectedApp && (
            <div className="py-6 space-y-6">
              {/* Token and OTP Row */}
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

              {/* Patient and Doctor Information */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Doctor Name:</span>
                  <span className="font-black text-slate-800">{selectedApp.doctorName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Patient Name:</span>
                  <span className="font-black text-slate-800">{selectedApp.patientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Time Slot:</span>
                  <span className="font-black text-slate-800">{selectedApp.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Date:</span>
                  <span className="font-black text-slate-800">{formatDate(selectedApp.date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Consultation Fee:</span>
                  <span className="font-black text-slate-800">Rs. {selectedApp.consultation_fee_amount || 500}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Payment Status:</span>
                  <span className={`font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    selectedApp.payment_status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {selectedApp.payment_status || 'Unpaid'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <Button 
                onClick={() => handleDownloadPDF(selectedApp)}
                disabled={isDownloading}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2"
              >
                {isDownloading ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
                Download PDF Ticket
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
