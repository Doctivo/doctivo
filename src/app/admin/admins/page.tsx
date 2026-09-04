
'use client';

import { useEffect, useState } from 'react';
import { 
  ShieldCheck, UserPlus, Trash2, Search, 
  ShieldAlert, Loader2, Mail, User, 
  Settings2, CheckCircle2, Database 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  getAdminUsers, 
  createAdminUser, 
  deleteAdminUser,
  initializeDatabase
} from '@/actions/admin';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';

const INITIAL_PERMISSIONS = {
  dashboard: { view: true, view_financials: true },
  doctors: { view: true, approve: true, suspend: true },
  bookings: { view: true, modify: true },
  payroll: { view: true, adjust: true, settle: true },
  exporter: { allow_export: true }
};

const ROLE_TEMPLATES = {
  'Super Admin': {
    role: 'Super Admin',
    permissions: INITIAL_PERMISSIONS
  },
  'Operations Executive': {
    role: 'Operations Executive',
    permissions: {
      dashboard: { view: true, view_financials: false },
      doctors: { view: true, approve: true, suspend: false },
      bookings: { view: true, modify: true },
      payroll: { view: false, adjust: false, settle: false },
      exporter: { allow_export: false }
    }
  },
  'Finance Manager': {
    role: 'Finance Manager',
    permissions: {
      dashboard: { view: true, view_financials: true },
      doctors: { view: true, approve: false, suspend: false },
      bookings: { view: true, modify: false },
      payroll: { view: true, adjust: true, settle: true },
      exporter: { allow_export: true }
    }
  },
  'Platform Auditor': {
    role: 'Platform Auditor',
    permissions: {
      dashboard: { view: true, view_financials: true },
      doctors: { view: true, approve: false, suspend: false },
      bookings: { view: true, modify: false },
      payroll: { view: true, adjust: false, settle: false },
      exporter: { allow_export: true }
    }
  },
  'Custom Role': {
    role: 'Custom Role',
    permissions: INITIAL_PERMISSIONS
  }
};

export default function AdminManagement() {
  const currentAdmin = useStore(state => state.admin);
  const hasHydrated = useStore(state => state._hasHydrated);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const { toast } = useToast();

  const [newAdmin, setNewAdmin] = useState({ 
    name: '', 
    email: '', 
    role: 'Operations Executive' 
  });
  const [permissions, setPermissions] = useState(ROLE_TEMPLATES['Operations Executive'].permissions);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setAdmins(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const handleRepairDB = async () => {
    setIsRepairing(true);
    const res = await initializeDatabase();
    if (res.success) {
      toast({ title: 'Success', description: 'Database tables repaired successfully.' });
      load();
    } else {
      toast({ variant: 'destructive', title: 'Repair Failed', description: String(res.error) });
    }
    setIsRepairing(false);
  };

  const handleRoleTemplateChange = (roleName: string) => {
    const template = ROLE_TEMPLATES[roleName as keyof typeof ROLE_TEMPLATES];
    if (template) {
      setNewAdmin({ ...newAdmin, role: roleName });
      setPermissions(template.permissions);
    }
  };

  const togglePermission = (category: string, action: string) => {
    setPermissions(prev => {
      const catKey = category as keyof typeof prev;
      const catObj = prev[catKey] as any;
      return {
        ...prev,
        [category]: {
          ...catObj,
          [action]: !catObj?.[action]
        }
      };
    });
  };

  const handleCreate = async () => {
    if (!newAdmin.name || !newAdmin.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name and Email are required.' });
      return;
    }
    setIsSaving(true);
    const res = await createAdminUser({ ...newAdmin, permissions });
    if (res.success) {
      toast({ title: 'Success', description: 'Sub-Admin created.' });
      setIsAddOpen(false);
      setNewAdmin({ name: '', email: '', role: 'Operations Executive' });
      load();
    } else {
      toast({ variant: 'destructive', title: 'Creation Failed', description: String((res as any).error) });
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (currentAdmin && currentAdmin.admin_id === id) {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'You cannot revoke your own admin account.' });
      return;
    }
    if (!confirm('Revoke administrator access?')) return;
    const res = await deleteAdminUser(id);
    if (res.success) {
      toast({ title: 'Removed', description: 'Admin access revoked.' });
      load();
    } else {
      toast({ variant: 'destructive', title: 'Action Failed', description: String((res as any).error || 'Failed to delete sub-admin.') });
    }
  };

  const safeFormatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    try {
      return new Date(dateVal).toLocaleDateString();
    } catch (e) {
      return String(dateVal);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing credentials...</p>
      </div>
    );
  }

  if (currentAdmin?.role !== 'Super Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShieldAlert className="h-16 w-16 text-red-500" />
        <h2 className="text-xl font-black text-slate-800">Access Denied</h2>
        <p className="text-sm text-slate-400 font-bold max-w-xs text-center leading-relaxed">
          Only the Super Administrator is authorized to view or manage access control parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Access Control</h1>
          <p className="text-slate-500 font-medium">Manage sub-admins and granular permissions.</p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={handleRepairDB} 
            disabled={isRepairing}
            variant="outline" 
            className="h-14 px-6 rounded-2xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
          >
            {isRepairing ? <Loader2 className="animate-spin" /> : <><Database className="mr-2 h-5 w-5" /> Repair DB</>}
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 rounded-2xl bg-slate-900 font-bold text-sm shadow-xl shadow-slate-900/10">
                <UserPlus className="mr-2 h-5 w-5" /> Onboard Sub-Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
              <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                <DialogTitle className="text-2xl font-black text-slate-800">New Administrator</DialogTitle>
                <p className="text-slate-400 font-medium">Define profile and set permission boundaries.</p>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="p-8 space-y-10">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                        <Input 
                          placeholder="Admin Name" 
                          className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                          value={newAdmin.name} 
                          onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Email Address</Label>
                        <Input 
                          type="email" 
                          placeholder="admin@doctivo.com" 
                          className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                          value={newAdmin.email} 
                          onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Select Role Template</Label>
                      <Select value={newAdmin.role} onValueChange={handleRoleTemplateChange}>
                        <SelectTrigger className="h-14 bg-blue-50/50 border-2 border-blue-100 rounded-2xl text-blue-900 font-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {Object.keys(ROLE_TEMPLATES).map(role => (
                            <SelectItem key={role} value={role} className="p-3 font-bold">{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Settings2 className="h-5 w-5 text-slate-800" />
                      <h3 className="text-lg font-black text-slate-800">Permissions Grid</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      {['dashboard', 'doctors', 'bookings', 'payroll'].map((cat) => (
                        <div key={cat} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-400">{cat.charAt(0).toUpperCase() + cat.slice(1)} Access</h4>
                          <div className="flex flex-wrap gap-6">
                            {Object.keys(permissions[cat as keyof typeof permissions]).map(action => (
                              <div key={action} className="flex items-center space-x-3">
                                <Checkbox 
                                  id={`p-${cat}-${action}`} 
                                  checked={(permissions as any)[cat][action]} 
                                  onCheckedChange={() => togglePermission(cat, action)}
                                />
                                <Label htmlFor={`p-${cat}-${action}`} className="text-sm font-bold text-slate-700">
                                  {action.replace('_', ' ').charAt(0).toUpperCase() + action.replace('_', ' ').slice(1)}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
                <Button 
                  onClick={handleCreate} 
                  disabled={isSaving} 
                  className="w-full h-16 rounded-[1.5rem] bg-blue-600 font-black text-lg shadow-xl shadow-blue-600/20"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : 'Create Administrator'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input placeholder="Search administrators..." className="pl-12 h-14 bg-slate-50 border-none rounded-2xl font-bold" />
          </div>
        </div>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Administrator</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Onboarded</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20 font-black text-slate-300 uppercase text-xs">Syncing Roles...</td></tr>
              ) : admins.length > 0 ? admins.map((admin) => (
                <tr key={String(admin.admin_id)} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-8">
                    <p className="font-black text-slate-800 text-lg">{String(admin.full_name)}</p>
                    <p className="text-xs text-slate-400 font-bold">{String(admin.email)}</p>
                  </td>
                  <td className="px-10 py-8">
                    <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
                      {String(admin.role)}
                    </Badge>
                  </td>
                  <td className="px-10 py-8 text-xs text-slate-400 font-bold">
                    {safeFormatDate(admin.created_at)}
                  </td>
                  <td className="px-10 py-8 text-right">
                    {currentAdmin?.admin_id !== admin.admin_id && (
                      <Button onClick={() => handleDelete(admin.admin_id)} variant="ghost" className="text-red-500 hover:bg-red-50 h-12 w-12 p-0 rounded-2xl">
                        <Trash2 className="h-6 w-6" />
                      </Button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center py-24">
                    <div className="flex flex-col items-center space-y-4 opacity-30">
                      <ShieldAlert className="h-16 w-16 text-slate-400" />
                      <p className="font-black text-slate-400 uppercase text-sm">No Sub-Admins Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

