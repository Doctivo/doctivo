
'use client';

import { useState } from 'react';
import { 
  Download, 
  Calendar, 
  Database, 
  FileText, 
  CheckCircle2, 
  User, 
  Wallet, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getAdminBookings, getDoctorsCatalog } from '@/app/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function BulkExporter() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['bookings']);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleTypeToggle = (id: string) => {
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const downloadCSV = (filename: string, data: any[]) => {
    if (data.length === 0) {
      toast({ title: 'No Data', description: 'No records found for the selected range.', variant: 'destructive' });
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    ).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedTypes.includes('bookings')) {
        const data = await getAdminBookings();
        const filtered = startDate || endDate ? data.filter((b: any) => {
          const bDate = new Date(b.appointment_date);
          const s = startDate ? new Date(startDate) : new Date(0);
          const e = endDate ? new Date(endDate) : new Date();
          return bDate >= s && bDate <= e;
        }) : data;
        downloadCSV(`bookings_export_${Date.now()}.csv`, filtered);
      }
      
      if (selectedTypes.includes('doctors')) {
        const data = await getDoctorsCatalog();
        downloadCSV(`doctors_export_${Date.now()}.csv`, data);
      }

      toast({ title: 'Export Complete', description: 'Selected data files have been downloaded.' });
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate CSV files.' });
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bulk Data Exporter</h1>
        <p className="text-slate-500 font-medium">Download platform data for audit and reporting.</p>
      </div>

      <div className="max-w-2xl">
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-2xl font-black flex items-center">
              <Database className="mr-3 h-7 w-7 text-blue-500" /> Export Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="pl-11 h-14 rounded-2xl bg-slate-50 border-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="pl-11 h-14 rounded-2xl bg-slate-50 border-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Select Data Categories</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'bookings', label: 'Appointments Data', icon: FileText },
                  { id: 'doctors', label: 'Doctor Catalog', icon: User },
                  { id: 'payroll', label: 'Payroll Adjustments', icon: Wallet },
                  { id: 'patients', label: 'User Directory', icon: User },
                ].map((type) => (
                  <div 
                    key={type.id}
                    onClick={() => handleTypeToggle(type.id)}
                    className={cn(
                      "flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all",
                      selectedTypes.includes(type.id) ? "border-blue-500 bg-blue-50/50" : "border-slate-50 bg-slate-50/30 hover:border-slate-100"
                    )}
                  >
                    <Checkbox checked={selectedTypes.includes(type.id)} className="mr-4 h-5 w-5 border-slate-200" />
                    <div className="flex items-center space-x-3">
                      <type.icon className={cn("h-5 w-5", selectedTypes.includes(type.id) ? "text-blue-500" : "text-slate-400")} />
                      <span className={cn("font-bold text-sm", selectedTypes.includes(type.id) ? "text-blue-900" : "text-slate-600")}>{type.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <Button 
                onClick={handleExport} 
                disabled={isExporting || selectedTypes.length === 0}
                className="w-full h-16 bg-blue-600 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
              >
                {isExporting ? <Loader2 className="animate-spin h-6 w-6" /> : <><Download className="h-6 w-6" /> Download Data Bundle (.CSV)</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

