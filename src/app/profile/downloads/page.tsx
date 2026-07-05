'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Calendar, Clock, User } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getUserAppointments } from '@/app/actions/appointment-actions';
import { Appointment } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function DownloadsPage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    async function load() {
      if (user?.id) {
        const data = await getUserAppointments(user.id);
        // Only show confirmed or completed bookings as they are eligible for receipts
        const validBookings = data.filter(a => a.status === 'Confirmed' || a.status === 'Completed' || a.status === 'Waiting' || a.status === 'In Consultation');
        setAppointments(validBookings);
      }
      setLoading(false);
    }
    load();
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="mobile-container pb-12 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="bg-white p-6 pt-10 flex items-center border-b border-border shadow-sm sticky top-0 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/profile')} 
          className="mr-3 h-10 w-10 rounded-full hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5 text-slate-700" />
        </Button>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">My Downloads</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
            Receipts & Tickets
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading tickets...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">No Receipts Available</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Once you book appointments and they are confirmed, your tickets will appear here for download.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/home')} 
              className="bg-primary text-white font-bold h-12 rounded-xl px-6"
            >
              Book Appointment Now
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => (
              <Card key={app.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Doctor</p>
                      <h4 className="font-black text-slate-800 text-base leading-tight">{app.doctorName}</h4>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-center min-w-[70px]">
                      <p className="text-[9px] font-black uppercase tracking-tight text-blue-400">Token</p>
                      <p className="text-sm font-black">#{app.tokenNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 text-xs font-bold text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{app.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 justify-end">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{app.time}</span>
                    </div>
                    <div className="flex items-center space-x-2 col-span-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>Patient: {app.patientName}</span>
                    </div>
                    {app.visit_otp && (
                      <div className="flex items-center space-x-2 col-span-2 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/30 justify-between mt-2 print:hidden">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 text-[10px] font-black uppercase">Visit OTP:</span>
                          <span className="font-black text-sm text-blue-700 tracking-wider leading-none">{app.visit_otp}</span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold">Provide at clinic</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => router.push(`/success?id=${app.id}`)}
                    className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Download / Print Ticket
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
