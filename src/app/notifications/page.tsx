'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Bell, BellOff, Calendar, AlertCircle, Info, CheckCircle2, Clock, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { getUserAppointments } from '@/app/actions/appointment-actions';
import { Appointment } from '@/lib/types';

interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
  icon: any;
  iconColor: string;
  bgColor: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const appointments = await getUserAppointments(user.id);
        const list: AppNotification[] = [];

        // 1. Add static welcome notification
        list.push({
          id: 'welcome',
          title: "Welcome to Doctivo!",
          description: "Thank you for joining our platform. Book, manage, and track your clinic visits easily.",
          time: "Just Now",
          type: "info",
          icon: Info,
          iconColor: "text-blue-500",
          bgColor: "bg-gradient-to-br from-blue-50/70 to-blue-100/30 border-blue-100/50"
        });

        // 2. Generate dynamic notifications from real appointments
        appointments.forEach((app: Appointment) => {
          const formattedDate = app.date;
          
          if (app.status === 'Confirmed') {
            list.push({
              id: `${app.id}-confirmed`,
              title: "Appointment Confirmed",
              description: `Your session with ${app.doctorName} is confirmed for ${formattedDate} at ${app.time}. Token #${app.tokenNumber || 1}. Verification OTP is ${app.visit_otp || ''}.`,
              time: "Active",
              type: "success",
              icon: CheckCircle2,
              iconColor: "text-emerald-500",
              bgColor: "bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 border-emerald-100/50"
            });
          } else if (app.status === 'Completed') {
            list.push({
              id: `${app.id}-completed`,
              title: "Visit Completed",
              description: `Your consultation with ${app.doctorName} on ${formattedDate} has been marked completed. Thank you for visiting!`,
              time: "Completed",
              type: "success",
              icon: CheckCircle2,
              iconColor: "text-green-500",
              bgColor: "bg-gradient-to-br from-green-50/50 to-green-100/20 border-green-100/30"
            });
          } else if (app.status === 'Cancelled') {
            list.push({
              id: `${app.id}-cancelled`,
              title: "Booking Cancelled",
              description: `Your appointment with ${app.doctorName} scheduled on ${formattedDate} was cancelled.`,
              time: "Cancelled",
              type: "error",
              icon: AlertCircle,
              iconColor: "text-red-500",
              bgColor: "bg-gradient-to-br from-red-50/60 to-red-100/20 border-red-100/40"
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
              bgColor: "bg-gradient-to-br from-amber-50/60 to-amber-100/20 border-amber-100/40"
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
    if (notification.id === 'welcome') {
      router.push('/home');
    } else {
      router.push('/appointments');
    }
  };

  return (
    <div className="mobile-container min-h-screen bg-slate-50 flex flex-col pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-5 border-b border-slate-100 shadow-sm">
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
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
              Inbox
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notifications</p>
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

      {/* Content */}
      <main className="flex-1 p-6 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="text-sm font-bold text-slate-400">Syncing notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <div className="h-20 w-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center shadow-md animate-bounce">
              <BellOff className="h-10 w-10 text-slate-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">All Caught Up!</h3>
              <p className="text-xs text-slate-400 max-w-[260px] mx-auto font-medium leading-relaxed">
                You have no new notifications. We will alert you here when your appointment status changes.
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
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <Card 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`border-none rounded-[2.2rem] transition-all hover:shadow-md shadow-sm overflow-hidden bg-white relative cursor-pointer`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    notification.type === 'success' ? 'bg-emerald-500' :
                    notification.type === 'warning' ? 'bg-amber-500' :
                    notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <CardContent className="p-5 flex items-start space-x-4">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      notification.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                      notification.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                      notification.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none">
                          {notification.title}
                        </h4>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          notification.time === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                          notification.time === 'Completed' ? 'bg-blue-50 text-blue-600' :
                          notification.time === 'Cancelled' ? 'bg-red-50 text-red-600' :
                          notification.time === 'Missed' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed pt-1">
                        {notification.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
