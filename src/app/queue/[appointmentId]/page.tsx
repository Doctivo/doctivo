'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getLiveQueueStatus } from '@/actions/appointments';
import { Loader2, ArrowLeft, RefreshCcw, Clock, Users, Activity, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LiveQueuePage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const router = useRouter();
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    params.then(p => setAppointmentId(p.appointmentId));
  }, [params]);

  const loadData = async (isRefresh = false) => {
    if (!appointmentId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const res = await getLiveQueueStatus(appointmentId);
    if (res.success) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error || 'Failed to load queue status.');
    }

    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    if (appointmentId) {
      loadData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => loadData(true), 30000);
      return () => clearInterval(interval);
    }
  }, [appointmentId]);

  if (loading && !data) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center min-h-[70vh] p-6 bg-[#F8FAFF]">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Connecting to Clinic...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center min-h-[70vh] p-6 bg-[#F8FAFF]">
        <div className="bg-red-50 p-6 rounded-3xl text-center space-y-4">
          <p className="font-bold text-red-600">{error}</p>
          <Button onClick={() => router.back()} className="bg-slate-800 rounded-full">Go Back</Button>
        </div>
      </div>
    );
  }

  const { myToken, myStatus, currentServingToken, peopleAhead, estWaitMinutes, doctorName } = data;
  const isMyTurn = myStatus === 'With Doctor';
  const isDone = myStatus === 'Completed';

  return (
    <div className="mobile-container min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6 pb-12 rounded-b-[3rem] shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push('/appointments')} className="text-white hover:bg-white/20 -ml-2 rounded-full h-10 w-10 p-0">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-sm font-black uppercase tracking-widest text-indigo-200">Live Tracker</h1>
          <Button variant="ghost" onClick={() => loadData(true)} disabled={refreshing} className="text-white hover:bg-white/20 -mr-2 rounded-full h-10 w-10 p-0">
            <RefreshCcw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider">Consulting</p>
          <h2 className="text-2xl font-black">{doctorName}</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 -mt-8 space-y-6 pb-10">
        
        {/* Token Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Your Token Number</p>
          <div className="text-7xl font-black text-slate-800 tabular-nums tracking-tighter">
            {myToken}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold">
            <Activity className="w-4 h-4" />
            Status: {myStatus}
          </div>
        </div>

        {isDone ? (
          <div className="bg-green-50 rounded-[2rem] p-8 text-center border border-green-100">
            <h3 className="text-xl font-black text-green-700">Consultation Completed!</h3>
            <p className="text-green-600/80 mt-2 font-medium">Thank you for visiting.</p>
          </div>
        ) : isMyTurn ? (
          <div className="bg-indigo-600 rounded-[2rem] p-8 text-center text-white shadow-xl shadow-indigo-600/20 animate-in slide-in-from-bottom-4">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 opacity-90 animate-pulse" />
            <h3 className="text-2xl font-black">It's your turn!</h3>
            <p className="text-indigo-200 mt-2 font-medium">Please proceed to the doctor's cabin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Currently Serving */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Token</p>
              <div className="text-4xl font-black text-indigo-600 tabular-nums">{currentServingToken || '--'}</div>
            </div>

            {/* People Ahead */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center justify-center">
              <Users className="w-5 h-5 text-amber-500 mb-2" />
              <div className="text-2xl font-black text-slate-800">{peopleAhead < 0 ? 0 : peopleAhead}</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">People Ahead</p>
            </div>

            {/* Estimated Wait */}
            <div className="col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Wait Time</p>
                  <p className="text-xl font-black text-slate-800">
                    {peopleAhead <= 0 ? 'Any minute now' : `~${estWaitMinutes} mins`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
