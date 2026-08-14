'use client';

import { useEffect, useState } from 'react';
import { 
  CreditCard, Search, Edit3, ShieldCheck, 
  Calendar, RefreshCcw, Save, Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  getDoctorsByStatus, 
  updateDoctorBilling 
} from '@/app/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function BillingConfig() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const data = await getDoctorsByStatus('approved');
    setDoctors(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = async () => {
    if (!editingDoc) return;
    setIsSaving(true);
    const res = await updateDoctorBilling(editingDoc.doctor_id, editingDoc);
    if (res.success) {
      toast({ title: 'Success', description: 'Billing config updated.' });
      setEditingDoc(null);
      load();
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">SaaS & Staff Billing</h1>
        <p className="text-slate-500 font-medium">Configure clinic limits and subscription automation.</p>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input placeholder="Find doctor for configuration..." className="pl-11 h-12 bg-slate-50 border-none rounded-xl" />
          </div>
        </div>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Free Attendants</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Paid Slots</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Auto-Deduct</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 font-bold text-slate-300">Loading configurations...</td></tr>
              ) : doctors.map((doc) => (
                <tr key={doc.doctor_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-slate-800">{doc.full_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Validity: {doc.campaign_validity_end || 'No End Date'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="inline-block h-8 w-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center mx-auto">
                      {doc.allowed_free_attendants || 1}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="inline-block h-8 w-8 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center mx-auto">
                      {doc.total_purchased_slots || 0}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center">
                      <Switch checked={doc.allow_revenue_deduction} disabled className="scale-75" />
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingDoc(doc)}
                      className="rounded-xl border-slate-100 font-bold text-xs hover:bg-slate-50"
                    >
                      <Edit3 className="mr-2 h-4 w-4" /> Configure
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Configuration Modal */}
      {editingDoc && (
        <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
          <DialogContent className="max-w-md rounded-[2.5rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-800">Billing Config</DialogTitle>
              <p className="text-sm text-slate-400 font-medium">Adjusting limits for {editingDoc.full_name}</p>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Free Staff slots</Label>
                  <Input 
                    type="number" 
                    value={editingDoc.allowed_free_attendants} 
                    onChange={e => setEditingDoc({...editingDoc, allowed_free_attendants: parseInt(e.target.value)})}
                    className="h-12 rounded-xl bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Purchased slots</Label>
                  <Input 
                    type="number" 
                    value={editingDoc.total_purchased_slots} 
                    onChange={e => setEditingDoc({...editingDoc, total_purchased_slots: parseInt(e.target.value)})}
                    className="h-12 rounded-xl bg-slate-50 border-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase">Active Campaign / Offer</Label>
                <Input 
                  placeholder="e.g. 30_Days_Free_Offer" 
                  value={editingDoc.current_active_campaign || ''}
                  onChange={e => setEditingDoc({...editingDoc, current_active_campaign: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                <div>
                  <p className="text-xs font-bold text-slate-800">Auto Revenue Deduction</p>
                  <p className="text-[10px] text-slate-400">Deduct monthly fee from revenue</p>
                </div>
                <Switch 
                  checked={editingDoc.allow_revenue_deduction} 
                  onCheckedChange={val => setEditingDoc({...editingDoc, allow_revenue_deduction: val})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleUpdate} 
                disabled={isSaving}
                className="w-full h-14 bg-blue-600 rounded-2xl font-bold shadow-lg shadow-blue-600/20"
              >
                {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

