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
  const downloadedTickets = useStore(state => state.downloadedTickets);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    async function load() {
      if (user?.id && downloadedTickets && downloadedTickets.length > 0) {
        const data = await getUserAppointments(user.id);
        const validBookings = data.filter(a => downloadedTickets.includes(a.id));
        setAppointments(validBookings);
      } else {
        setAppointments([]);
      }
      setLoading(false);
    }
    load();
  }, [isAuthenticated, user, router, downloadedTickets]);

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
                You haven't downloaded any tickets yet. Go to your bookings to download tickets.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/appointments')} 
              className="bg-primary text-white font-bold h-12 rounded-xl px-6"
            >
              Go to Bookings
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => (
              <Card key={app.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 border border-red-200">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">PDF Receipt</p>
                        <h4 className="font-black text-slate-800 text-sm leading-tight">Ticket_{app.id.slice(-6).toUpperCase()}.pdf</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400">1.2 MB</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Doctor</p>
                      <p className="text-xs font-bold text-slate-800">{app.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Token</p>
                      <p className="text-xs font-bold text-slate-800">#{app.tokenNumber}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full h-10 border-slate-200 text-slate-600 rounded-xl font-bold gap-2">
                    <Download className="h-4 w-4" /> Re-download
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

