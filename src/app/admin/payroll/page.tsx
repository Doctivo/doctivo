
'use client';

import { useEffect, useState } from 'react';
import { Wallet, Plus, Minus, CreditCard, History, User, MoreVertical, Loader2, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getEmployeePayroll, adjustPayroll, settlePayroll, getPayrollLogs } from '@/app/actions/admin-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function PayrollConsole() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<{type: 'Advance' | 'Bonus' | 'Penalty', employee: any} | null>(null);
  const [adjData, setAdjData] = useState({ amount: '', reason: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const [empData, logData] = await Promise.all([getEmployeePayroll(), getPayrollLogs()]);
    setEmployees(empData);
    setLogs(logData);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const handleAdjust = async () => {
    if (!activeModal || !adjData.amount) return;
    setIsProcessing(true);
    const res = await adjustPayroll({
      employeeId: activeModal.employee.attendant_id,
      employeeName: activeModal.employee.full_name,
      type: activeModal.type,
      amount: parseInt(adjData.amount),
      reason: adjData.reason
    });
    if (res.success) {
      toast({ title: 'Record Added', description: `${activeModal.type} recorded for ${activeModal.employee.full_name}` });
      setActiveModal(null);
      setAdjData({ amount: '', reason: '' });
      load();
    }
    setIsProcessing(false);
  };

  const handleSettle = async (empId: string) => {
    if (!confirm('Settle all pending adjustments for this employee?')) return;
    const res = await settlePayroll(empId);
    if (res.success) {
      toast({ title: 'Payroll Settled', description: 'Net balance reset for the next cycle.' });
      load();
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

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Payroll & Adjustments</h1>
        <p className="text-slate-500 font-medium">Manage staff salaries, advances and settlements.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black flex items-center">
              <User className="mr-3 h-6 w-6 text-blue-500" /> Employee Directory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Base Salary</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Adjustments</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Net Balance</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp) => (
                  <tr key={String(emp.attendant_id)} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-800">{String(emp.full_name)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Attendant</p>
                    </td>
                    <td className="px-8 py-6 text-center font-bold text-slate-700">₹{String(emp.base_salary)}</td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center space-x-2">
                        <Badge className="bg-orange-50 text-orange-600 border-none text-[9px]">-₹{String(emp.total_advances)}</Badge>
                        <Badge className="bg-green-50 text-green-600 border-none text-[9px]">+₹{String(emp.total_bonuses)}</Badge>
                        <Badge className="bg-red-50 text-red-600 border-none text-[9px]">-₹{String(emp.total_penalties)}</Badge>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-lg font-black text-blue-600">₹{String(emp.net_balance)}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button onClick={() => setActiveModal({type: 'Advance', employee: emp})} variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase border-orange-100 text-orange-600">Advance</Button>
                        <Button onClick={() => setActiveModal({type: 'Bonus', employee: emp})} variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase border-green-100 text-green-600">Bonus</Button>
                        <Button onClick={() => setActiveModal({type: 'Penalty', employee: emp})} variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase border-red-100 text-red-600">Penalty</Button>
                        <Button onClick={() => handleSettle(emp.attendant_id)} size="sm" className="h-8 text-[9px] font-black uppercase bg-slate-900 text-white">Settle</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xl font-black flex items-center">
              <History className="mr-3 h-6 w-6 text-purple-500" /> Payroll Adjustment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {logs.map((log) => (
                <div key={String(log.adjustment_id)} className="p-6 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      log.type === 'Bonus' ? "bg-green-50 text-green-500" : log.type === 'Penalty' ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
                    )}>
                      {log.type === 'Bonus' ? <ArrowUpRight /> : <ArrowDownRight />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{String(log.employee_name)} <span className="font-medium text-slate-400">received a</span> {String(log.type)}</p>
                      <p className="text-xs text-slate-400">{String(log.reason || 'No reason provided')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800">₹{String(log.amount)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{safeFormatDate(log.processed_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustment Modal */}
      {activeModal && (
        <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
          <DialogContent className="max-w-md rounded-[2.5rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Record {activeModal.type}</DialogTitle>
              <p className="text-sm text-slate-400 font-medium">Applying adjustment for {activeModal.employee.full_name}</p>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Amount (INR)</Label>
                <Input type="number" value={adjData.amount} onChange={e => setAdjData({...adjData, amount: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Reason / Note</Label>
                <Textarea value={adjData.reason} onChange={e => setAdjData({...adjData, reason: e.target.value})} className="rounded-xl bg-slate-50 border-none min-h-[100px]" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdjust} disabled={isProcessing} className="w-full h-14 bg-blue-600 rounded-2xl font-bold shadow-lg shadow-blue-600/20">
                {isProcessing ? <Loader2 className="animate-spin" /> : `Record ${activeModal.type}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

