'use client';

import { useEffect, useState } from 'react';
import { 
  Users, UserCheck, Zap, Banknote, 
  TrendingUp, PieChart as RePieChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminMetrics } from '@/app/actions/admin-actions';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#2563eb', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#f59e0b'];

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<any>({
    activeDoctors: 0,
    totalPatients: 0,
    liveBookings: 0,
    grossRevenue: 0,
    trendData: [],
    specialtyData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getAdminMetrics();
      setMetrics(data);
      setLoading(false);
    }
    load();
  }, []);

  const stats = [
    { label: 'Active Doctors', value: metrics.activeDoctors, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Patients', value: metrics.totalPatients, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Live Bookings', value: metrics.liveBookings, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Gross Revenue', value: `₹${metrics.grossRevenue}`, icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500 font-medium">Real-time health of Doctivo platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("h-7 w-7", stat.color)} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <Card className="border-none shadow-sm rounded-[2rem] p-8 bg-white min-h-[400px]">
          <div className="flex items-center space-x-3 mb-8">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Booking Trend (Last 7 Days)</h3>
          </div>
          <div className="h-[300px] w-full">
            {metrics.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <TrendingUp className="h-12 w-12 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-400">Awaiting booking data...</p>
              </div>
            )}
          </div>
        </Card>

        {/* Specialty Pie Chart */}
        <Card className="border-none shadow-sm rounded-[2rem] p-8 bg-white min-h-[400px]">
          <div className="flex items-center space-x-3 mb-8">
            <RePieChartIcon className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Specialty Distribution</h3>
          </div>
          <div className="h-[300px] w-full">
            {metrics.specialtyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.specialtyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metrics.specialtyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <RePieChartIcon className="h-12 w-12 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-400">Awaiting doctor registrations...</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

