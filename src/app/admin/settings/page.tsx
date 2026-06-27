'use client';

import { Activity, Clock, ShieldCheck, Database, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const MOCK_LOGS = [
  { action: "Admin approved Dr. Ramesh Mishra", user: "Admin Team", time: "10 mins ago", type: "Approval" },
  { action: "SaaS limits updated for Dr. Priya Patel", user: "Admin Team", time: "45 mins ago", type: "Billing" },
  { action: "Patient account DOC-USR-77382 suspended", user: "System Auto-Flag", time: "2 hours ago", type: "Security" },
  { action: "Database backup completed successfully", user: "System", time: "5 hours ago", type: "Database" },
  { action: "New sub-admin added: Manager Rohit", user: "Super Admin", time: "1 day ago", type: "Access" },
];

export default function AuditLogs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Platform Audit Logs</h1>
        <p className="text-slate-500 font-medium">Tracking system changes and administrative actions.</p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
                <Activity className="h-5 w-5 mr-3 text-blue-500" /> Recent System Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {MOCK_LOGS.map((log, idx) => (
                  <div key={idx} className="p-8 hover:bg-slate-50/50 transition-colors flex items-start justify-between">
                    <div className="flex space-x-6">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 mb-1">{log.action}</p>
                        <div className="flex items-center space-x-4 text-xs font-bold text-slate-400">
                          <span>By: {log.user}</span>
                          <span className="h-1 w-1 bg-slate-200 rounded-full" />
                          <span>{log.time}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-bold text-[9px] uppercase tracking-widest">
                      {log.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <CardTitle className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <Server className="h-5 w-5 mr-3 text-purple-500" /> System Status
            </CardTitle>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">API Server</span>
                <span className="flex items-center text-xs font-bold text-green-500"><div className="h-2 w-2 bg-green-500 rounded-full mr-2" /> Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Database</span>
                <span className="flex items-center text-xs font-bold text-green-500"><div className="h-2 w-2 bg-green-500 rounded-full mr-2" /> Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Redis Cache</span>
                <span className="flex items-center text-xs font-bold text-green-500"><div className="h-2 w-2 bg-green-500 rounded-full mr-2" /> Active</span>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Version Control</p>
                <p className="text-xs font-bold text-slate-600">v2.4.1-stable (build 902)</p>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 p-8 text-white relative overflow-hidden">
            <ShieldCheck className="absolute top-0 right-0 h-32 w-32 text-white/5 -mr-8 -mt-8" />
            <CardTitle className="text-lg font-bold mb-4 flex items-center">
              Security Gate
            </CardTitle>
            <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">
              All administrative actions are encrypted and logged for security auditing. 2FA is active for all super-admin roles.
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold">
              Backup Now
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
