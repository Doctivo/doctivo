
'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Loader2, Edit3, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addDoctorDirectly, updateDoctor, getDoctorsCatalog } from '@/app/actions/admin-actions';
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

export default function DoctorCatalog() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    consultation_modes: 'Clinic,Home'
  });
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getDoctorsCatalog();
    setDoctors(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
    setIsSaving(true);
    const res = await addDoctorDirectly({ ...newDoc });
    if (res.success) { 
      toast({ title: 'Success', description: 'Doctor added.' });
      setIsAddOpen(false); 
      load(); 
    }
    setIsSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingDoc) return;
    setIsSaving(true);
    const res = await updateDoctor(editingDoc.doctor_id, editingDoc);
    if (res.success) {
      toast({ title: 'Success', description: 'Doctor updated.' });
      setIsEditOpen(false);
      load();
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div><h1 className="text-3xl font-black">Doctor Catalog</h1><p className="text-slate-500">Manage profiles.</p></div>
        <div className="flex space-x-4">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild><Button className="h-12 rounded-2xl bg-blue-600"><Plus className="mr-2 h-5 w-5" /> Add Doctor</Button></DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
               <DialogHeader className="p-8 bg-slate-50 border-b"><DialogTitle className="text-2xl font-black">Onboarding</DialogTitle></DialogHeader>
               <ScrollArea className="max-h-[60vh] p-8 space-y-8">
                  <div className="flex flex-col items-center">
                    <div onClick={() => fileInputRef.current?.click()} className="h-28 w-28 rounded-3xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden">
                      {newDoc.imageUrl ? <Image src={newDoc.imageUrl} alt="P" fill className="object-cover" /> : <Camera className="h-7 w-7 text-slate-300" />}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                    </div>
                  </div>
                   <div className="grid grid-cols-2 gap-6 pt-4">
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Specialty</Label>
                       <Select value={newDoc.specialty} onValueChange={v => setNewDoc({...newDoc, specialty: v})}>
                         <SelectTrigger className="h-12 bg-slate-50 border-none font-bold">
                           <SelectValue placeholder="Select" />
                         </SelectTrigger>
                         <SelectContent>
                           {DOCTOR_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                             <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Phone Number</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold" value={newDoc.phone} onChange={e => setNewDoc({...newDoc, phone: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Email Address</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold" value={newDoc.email} onChange={e => setNewDoc({...newDoc, email: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Qualification</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold" placeholder="MBBS, MD" value={newDoc.qualification} onChange={e => setNewDoc({...newDoc, qualification: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Experience (Years)</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={newDoc.experience} onChange={e => setNewDoc({...newDoc, experience: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Consultation Fee (₹)</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={newDoc.fees} onChange={e => setNewDoc({...newDoc, fees: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Slot Duration (Mins)</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={newDoc.slotDuration} onChange={e => setNewDoc({...newDoc, slotDuration: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Start Time</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold" placeholder="09:00" value={newDoc.startTime} onChange={e => setNewDoc({...newDoc, startTime: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">End Time</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold" placeholder="17:00" value={newDoc.endTime} onChange={e => setNewDoc({...newDoc, endTime: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Free Attendant Slots</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={newDoc.allowed_free_attendants} onChange={e => setNewDoc({...newDoc, allowed_free_attendants: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Purchased Slots</Label>
                       <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={newDoc.total_purchased_slots} onChange={e => setNewDoc({...newDoc, total_purchased_slots: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Allow Revenue Deduction</Label>
                       <Select value={String(newDoc.allow_revenue_deduction)} onValueChange={v => setNewDoc({...newDoc, allow_revenue_deduction: v === 'true'})}>
                         <SelectTrigger className="h-12 bg-slate-50 border-none font-bold">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="true">Yes</SelectItem>
                           <SelectItem value="false">No</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Active Campaign</Label>
                       <Input className="h-12 bg-slate-50 border-none font-bold" placeholder="None" value={newDoc.current_active_campaign} onChange={e => setNewDoc({...newDoc, current_active_campaign: e.target.value})} />
                     </div>
                      {newDoc.specialty === 'Physiotherapist' && (
                        <div className="col-span-2 p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Consultation Modes (परामर्श के तरीके)</Label>
                          <div className="flex gap-8">
                            <div className="flex items-center space-x-3">
                              <Checkbox 
                                id="mode-clinic" 
                                checked={(newDoc.consultation_modes || '').includes('Clinic')} 
                                onCheckedChange={(checked) => {
                                  const modes = (newDoc.consultation_modes || '').split(',').filter(Boolean);
                                  if (checked) {
                                    if (!modes.includes('Clinic')) modes.push('Clinic');
                                  } else {
                                    const index = modes.indexOf('Clinic');
                                    if (index > -1) modes.splice(index, 1);
                                  }
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
                                  if (checked) {
                                    if (!modes.includes('Home')) modes.push('Home');
                                  } else {
                                    const index = modes.indexOf('Home');
                                    if (index > -1) modes.splice(index, 1);
                                  }
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
                        <Input className="h-12 bg-slate-50 border-none font-bold" value={newDoc.address} onChange={e => setNewDoc({...newDoc, address: e.target.value})} />
                      </div>
                    </div>
               </ScrollArea>
               <DialogFooter className="p-8 bg-slate-50 border-t"><Button onClick={handleAdd} className="w-full h-14 bg-blue-600 font-bold rounded-2xl">Create Doctor</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50"><tr className="text-[10px] font-black uppercase text-slate-400"><th className="px-8 py-5">Doctor</th><th className="px-8 py-5">Specialty</th><th className="px-8 py-5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (<tr><td colSpan={3} className="text-center py-20 font-bold text-slate-300">Syncing...</td></tr>) : doctors.map((doc) => (
                <tr key={doc.doctor_id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-6"><div className="flex items-center space-x-4"><div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden relative flex items-center justify-center">{doc.image_url ? <Image src={doc.image_url} alt="D" fill className="object-cover" /> : <span>🏥</span>}</div><p className="font-bold text-slate-800">{doc.full_name}</p></div></td>
                  <td className="px-8 py-6"><Badge className="bg-blue-50 text-blue-600 border-none font-bold">{doc.specialty}</Badge></td>
                  <td className="px-8 py-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => { setEditingDoc(doc); setIsEditOpen(true); }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50 border-b">
            <DialogTitle className="text-2xl font-black text-slate-800">Edit Doctor Profile</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-8 space-y-8">
            {editingDoc && (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div onClick={() => fileInputRef.current?.click()} className="h-28 w-28 rounded-3xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden">
                    {editingDoc.image_url ? <Image src={editingDoc.image_url} alt="P" fill className="object-cover" /> : <Camera className="h-7 w-7 text-slate-300" />}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.full_name} onChange={e => setEditingDoc({...editingDoc, full_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Specialty</Label>
                    <Select value={editingDoc.specialty} onValueChange={v => setEditingDoc({...editingDoc, specialty: v})}>
                      <SelectTrigger className="h-12 bg-slate-50 border-none font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCTOR_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Phone Number</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.phone_number || ''} onChange={e => setEditingDoc({...editingDoc, phone_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Email Address</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.email || ''} onChange={e => setEditingDoc({...editingDoc, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Qualification</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.qualification || ''} onChange={e => setEditingDoc({...editingDoc, qualification: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Experience (Years)</Label>
                    <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.experience_years || 0} onChange={e => setEditingDoc({...editingDoc, experience_years: parseInt(e.target.value || '0')})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Consultation Fee (₹)</Label>
                    <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.consultation_fee || 500} onChange={e => setEditingDoc({...editingDoc, consultation_fee: parseInt(e.target.value || '500')})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Slot Duration (Mins)</Label>
                    <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.slot_duration || 15} onChange={e => setEditingDoc({...editingDoc, slot_duration: parseInt(e.target.value || '15')})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Start Time</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.start_time || '09:00'} onChange={e => setEditingDoc({...editingDoc, start_time: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">End Time</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.end_time || '17:00'} onChange={e => setEditingDoc({...editingDoc, end_time: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Free Attendant Slots</Label>
                    <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.allowed_free_attendants || 1} onChange={e => setEditingDoc({...editingDoc, allowed_free_attendants: parseInt(e.target.value || '1')})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Purchased Slots</Label>
                    <Input type="number" className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.total_purchased_slots || 0} onChange={e => setEditingDoc({...editingDoc, total_purchased_slots: parseInt(e.target.value || '0')})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Allow Revenue Deduction</Label>
                    <Select value={String(!!editingDoc.allow_revenue_deduction)} onValueChange={v => setEditingDoc({...editingDoc, allow_revenue_deduction: v === 'true'})}>
                      <SelectTrigger className="h-12 bg-slate-50 border-none font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Active Campaign</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.current_active_campaign || ''} onChange={e => setEditingDoc({...editingDoc, current_active_campaign: e.target.value})} />
                  </div>
                  {editingDoc.specialty === 'Physiotherapist' && (
                    <div className="col-span-2 p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Consultation Modes (परामर्श के तरीके)</Label>
                      <div className="flex gap-8">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id="edit-mode-clinic" 
                            checked={(editingDoc.consultation_modes || '').includes('Clinic')} 
                            onCheckedChange={(checked) => {
                              const modes = (editingDoc.consultation_modes || '').split(',').filter(Boolean);
                              if (checked) {
                                if (!modes.includes('Clinic')) modes.push('Clinic');
                              } else {
                                const index = modes.indexOf('Clinic');
                                if (index > -1) modes.splice(index, 1);
                              }
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
                              if (checked) {
                                  if (!modes.includes('Home')) modes.push('Home');
                              } else {
                                  const index = modes.indexOf('Home');
                                  if (index > -1) modes.splice(index, 1);
                              }
                              setEditingDoc({...editingDoc, consultation_modes: modes.join(',')});
                            }}
                          />
                          <Label htmlFor="edit-mode-home" className="text-sm font-bold text-slate-700 cursor-pointer">Therapy at Home</Label>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Clinic Address</Label>
                    <Input className="h-12 bg-slate-50 border-none font-bold" value={editingDoc.clinic_address || ''} onChange={e => setEditingDoc({...editingDoc, clinic_address: e.target.value})} />
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button onClick={handleUpdate} disabled={isSaving} className="w-full h-14 bg-blue-600 font-bold rounded-2xl">
              {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="max-w-[90vw] h-[500px] flex flex-col rounded-[2.5rem] p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-white"><DialogTitle>Crop Doctor Photo</DialogTitle></DialogHeader>
          <div className="relative flex-1 bg-slate-900"><Cropper image={imageToCrop || ''} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={(_, cap) => setCroppedAreaPixels(cap)} onZoomChange={setZoom} /></div>
          <div className="p-6 bg-white"><Button onClick={getCroppedImg} className="w-full h-14 bg-blue-600 rounded-2xl">Confirm</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
