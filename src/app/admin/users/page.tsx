'use client';

import { useEffect, useState } from 'react';
import { 
  Users, Search, ShieldAlert, Phone, 
  MapPin, Filter, MoreVertical, Trash2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAllUsers } from '@/app/actions/admin-actions';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function UserDirectory() {
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState<'Patient' | 'Doctor' | 'Attendant'>('Patient');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getAllUsers(role);
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [role]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">System User Directory</h1>
          <p className="text-slate-500 font-medium">Audit and manage all platform accounts.</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-2xl">
          {['Patient', 'Doctor', 'Attendant'].map((r) => (
            <button 
              key={r}
              onClick={() => setRole(r as any)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${role === r ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              {r}s
            </button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input placeholder={`Search ${role}s...`} className="pl-11 h-12 bg-slate-50 border-none rounded-xl" />
          </div>
        </div>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User Profile</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Info</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 font-bold text-slate-300">Auditing profiles...</td></tr>
              ) : users.length > 0 ? users.map((u, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                        {(u.full_name || u.name)?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{u.full_name || u.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {role === 'Patient' ? `Age: ${u.age}` : role === 'Doctor' ? u.specialty : `ID: ${u.attendant_id?.slice(-6)}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center text-xs font-bold text-slate-500">
                      <Phone className="h-3 w-3 mr-2 text-slate-300" /> {u.phone_number || u.mobile || u.phone}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <MapPin className="h-3 w-3 mr-2 text-red-400" /> {u.city || u.clinic_address || 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {u.is_deleted ? (
                      <Badge className="bg-red-50 text-red-600 border-none font-bold text-[9px] uppercase tracking-widest px-2">Deleted User</Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-600 border-none font-bold text-[9px] uppercase tracking-widest px-2">Active</Badge>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl">
                        <DropdownMenuItem className="p-3 text-xs font-bold text-slate-600 focus:bg-slate-50 cursor-pointer">View Activity</DropdownMenuItem>
                        <DropdownMenuItem className="p-3 text-xs font-bold text-red-500 focus:bg-red-50 cursor-pointer flex items-center">
                          <ShieldAlert className="h-4 w-4 mr-2" /> Ban User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-20 font-bold text-slate-300">No {role}s found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

