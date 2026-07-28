
'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Loader2, Edit3, Camera, Search, User, Mail, Phone, MapPin, IndianRupee, Clock, Users, ShieldCheck, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addDoctorDirectly, updateDoctor, getDoctorsCatalog, deleteDoctor } from '@/app/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DOCTOR_CATEGORIES } from '@/lib/mock-data';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { cn } from '@/lib/utils';

export default function DoctorCatalog() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [newDoc, setNewDoc] = useState<any>({ 
    name: '', 
    email: '', 
    phone: '', 
    specialty: 'General', 
    qualification: '',
    experience: '',
    address: '',
    fees: '500', 
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: '15',
    allowed_free_attendants: '1',
    total_purchased_slots: '0',
    allow_revenue_deduction: false,
    current_active_campaign: '',
    imageUrl: '',
    consultation_modes: 'Clinic,Home',
    reasons_for_visit_str: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getDoctorsCatalog();
      setDoctors(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filteredDoctors = doctors.filter(d => 
    d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.doctor_id && d.doctor_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleImageSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => { setImageToCrop(reader.result as string); setIsCropping(true); };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      const canvas = document.createElement('canvas');
      const img = new (window as any).Image();
      img.src = imageToCrop;
      await new Promise(r => img.onload = r);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = croppedAreaPixels.width; canvas.height = croppedAreaPixels.height;
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      const b64 = canvas.toDataURL('image/jpeg');
      if (editingDoc) setEditingDoc({ ...editingDoc, image_url: b64 });
      else setNewDoc({ ...newDoc, imageUrl: b64 });
      setIsCropping(false); setImageToCrop(null);
    } catch (e) {}
  };

  const handleAdd = async () => {
    if (!newDoc.name || !newDoc.phone) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name and Phone are mandatory.' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...newDoc,
        reasons_for_visit: (newDoc.reasons_for_visit_str || '').split(',').map((s: string) => s.trim()).filter(Boolean)
      };
      const res = await addDoctorDirectly(payload);
      if (res.success) { 
        toast({ title: 'Success', description: 'Doctor added successfully.' });
        setIsAddOpen(false); 
        load(); 
      } else {
        toast({ variant: 'destructive', title: 'Onboarding Failed', description: res.error || 'Could not onboard doctor.' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'An unexpected error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };
 
  const handleUpdate = async () => {
    if (!editingDoc) return;
    setIsSaving(true);
    try {
      const payload = {
        ...editingDoc,
        reasons_for_visit: (editingDoc.reasons_for_visit_str || '').split(',').map((s: string) => s.trim()).filter(Boolean)
      };
      const res = await updateDoctor(editingDoc.doctor_id, payload);
      if (res.success) {
        toast({ title: 'Success', description: 'Doctor profile updated.' });
        setIsEditOpen(false);
        load();
      } else {
        toast({ variant: 'destructive', title: 'Update Failed', description: res.error || 'Could not update doctor.' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'An unexpected error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      const res = await deleteDoctor(id);
      if (res.success) {
        toast({ title: 'Deleted', description: 'Doctor removed successfully' });
        load();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to delete doctor' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'An unexpected error occurred.' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Doctor Catalog</h1>
          <p className="text-slate-500 font-medium">Manage professional profiles and clinic availability.</p>
        </div>
        <div className="flex space-x-4">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 rounded-2xl bg-slate-900 font-bold text-sm shadow-xl shadow-slate-900/10">
                <Plus className="mr-2 h-5 w-5" /> Onboard New Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
               <DialogHeader className="p-8 bg-slate-50 border-b">
                 <DialogTitle className="text-2xl font-black text-slate-800">New Doctor Onboarding</DialogTitle>
                 <p className="text-slate-400 font-medium text-sm">Fill in the professional details to create a new profile.</p>
               </DialogHeader>
               <ScrollArea className="max-h-[65vh]">
                 <div className="p-8 space-y-8">
                  <div className="flex flex-col items-center">
                    <div onClick={() => fileInputRef.current?.click()} className="h-32 w-32 rounded-[2rem] bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group hover:border-blue-400 transition-all">
                      {newDoc.imageUrl ? <Image priority src={newDoc.imageUrl} alt="P" fill className="object-cover" /> : <Camera className="h-8 w-8 text-slate-300 group-hover:text-blue-500 transition-colors" />}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Upload Profile Photo</p>
                  </div>
                   <div className="grid grid-cols-2 gap-6 pt-4">
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Full Name *</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Specialty *</Label>
                       <Select value={newDoc.specialty} onValueChange={v => setNewDoc({...newDoc, specialty: v})}>
                         <SelectTrigger className="h-12 bg-slate-50 border-none font-bold rounded-xl">
                           <SelectValue placeholder="Select Specialty" />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl border-none shadow-2xl">
                           {DOCTOR_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                             <SelectItem key={cat.id} value={cat.name} className="font-bold py-2.5">{cat.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Phone Number *</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={newDoc.phone} onChange={e => setNewDoc({...newDoc, phone: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Email Address</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={newDoc.email} onChange={e => setNewDoc({...newDoc, email: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Qualification</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" placeholder="MBBS, MD" value={newDoc.qualification} onChange={e => setNewDoc({...newDoc, qualification: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Experience (Years)</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={newDoc.experience} onChange={e => setNewDoc({...newDoc, experience: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Consultation Fee (₹)</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={newDoc.fees} onChange={e => setNewDoc({...newDoc, fees: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Slot Duration (Mins)</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={newDoc.slotDuration} onChange={e => setNewDoc({...newDoc, slotDuration: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Start Time (24h)</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" placeholder="09:00" value={newDoc.startTime} onChange={e => setNewDoc({...newDoc, startTime: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">End Time (24h)</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" placeholder="17:00" value={newDoc.endTime} onChange={e => setNewDoc({...newDoc, endTime: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Free Attendant Slots</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={newDoc.allowed_free_attendants} onChange={e => setNewDoc({...newDoc, allowed_free_attendants: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Purchased Slots</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={newDoc.total_purchased_slots} onChange={e => setNewDoc({...newDoc, total_purchased_slots: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Allow Revenue Deduction</Label>
                       <Select value={String(newDoc.allow_revenue_deduction)} onValueChange={v => setNewDoc({...newDoc, allow_revenue_deduction: v === 'true'})}>
                         <SelectTrigger className="h-12 bg-slate-50 border-none font-bold rounded-xl">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl">
                           <SelectItem value="true" className="font-bold py-2">Yes</SelectItem>
                           <SelectItem value="false" className="font-bold py-2">No</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Active Campaign</Label>
                        <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" placeholder="None" value={newDoc.current_active_campaign} onChange={e => setNewDoc({...newDoc, current_active_campaign: e.target.value})} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Reasons for Visit (Comma separated)</Label>
                        <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" placeholder="e.g. Back Pain, Neck Pain, Post Surgery" value={newDoc.reasons_for_visit_str} onChange={e => setNewDoc({...newDoc, reasons_for_visit_str: e.target.value})} />
                      </div>
                      {newDoc.specialty === 'Physiotherapist' && (
                        <div className="col-span-2 p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Consultation Modes</Label>
                          <div className="flex gap-8">
                            <div className="flex items-center space-x-3">
                              <Checkbox 
                                id="mode-clinic" 
                                checked={(newDoc.consultation_modes || '').includes('Clinic')} 
                                onCheckedChange={(checked) => {
                                  const modes = (newDoc.consultation_modes || '').split(',').filter(Boolean);
                                  if (checked) { if (!modes.includes('Clinic')) modes.push('Clinic'); }
                                  else { const idx = modes.indexOf('Clinic'); if (idx > -1) modes.splice(idx, 1); }
                                  setNewDoc({...newDoc, consultation_modes: modes.join(',')});
                                }}
                              />
                              <Label htmlFor="mode-clinic" className="text-sm font-bold text-slate-700 cursor-pointer">Therapy at Clinic</Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Checkbox 
                                id="mode-home" 
                                checked={(newDoc.consultation_modes || '').includes('Home')} 
                                onCheckedChange={(checked) => {
                                  const modes = (newDoc.consultation_modes || '').split(',').filter(Boolean);
                                  if (checked) { if (!modes.includes('Home')) modes.push('Home'); }
                                  else { const idx = modes.indexOf('Home'); if (idx > -1) modes.splice(idx, 1); }
                                  setNewDoc({...newDoc, consultation_modes: modes.join(',')});
                                }}
                              />
                              <Label htmlFor="mode-home" className="text-sm font-bold text-slate-700 cursor-pointer">Therapy at Home</Label>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Clinic Address</Label>
                        <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={newDoc.address} onChange={e => setNewDoc({...newDoc, address: e.target.value})} />
                      </div>
                    </div>
                 </div>
               </ScrollArea>
               <DialogFooter className="p-8 bg-slate-50 border-t">
                 <Button onClick={handleAdd} disabled={isSaving} className="w-full h-16 rounded-2xl bg-blue-600 font-black text-lg shadow-xl shadow-blue-600/20">
                   {isSaving ? <Loader2 className="animate-spin" /> : 'Confirm Onboarding'}
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
            <Input 
              placeholder="Search by name, ID or specialty..." 
              className="pl-12 h-14 bg-slate-50 border-none rounded-2xl font-bold"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor Profile</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Specialty</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20 font-black text-slate-300 uppercase text-xs">Syncing Profiles...</td></tr>
              ) : filteredDoctors.length > 0 ? filteredDoctors.map((doc) => (
                <tr 
                  key={doc.doctor_id} 
                  className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                >
                  <td onClick={() => { setEditingDoc({...doc, reasons_for_visit_str: Array.isArray(doc.reasons_for_visit) ? doc.reasons_for_visit.join(', ') : ''}); setIsEditOpen(true); }} className="px-10 py-8">
                    <div className="flex items-center space-x-5">
                      <div className="h-16 w-16 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200 flex items-center justify-center">
                        {doc.image_url ? <Image priority src={doc.image_url} alt="D" fill className="object-cover" /> : <User className="h-8 w-8 text-slate-300" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{doc.full_name}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">ID: {doc.doctor_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
                      {doc.specialty}
                    </Badge>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-600 flex items-center"><Phone className="h-3 w-3 mr-2 text-slate-400" /> {doc.phone_number}</p>
                      <p className="text-xs font-medium text-slate-400 flex items-center"><Mail className="h-3 w-3 mr-2 text-slate-400" /> {doc.email || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      onClick={(e) => { e.stopPropagation(); setEditingDoc({...doc, reasons_for_visit_str: Array.isArray(doc.reasons_for_visit) ? doc.reasons_for_visit.join(', ') : ''}); setIsEditOpen(true); }}
                      className="h-12 w-12 rounded-2xl text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all"
                    >
                      <Edit3 className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={(e) => { e.stopPropagation(); handleDeleteDoctor(doc.doctor_id); }}
                      className="h-12 w-12 rounded-2xl text-slate-300 group-hover:text-red-500 group-hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center py-24">
                    <div className="flex flex-col items-center space-y-4 opacity-30">
                      <Search className="h-16 w-16 text-slate-400" />
                      <p className="font-black text-slate-400 uppercase text-sm">No doctors found in catalog</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Edit/View Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <DialogHeader className="p-8 bg-slate-50 border-b">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-black text-slate-800">Doctor Profile Detail</DialogTitle>
                <p className="text-slate-400 font-medium text-sm">Review and manage professional information.</p>
              </div>
              <Badge className="bg-green-100 text-green-600 border-none font-black text-[10px] uppercase tracking-widest">Active Approved</Badge>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {editingDoc && (
              <div className="p-8 space-y-10">
                {/* Photo & Basic Info */}
                <div className="flex items-center space-x-8">
                  <div onClick={() => fileInputRef.current?.click()} className="h-32 w-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group hover:border-blue-400 transition-all shrink-0">
                    {editingDoc.image_url ? <Image priority src={editingDoc.image_url} alt="P" fill className="object-cover" /> : <Camera className="h-8 w-8 text-slate-300" />}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                        <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.full_name} onChange={e => setEditingDoc({...editingDoc, full_name: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Specialty</Label>
                        <Select value={editingDoc.specialty} onValueChange={v => setEditingDoc({...editingDoc, specialty: v})}>
                          <SelectTrigger className="h-12 bg-slate-50 border-none font-bold rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {DOCTOR_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                              <SelectItem key={cat.id} value={cat.name} className="font-bold py-2">{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Contact Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl pl-12" value={editingDoc.phone_number || ''} onChange={e => setEditingDoc({...editingDoc, phone_number: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl pl-12" value={editingDoc.email || ''} onChange={e => setEditingDoc({...editingDoc, email: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Qualification</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.qualification || ''} onChange={e => setEditingDoc({...editingDoc, qualification: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Experience (Years)</Label>
                    <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.experience_years || 0} onChange={e => setEditingDoc({...editingDoc, experience_years: parseInt(e.target.value || '0')})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Consultation Fee (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl pl-12" value={editingDoc.consultation_fee || 500} onChange={e => setEditingDoc({...editingDoc, consultation_fee: parseInt(e.target.value || '500')})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Slot Duration (Mins)</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl pl-12" value={editingDoc.slot_duration || 15} onChange={e => setEditingDoc({...editingDoc, slot_duration: parseInt(e.target.value || '15')})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Start Time</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.start_time || '09:00'} onChange={e => setEditingDoc({...editingDoc, start_time: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">End Time</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.end_time || '17:00'} onChange={e => setEditingDoc({...editingDoc, end_time: e.target.value})} />
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-6">
                   <div className="flex items-center space-x-2">
                     <ShieldCheck className="h-5 w-5 text-blue-500" />
                     <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">SaaS & Staffing Limits</h3>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Free Attendant Slots</Label>
                      <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.allowed_free_attendants || 1} onChange={e => setEditingDoc({...editingDoc, allowed_free_attendants: parseInt(e.target.value || '1')})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Purchased Slots</Label>
                      <Input type="number" className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.total_purchased_slots || 0} onChange={e => setEditingDoc({...editingDoc, total_purchased_slots: parseInt(e.target.value || '0')})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Revenue Deduction</Label>
                      <Select value={String(!!editingDoc.allow_revenue_deduction)} onValueChange={v => setEditingDoc({...editingDoc, allow_revenue_deduction: v === 'true'})}>
                        <SelectTrigger className="h-12 bg-slate-50 border-none font-bold rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl"><SelectItem value="true">Active</SelectItem><SelectItem value="false">Disabled</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Active Campaign</Label>
                      <Input className="h-12 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.current_active_campaign || ''} onChange={e => setEditingDoc({...editingDoc, current_active_campaign: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-red-400" />
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Clinic Details</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Reasons for Visit (Comma separated)</Label>
                      <Input className="h-14 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.reasons_for_visit_str || ''} onChange={e => setEditingDoc({...editingDoc, reasons_for_visit_str: e.target.value})} />
                    </div>
                    {editingDoc.specialty === 'Physiotherapist' && (
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Consultation Availability Modes</Label>
                      <div className="flex gap-8">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id="edit-mode-clinic" 
                            checked={(editingDoc.consultation_modes || '').includes('Clinic')} 
                            onCheckedChange={(checked) => {
                              const modes = (editingDoc.consultation_modes || '').split(',').filter(Boolean);
                              if (checked) { if (!modes.includes('Clinic')) modes.push('Clinic'); }
                              else { const idx = modes.indexOf('Clinic'); if (idx > -1) modes.splice(idx, 1); }
                              setEditingDoc({...editingDoc, consultation_modes: modes.join(',')});
                            }}
                          />
                          <Label htmlFor="edit-mode-clinic" className="text-sm font-bold text-slate-700 cursor-pointer">Therapy at Clinic</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id="edit-mode-home" 
                            checked={(editingDoc.consultation_modes || '').includes('Home')} 
                            onCheckedChange={(checked) => {
                              const modes = (editingDoc.consultation_modes || '').split(',').filter(Boolean);
                              if (checked) { if (!modes.includes('Home')) modes.push('Home'); }
                              else { const idx = modes.indexOf('Home'); if (idx > -1) modes.splice(idx, 1); }
                              setEditingDoc({...editingDoc, consultation_modes: modes.join(',')});
                            }}
                          />
                          <Label htmlFor="edit-mode-home" className="text-sm font-bold text-slate-700 cursor-pointer">Therapy at Home</Label>
                        </div>
                      </div>
                    </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Detailed Clinic Address</Label>
                      <Input className="h-14 bg-slate-50 border-none font-bold rounded-xl" value={editingDoc.clinic_address || ''} onChange={e => setEditingDoc({...editingDoc, clinic_address: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button onClick={handleUpdate} disabled={isSaving} className="w-full h-18 bg-blue-600 font-black text-xl rounded-2xl shadow-xl shadow-blue-600/20">
              {isSaving ? <Loader2 className="animate-spin" /> : 'Save Profile Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="max-w-[90vw] h-[500px] flex flex-col rounded-[2.5rem] p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-white"><DialogTitle>Crop Doctor Photo</DialogTitle></DialogHeader>
          <div className="relative flex-1 bg-slate-900"><Cropper image={imageToCrop || ''} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={(_, cap) => setCroppedAreaPixels(cap)} onZoomChange={setZoom} /></div>
          <div className="p-6 bg-white"><Button onClick={getCroppedImg} className="w-full h-14 bg-blue-600 rounded-2xl font-bold">Confirm Crop</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

