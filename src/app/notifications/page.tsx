'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Bell, BellOff, AlertCircle, CheckCircle2, Clock, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { getUserAppointments } from '@/actions/appointments';
import { Appointment } from '@/types';

interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
  icon: any;
  iconColor: string;
  bgColor: string;
  category: 'Active' | 'Completed' | 'Cancelled' | 'Missed';
  isRead?: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All');

  useEffect(() => {
    async function loadNotifications() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const appointments = await getUserAppointments(user.id);
        const list: AppNotification[] = [];

        // Generate dynamic notifications strictly from real appointments
        appointments.forEach((app: Appointment) => {
          const formattedDate = app.date;
          
          if (app.status === 'Confirmed' || app.status === 'Waiting' || app.status === 'In Consultation') {
            list.push({
              id: `${app.id}-confirmed`,
              title: app.status === 'In Consultation' ? 'In Consultation' : (app.status === 'Waiting' ? 'Checked-In at Clinic' : 'Appointment Confirmed'),
              description: `Session with ${app.doctorName} on ${formattedDate} at ${app.time}. Token #${app.tokenNumber || 1}. Check-in OTP: ${app.visit_otp || ''}. Tap to track live OPD counter.`,
              time: 'Active',
              type: 'success',
              icon: CheckCircle2,
              iconColor: 'text-emerald-500',
              bgColor: 'bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 border-emerald-100/50',
              category: 'Active',
              isRead: false
            });
          } else if (app.status === 'Completed') {
            list.push({
              id: `${app.id}-completed`,
              title: "Visit Completed",
              description: `Consultation with ${app.doctorName} on ${formattedDate} is completed. Tap to view your prescription slip and advice.`,
              time: "Completed",
              type: "info",
              icon: CheckCircle2,
              iconColor: "text-blue-500",
              bgColor: "bg-gradient-to-br from-blue-50/50 to-blue-100/20 border-blue-100/30",
              category: 'Completed',
              isRead: true
            });
          } else if (app.status === 'Cancelled') {
            list.push({
              id: `${app.id}-cancelled`,
              title: "Booking Cancelled",
              description: `Appointment with ${app.doctorName} scheduled on ${formattedDate} was cancelled.`,
              time: "Cancelled",
              type: "error",
              icon: AlertCircle,
              iconColor: "text-red-500",
              bgColor: "bg-gradient-to-br from-red-50/60 to-red-100/20 border-red-100/40",
              category: 'Cancelled',
              isRead: true
            });
          } else if (app.status === 'Missed') {
            list.push({
              id: `${app.id}-missed`,
              title: "Appointment Missed",
              description: `You missed your scheduled consultation with ${app.doctorName} on ${formattedDate}.`,
              time: "Missed",
              type: "warning",
              icon: Clock,
              iconColor: "text-amber-500",
              bgColor: "bg-gradient-to-br from-amber-50/60 to-amber-100/20 border-amber-100/40",
              category: 'Cancelled',
              isRead: true
            });
          }
        });

        setNotifications(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [user?.id]);

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    const appId = notification.id.split('-')[0];

    if (notification.time === 'Active') {
      router.push(`/queue/${appId}`);
    } else if (notification.time === 'Completed') {
      router.push(`/prescription/${appId}`);
    } else {
      router.push('/appointments');
    }
  };

  const filteredNotifications = notifications.filter(n => activeTab === 'All' || n.category === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16 md:pl-64">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-6 py-5 border-b border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-2xl hover:bg-slate-100 h-11 w-11 flex items-center justify-center border border-slate-100"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5 text-slate-800" />
            </Button>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                Notifications
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live OPD & Booking Alerts</p>
            </div>
          </div>
          
          {notifications.length > 0 && (
            <button 
              onClick={clearAll}
              className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </header>

        {/* Real-time Tabs */}
        <div className="bg-white px-6 pb-4 pt-3 border-b border-slate-100 shadow-sm sticky top-[81px] z-10">
          <div className="flex space-x-2 overflow-x-auto scroll-hide pb-1">
            {(['All', 'Active', 'Completed', 'Cancelled'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-6 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
              <p className="text-sm font-bold text-slate-400">Syncing live alerts...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="h-20 w-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center shadow-md">
                <BellOff className="h-10 w-10 text-slate-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">No Notifications</h3>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto font-medium leading-relaxed">
                  You are all caught up! Live token calling and OPD queue status alerts will appear here.
                </p>
              </div>
              <Button 
                className="px-6 h-12 bg-primary rounded-xl font-bold text-xs" 
                onClick={() => router.push('/home')}
              >
                Back to Home
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const Icon = notification.icon;
                const appId = notification.id.split('-')[0];
                return (
                  <Card 
                    key={notification.id} 
                    onClick={() => handleNotificationClick(notification)}
                    className={`border-none rounded-[2rem] transition-all hover:shadow-md overflow-hidden relative cursor-pointer group ${
                      notification.isRead ? 'bg-white shadow-sm opacity-90' : 'bg-white shadow-md ring-2 ring-blue-500/10'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2 ${
                      notification.type === 'success' ? 'bg-emerald-500' :
                      notification.type === 'warning' ? 'bg-amber-500' :
                      notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    
                    <CardContent className="p-6 flex items-start space-x-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        notification.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        notification.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        notification.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-900 tracking-tight truncate">
                            {notification.title}
                          </h4>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            notification.time === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                            notification.time === 'Completed' ? 'bg-blue-100 text-blue-700' :
                            notification.time === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            notification.time === 'Missed' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {notification.time}
                          </span>
                        </div>
                        
                        <p className={`text-xs leading-relaxed pt-1.5 pr-2 ${notification.isRead ? 'text-slate-500 font-medium' : 'text-slate-700 font-bold'}`}>
                          {notification.description}
                        </p>

                        {/* Direct Actionable Button */}
                        {notification.time === 'Active' && (
                          <div className="mt-3.5 flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/queue/${appId}`);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-xl shadow-md shadow-blue-600/20 text-xs"
                            >
                              Track Live Queue Counter
                            </Button>
                          </div>
                        )}

                        {notification.time === 'Completed' && (
                          <div className="mt-3.5 flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/prescription/${appId}`);
                              }}
                              className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold h-9 px-4 rounded-xl text-xs"
                            >
                              View Prescription
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
