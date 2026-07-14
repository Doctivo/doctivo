'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Stethoscope, CheckCircle, RefreshCw, LogOut, Settings, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getDoctorAppointmentsForDate, updateAppointmentStatus, verifyVisitOtp } from '@/app/actions/appointment-actions';
import { getDoctorsCatalog } from '@/app/actions/admin-actions';
import { getDoctorById, getDoctorAttendants, addAttendant, updateDoctorSchedule } from '@/app/actions/doctor-actions';
import { logoutSession } from '@/app/actions/auth-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [otpVerifyAppId, setOtpVerifyAppId] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);

  // Doctor Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'staff' | 'schedule'>('staff');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', email: '' });
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  
  // Doctor Schedule state
  const [docDetails, setDocDetails] = useState<any | null>(null);
  const [schedData, setSchedData] = useState({
    startTime: '09:00',
    endTime: '17:00',
    workingDays: [] as string[]
  });
  const [customOverrides, setCustomOverrides] = useState<Record<string, any>>({});
  
  // Custom override picker state
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideAvailable, setOverrideAvailable] = useState(true);
  const [overrideStart, setOverrideStart] = useState('09:00');
  const [overrideEnd, setOverrideEnd] = useState('17:00');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const handleOpenSettings = async () => {
    if (!selectedDoctorId) return;
    setIsSettingsOpen(true);
    try {
      // 1. Fetch fresh doctor details
      const doc = await getDoctorById(selectedDoctorId);
      if (doc) {
        setDocDetails(doc);
        setSchedData({
          startTime: doc.startTime || '09:00',
          endTime: doc.endTime || '17:00',
          workingDays: doc.workingDays || []
        });
        setCustomOverrides(doc.customSchedule || {});
      }

      // 2. Fetch fresh staff list
      const staff = await getDoctorAttendants(selectedDoctorId);
      setStaffList(staff);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Name and Phone are required.' });
      return;
    }
    setIsAddingStaff(true);
    try {
      const res = await addAttendant(newStaff, selectedDoctorId);
      if (res.success) {
        toast({ title: 'Staff Added', description: `Attendant registered with ID: ${res.attendantId}` });
        setNewStaff({ name: '', phone: '', email: '' });
        const staff = await getDoctorAttendants(selectedDoctorId);
        setStaffList(staff);
      } else {
        toast({ variant: 'destructive', title: 'Onboarding Failed', description: res.error });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleAddOverride = () => {
    if (!overrideDate) {
      toast({ variant: 'destructive', title: 'Select Date', description: 'Please select a date first.' });
      return;
    }
    const updated = {
      ...customOverrides,
      [overrideDate]: {
        isAvailable: overrideAvailable,
        startTime: overrideAvailable ? overrideStart : null,
        endTime: overrideAvailable ? overrideEnd : null
      }
    };
    setCustomOverrides(updated);
    setOverrideDate('');
  };

  const handleRemoveOverride = (dateKey: string) => {
    const updated = { ...customOverrides };
    delete updated[dateKey];
    setCustomOverrides(updated);
  };

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      const res = await updateDoctorSchedule(selectedDoctorId, schedData, customOverrides);
      if (res.success) {
        toast({ title: 'Schedule Saved', description: 'Availability and overrides updated successfully.' });
        setIsSettingsOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Failed to Save', description: res.error });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    const days = [...schedData.workingDays];
    const idx = days.indexOf(day);
    if (idx > -1) {
      days.splice(idx, 1);
    } else {
      days.push(day);
    }
    setSchedData({ ...schedData, workingDays: days });
  };

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
        // If Attendant, auto-select their doctor
        setSelectedDoctorId((admin as any).doctor_id);
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

  const handleOpenOtpVerification = (appId: string) => {
    setOtpVerifyAppId(appId);
    setEnteredOtp('');
  };

  const handleVerifyOtp = async () => {
    if (!otpVerifyAppId || enteredOtp.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: 'Please enter a valid 6-digit code.' });
      return;
    }
    setVerifying(true);
    try {
      const res = await verifyVisitOtp(otpVerifyAppId, enteredOtp);
      if (res.success) {
        toast({ title: 'Visit Verified', description: 'Patient marked as completed/visited successfully!' });
        setOtpVerifyAppId(null);
        loadQueue();
      } else {
        toast({ variant: 'destructive', title: 'Verification Failed', description: res.error });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutSession();
      logout();
      window.location.href = '/login';
    } catch (e) {
      router.replace('/login');
    }
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

          {/* Dropdown removed for Attendant as they are locked to their creator doctor */}

          <Button onClick={loadQueue} variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 hover:bg-slate-50">
            <RefreshCw className={`h-5 w-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {mode === 'Doctor' && (
            <Button onClick={handleOpenSettings} variant="outline" className="h-12 rounded-xl border-slate-200 hover:bg-slate-50 font-bold px-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600" /> Settings
            </Button>
          )}

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
                          <Button onClick={() => handleOpenOtpVerification(app.id)} size="sm" className="bg-amber-500 text-white font-bold h-9 hover:bg-amber-600">
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

      <Dialog open={!!otpVerifyAppId} onOpenChange={(open) => { if (!open) setOtpVerifyAppId(null); }}>
        <DialogContent className="max-w-md rounded-[2rem] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="text-2xl font-black text-slate-800">Visit Verification OTP</DialogTitle>
            <p className="text-sm font-bold text-slate-400">Please ask the patient for the 6-digit visit OTP shown on their receipt or ticket.</p>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Input 
              type="text" 
              maxLength={6} 
              placeholder="Enter 6-digit OTP" 
              value={enteredOtp} 
              onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ''))} 
              className="h-16 text-center text-2xl font-black tracking-widest bg-slate-50 border-none rounded-2xl placeholder:text-slate-300"
            />
          </div>
          <DialogFooter className="flex gap-4">
            <Button variant="ghost" onClick={() => setOtpVerifyAppId(null)} className="flex-1 h-14 rounded-2xl font-bold border-slate-200 text-slate-500">
              Cancel
            </Button>
            <Button onClick={handleVerifyOtp} disabled={verifying || enteredOtp.length !== 6} className="flex-1 h-14 rounded-2xl font-black bg-green-600 hover:bg-green-700 text-white">
              {verifying ? <RefreshCw className="animate-spin h-5 w-5" /> : 'Verify & Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 bg-slate-50 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-black text-slate-800">Doctor Settings</DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Configure schedule & clinic attendants</p>
            </div>
            
            <div className="flex bg-slate-200 p-1 rounded-xl shrink-0 mr-6">
              <button 
                onClick={() => setSettingsTab('staff')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${settingsTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Staff (Attendants)
              </button>
              <button 
                onClick={() => setSettingsTab('schedule')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${settingsTab === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Schedule & Overrides
              </button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8 overflow-y-auto">
            {settingsTab === 'staff' ? (
              <div className="space-y-8">
                {/* Add Attendant Section */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Add Clinic Attendant</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                      <Input 
                        placeholder="John Doe" 
                        value={newStaff.name} 
                        onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                        className="h-12 bg-white border-slate-200 font-bold rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Phone Number</Label>
                      <Input 
                        placeholder="10-digit number" 
                        maxLength={10}
                        value={newStaff.phone} 
                        onChange={e => setNewStaff({ ...newStaff, phone: e.target.value.replace(/\D/g, '') })}
                        className="h-12 bg-white border-slate-200 font-bold rounded-xl"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Email Address (Optional)</Label>
                      <Input 
                        placeholder="attendant@example.com" 
                        value={newStaff.email} 
                        onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                        className="h-12 bg-white border-slate-200 font-bold rounded-xl"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddStaff} 
                    disabled={isAddingStaff}
                    className="w-full h-12 bg-blue-600 font-black rounded-xl text-white mt-2"
                  >
                    {isAddingStaff ? <RefreshCw className="animate-spin h-5 w-5 text-white" /> : 'Register Attendant'}
                  </Button>
                </div>

                {/* Staff List Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Current Clinic Staff</h3>
                  {staffList.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium italic">No attendants registered yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {staffList.map(staff => (
                        <div key={staff.attendant_id} className="py-4 flex justify-between items-center border-b border-slate-100">
                          <div>
                            <p className="text-sm font-black text-slate-800">{staff.full_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {staff.attendant_id}</p>
                          </div>
                          <div className="text-right text-xs font-bold text-slate-500">
                            {staff.phone_number}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Default Schedule */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Default Consultation Hours</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Start Time</Label>
                      <Input 
                        type="time" 
                        value={schedData.startTime} 
                        onChange={e => setSchedData({ ...schedData, startTime: e.target.value })}
                        className="h-12 bg-white border-slate-200 font-bold rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">End Time</Label>
                      <Input 
                        type="time" 
                        value={schedData.endTime} 
                        onChange={e => setSchedData({ ...schedData, endTime: e.target.value })}
                        className="h-12 bg-white border-slate-200 font-bold rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Active Working Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const isWorking = schedData.workingDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleWorkingDay(day)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                              isWorking 
                                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Next Week Custom Overrides */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Date-Specific Availability Overrides</h3>
                  
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Override availability, off-duty days, or custom consultation hours for specific calendar dates (e.g. next Wednesday).
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Target Date</Label>
                        <Input 
                          type="date" 
                          value={overrideDate}
                          onChange={e => setOverrideDate(e.target.value)}
                          className="h-12 bg-white border-slate-200 font-bold rounded-xl"
                        />
                      </div>
                      <div className="flex flex-col justify-end space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Availability</Label>
                        <div className="flex items-center space-x-3 h-12">
                          <Checkbox 
                            id="over-avail" 
                            checked={overrideAvailable}
                            onCheckedChange={checked => setOverrideAvailable(!!checked)}
                          />
                          <Label htmlFor="over-avail" className="text-xs font-bold text-slate-700 cursor-pointer">Doctor is On-duty</Label>
                        </div>
                      </div>

                      {overrideAvailable && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Start Time</Label>
                            <Input 
                              type="time" 
                              value={overrideStart}
                              onChange={e => setOverrideStart(e.target.value)}
                              className="h-12 bg-white border-slate-200 font-bold rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">End Time</Label>
                            <Input 
                              type="time" 
                              value={overrideEnd}
                              onChange={e => setOverrideEnd(e.target.value)}
                              className="h-12 bg-white border-slate-200 font-bold rounded-xl"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <Button 
                      onClick={handleAddOverride}
                      className="w-full h-12 bg-blue-600 font-black rounded-xl text-white mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Override Record
                    </Button>
                  </div>

                  {/* Overrides List */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Overrides</h4>
                    {Object.keys(customOverrides).length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium italic">No date overrides created.</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(customOverrides).map(([dateKey, val]: [string, any]) => {
                          const dateObj = new Date(dateKey);
                          const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                          return (
                            <div key={dateKey} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                              <div>
                                <p className="text-xs font-black text-slate-800">{formattedDate}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                                  {val.isAvailable ? `Custom Hours: ${val.startTime} - ${val.endTime}` : 'Doctor is Off-duty (Closed)'}
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveOverride(dateKey)}
                                className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-xl"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {settingsTab === 'schedule' && (
            <DialogFooter className="p-8 bg-slate-50 border-t flex gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 h-14 rounded-2xl font-bold border-slate-200 text-slate-500"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="flex-1 h-14 rounded-2xl font-black bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSavingSchedule ? <RefreshCw className="animate-spin h-5 w-5" /> : 'Save Schedule Settings'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
