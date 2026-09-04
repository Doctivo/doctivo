
'use client';

import { useEffect, useState } from 'react';
import { Search, Calendar, Clock, User, XCircle, MoreVertical, RefreshCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAdminBookings, cancelAppointment } from '@/actions/admin';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function BookingsOverride() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const data = await getAdminBookings();
    setBookings(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id: string) => {
    const res = await cancelAppointment(id);
    if (res.success) {
      toast({ title: 'Cancelled', description: 'Booking has been cancelled and status updated.' });
      load();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bookings Override</h1>
        <p className="text-slate-500 font-medium">Control center for all platform appointments.</p>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input placeholder="Find by Patient, Doctor or ID..." className="pl-11 h-12 bg-slate-50 border-none rounded-xl" />
          </div>
          <Button variant="outline" onClick={load} className="rounded-xl h-12 font-bold text-xs">
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh List
          </Button>
        </div>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Appointment ID</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date/Time</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 font-bold text-slate-300 uppercase text-xs">Processing...</td></tr>
              ) : bookings.map((app) => (
                <tr key={String(app.appointment_id)} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-blue-600">#{String(app.appointment_id)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-800">{String(app.patient_name)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{String(app.patient_type)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-800">{String(app.doctor_name)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                      <Calendar className="h-3 w-3" /> <span>{String(app.appointment_date)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
                      <Clock className="h-3 w-3" /> <span>{String(app.appointment_time_slot)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge className={cn(
                      "font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 border-none",
                      app.status === 'Confirmed' ? "bg-green-50 text-green-600" :
                      app.status === 'Cancelled' ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
                    )}>
                      {String(app.status)}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {app.status !== 'Cancelled' && (
                      <Button 
                        onClick={() => handleCancel(app.appointment_id)}
                        variant="ghost" 
                        className="text-red-500 hover:bg-red-50 h-9 rounded-xl font-bold text-[10px]"
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

