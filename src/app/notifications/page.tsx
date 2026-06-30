'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, BellOff, Calendar, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotificationsPage() {
  const router = useRouter();

  // Mock notifications list
  const notifications = [
    {
      id: 1,
      title: "Appointment Confirmed",
      description: "Your appointment with Dr. Prince Yadav has been scheduled for tomorrow at 10:00 AM.",
      time: "2 hours ago",
      type: "success",
      icon: CheckCircle2,
      iconColor: "text-green-500",
      bgColor: "bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30"
    },
    {
      id: 2,
      title: "Queue Status Update",
      description: "Dr. Prince Yadav is currently attending token #4. Estimated wait time is 15 minutes.",
      time: "1 day ago",
      type: "info",
      icon: Info,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
    },
    {
      id: 3,
      title: "Profile Verified Successfully",
      description: "Welcome to Doctivo! Your profile and height/weight entries have been verified.",
      time: "2 days ago",
      type: "success",
      icon: CheckCircle2,
      iconColor: "text-green-500",
      bgColor: "bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30"
    },
    {
      id: 4,
      title: "Health Reminder",
      description: "Make sure to update your medical history and allergies for more accurate consultations.",
      time: "3 days ago",
      type: "warning",
      icon: AlertCircle,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900/30"
    }
  ];

  return (
    <div className="mobile-container min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          </Button>
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Notifications
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <BellOff className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No New Notifications</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                We'll notify you when you receive new appointment updates or queue alerts.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <Card 
                  key={notification.id} 
                  className={`border rounded-2xl transition-all hover:shadow-md ${notification.bgColor}`}
                >
                  <CardContent className="p-4 flex items-start space-x-4">
                    <div className="mt-0.5">
                      <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                          {notification.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal pt-1">
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
