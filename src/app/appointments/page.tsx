'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Filter, Loader2, Circle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { getUserAppointments } from '@/app/actions/appointment-actions';

export default function AppointmentsPage() {
  const router = useRouter();
  const appointments = useStore(state => state.appointments);
  const setAppointments = useStore(state => state.setAppointments);
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [loading, setLoading] = useState(true);

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

  const upcoming = appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled');
  const past = appointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled');
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

  /**
   * Mock logic to simulate live position based on DB status.
   * In a production app, this would fetch real-time queue length from the clinic.
   */
  const getQueuePosition = (status: string, index: number) => {
    if (status === 'Waiting') return index + 1;
    if (status === 'In Consultation') return 'NOW';
    return index + 2; // Default for Confirmed but not yet checked-in
  };

  if (!isAuthenticated) return null;

  return (
    <div className="mobile-container pb-32 bg-slate-50 min-h-screen overflow-y-auto">
      <div className="bg-white px-6 pt-8 pb-4 sticky top-0 z-20 border-b border-slate-300">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bookings</h1>
          <button className="p-2.5 bg-slate-100 rounded-full text-slate-500 border border-slate-300">
            <Filter className="h-5 w-5" />
          </button>
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
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Syncing Appointments...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentList.map((app, index) => {
              const pos = getQueuePosition(app.status, index);
              return (
                <Card key={app.id} className="border-slate-300 shadow-lg rounded-[2.5rem] overflow-hidden bg-white border-2">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[11px] font-black text-slate-500 tracking-tight">ID: #APT-{app.id.slice(-6).toUpperCase()}</p>
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        app.status === 'Confirmed' ? "bg-green-100 text-green-700" : 
                        app.status === 'Cancelled' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {app.status === 'Confirmed' ? 'BOOKED' : app.status === 'Waiting' ? 'WAITING' : app.status.toUpperCase()}
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

                    {activeTab === 'Upcoming' && (
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
                  <p className="text-slate-500 font-medium text-sm">Aapke sabhi appointments yahan dikhenge.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
