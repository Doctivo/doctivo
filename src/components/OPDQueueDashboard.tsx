'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Stethoscope, CheckCircle, RefreshCw, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getDoctorAppointmentsForDate, updateAppointmentStatus } from '@/app/actions/appointment-actions';
import { getDoctorsCatalog } from '@/app/actions/admin-actions';
import { logoutSession } from '@/app/actions/auth-actions';

interface OPDQueueDashboardProps {
  mode: 'Doctor' | 'Attendant';
  targetId: string;
}

export function OPDQueueDashboard({ mode, targetId }: OPDQueueDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const logout = useStore(state => state.logout);
  const admin = useStore(state => state.admin);
  const isAuthenticated = useStore(state => state.isAuthenticated);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const istTime = new Date(today.getTime() + (5.5 * 60 * 60 * 1000));
    return istTime.toISOString().split('T')[0];
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Authenticate check
  useEffect(() => {
    if (!isAuthenticated || !admin) {
      router.push('/login');
    }
  }, [isAuthenticated, admin, router]);

  // 2. Initialize Doctor selection
  useEffect(() => {
    async function init() {
      if (!admin) return;
      
      if (mode === 'Doctor') {
        setSelectedDoctorId(targetId);
      } else {
        // If Attendant, load list of doctors to manage
        try {
          const docs = await getDoctorsCatalog();
          setDoctors(docs);
          if (docs.length > 0) {
            setSelectedDoctorId(docs[0].doctor_id);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    init();
  }, [admin, mode, targetId]);

  // 3. Load appointments
  async function loadQueue() {
    if (!selectedDoctorId || !selectedDate) return;
    setLoading(true);
    try {
      const data = await getDoctorAppointmentsForDate(selectedDoctorId, selectedDate);
      setAppointments(data);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Fetch Failed', description: 'Could not load appointments.' });
    }
    setLoading(false);
  }

  useEffect(() => {
    loadQueue();
  }, [selectedDoctorId, selectedDate]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const res = await updateAppointmentStatus(appId, newStatus);
      if (res.success) {
        toast({ title: 'Queue Updated', description: `Patient marked as ${newStatus}.` });
        loadQueue();
      } else {
        toast({ variant: 'destructive', title: 'Update Failed', description: res.error });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleLogout = async () => {
    await logoutSession();
    logout();
    router.push('/login');
  };

  if (!admin) return null;

  // Compute metrics
  const totalBooked = appointments.length;
  const waitingRoom = appointments.filter(a => a.status === 'Waiting').length;
  const withDoctor = appointments.filter(a => a.status === 'With Doctor').length;
  const completed = appointments.filter(a => a.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">OPD Queue Control</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Logged in as: {admin.full_name} ({admin.role})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase text-slate-400">Date:</span>
            <Input 
              type="date" 
              className="w-[160px] h-12 bg-slate-50 border-none font-bold rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
            />
          </div>

          {mode === 'Attendant' && doctors.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-slate-400">Doctor:</span>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger className="w-[200px] h-12 bg-slate-50 border-none font-bold rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200">
                  {doctors.map(d => (
                    <SelectItem key={d.doctor_id} value={d.doctor_id} className="font-bold py-2.5">
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={loadQueue} variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 hover:bg-slate-50">
            <RefreshCw className={`h-5 w-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button onClick={handleLogout} variant="ghost" className="h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold px-4">
            <LogOut className="mr-2 h-5 w-5" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Metrics Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <div className="p-6 flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Booked</p>
              <p className="text-2xl font-black text-slate-800">{totalBooked}</p>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <div className="p-6 flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <UserCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiting Room</p>
              <p className="text-2xl font-black text-amber-600">{waitingRoom}</p>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <div className="p-6 flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Cabin</p>
              <p className="text-2xl font-black text-indigo-600">{withDoctor}</p>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <div className="p-6 flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
              <p className="text-2xl font-black text-green-600">{completed}</p>
            </div>
          </div>
        </Card>
      </section>

      {/* OPD Queue List */}
      <section className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">OPD Patient Queue Table</h2>
          <Badge className="bg-blue-50 text-blue-600 border-none font-bold uppercase py-1 px-3">Today's List</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Token #</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Time Slot</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Symptoms</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 font-bold text-slate-400">
                    <RefreshCw className="animate-spin h-8 w-8 mx-auto text-primary mb-3" />
                    Syncing live queue...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 font-bold text-slate-400">
                    No appointments booked for today.
                  </td>
                </tr>
              ) : (
                appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6 font-black text-lg text-primary">#{app.tokenNumber}</td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-800">{app.patientName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{app.patientType}</p>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-700">{app.time}</td>
                    <td className="px-8 py-6 text-sm text-slate-500 max-w-[200px] truncate">
                      {app.current_symptoms || 'General Checkup'}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <Badge className={
                        app.status === 'Completed' ? 'bg-green-50 text-green-600 border-none font-bold' :
                        app.status === 'With Doctor' ? 'bg-indigo-50 text-indigo-600 border-none font-bold animate-pulse' :
                        app.status === 'Waiting' ? 'bg-amber-50 text-amber-600 border-none font-bold' :
                        app.status === 'Absent' ? 'bg-red-50 text-red-600 border-none font-bold' :
                        'bg-blue-50 text-blue-600 border-none font-bold'
                      }>
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {app.status === 'Confirmed' && (
                          <Button onClick={() => handleStatusChange(app.id, 'Waiting')} size="sm" className="bg-amber-500 text-white font-bold h-9 hover:bg-amber-600">
                            Check In
                          </Button>
                        )}
                        {app.status === 'Waiting' && (
                          <Button onClick={() => handleStatusChange(app.id, 'With Doctor')} size="sm" className="bg-indigo-600 text-white font-bold h-9 hover:bg-indigo-700">
                            Call In
                          </Button>
                        )}
                        {app.status === 'With Doctor' && (
                          <Button onClick={() => handleStatusChange(app.id, 'Completed')} size="sm" className="bg-green-600 text-white font-bold h-9 hover:bg-green-700">
                            Complete
                          </Button>
                        )}
                        {app.status !== 'Completed' && app.status !== 'Absent' && app.status !== 'Cancelled' && (
                          <Button onClick={() => handleStatusChange(app.id, 'Absent')} variant="outline" size="sm" className="h-9 font-bold border-red-100 text-red-500 hover:bg-red-50">
                            Absent
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
