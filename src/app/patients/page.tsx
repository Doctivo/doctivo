'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Edit3, Trash2, Plus, Loader2, Camera, Phone, User, Search, Heart } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gender, Patient } from '@/lib/types';
import { addFamilyMember, updateFamilyMember, removeFamilyMember, getFamilyMembers, getPatientByPhone } from '@/app/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { cn } from '@/lib/utils';

const INITIAL_PATIENT_STATE: Partial<Patient> = {
  name: '', age: '', gender: 'Male', relation: 'Other', 
  medicalHistory: '', allergies: '', height_cm: '', 
  weight_kg: '', blood_group: '', state: 'Uttar Pradesh', 
  city: 'Gorakhpur', area: '', pincode: '', phone: '', secondaryPhone: '', imageUrl: ''
};

export default function PatientsPage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const setUser = useStore(state => state.setUser);
  const patients = useStore(state => state.patients);
  const setPatients = useStore(state => state.setPatients);
  const deletePatientStore = useStore(state => state.deletePatient);
  const updatePatientStore = useStore(state => state.updatePatient);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const hasHydrated = useStore(state => state._hasHydrated);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [currentMember, setCurrentMember] = useState<Partial<Patient>>(INITIAL_PATIENT_STATE);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((_: any, cap: any) => {
    setCroppedAreaPixels(cap);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      const canvas = document.createElement('canvas');
      const img = new (window as any).Image();
      img.src = imageToCrop;
      await new Promise(resolve => img.onload = resolve);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      const base64Image = canvas.toDataURL('image/jpeg');
      setCurrentMember(prev => ({ ...prev, imageUrl: base64Image }));
      setIsCropping(false);
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
    }
  };

  const displayPatients = useMemo(() => {
    const list = [...patients];
    const hasSelf = list.some(p => p.id === user?.id || p.relation === 'Self');
    if (!hasSelf && user && user.name) {
      list.unshift({ ...user, relation: 'Self' } as Patient);
    }
    const unique = Array.from(new Map(list.map(p => [p.id, p])).values());
    const filtered = unique.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    return filtered.sort((a, b) => (a.relation === 'Self' ? -1 : 0));
  }, [patients, user, search]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }

    async function syncData() {
      setLoading(true);
      if (user?.id && user?.phone) {
        try {
          const [profile, family] = await Promise.all([
            getPatientByPhone(user.phone),
            getFamilyMembers(user.id)
          ]);
          if (profile) setUser(profile);
          const fullList: Patient[] = [];
          if (profile) fullList.push({ ...profile, relation: 'Self' } as Patient);
          else if (user.name) fullList.push({ ...user, relation: 'Self' } as Patient);
          fullList.push(...family);
          setPatients(fullList);
        } catch (error) {}
      }
      setLoading(false);
    }
    syncData();
  }, [isAuthenticated, hasHydrated, user?.id, user?.phone, router, setPatients, setUser]);

  const handleNumericInput = (field: string, val: string) => {
    const num = val.replace(/\D/g, '');
    setCurrentMember(prev => ({ ...prev, [field]: num }));
  };

  const handleSavePatient = async () => {
    // Strict Validation
    if (!currentMember.name || !currentMember.age || !currentMember.gender || !currentMember.relation) {
      toast({ variant: 'destructive', title: 'Missing Details', description: 'Please fill in all mandatory fields (*).' });
      return;
    }
    
    if (Number(currentMember.age) > 250 || Number(currentMember.height_cm) > 300 || Number(currentMember.weight_kg) > 300) {
      toast({ variant: 'destructive', title: 'Invalid Details', description: 'Please check the values highlighted in red.' });
      return;
    }

    if (currentMember.phone && currentMember.phone.length !== 10) {
      toast({ variant: 'destructive', title: 'Invalid Phone', description: 'Phone number must be exactly 10 digits.' });
      return;
    }

    setIsSaving(true);
    
    try {
      if (isEditing) {
        const result = await updateFamilyMember(currentMember as Patient);
        if (result.success) {
          updatePatientStore(currentMember.id!, currentMember);
          setIsModalOpen(false);
          toast({ title: 'Success', description: 'Profile updated.' });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error || 'Update failed.' });
        }
      } else {
        const memberId = `DOC-MEM-${Date.now()}`;
        const memberData = { ...currentMember, id: memberId } as Patient;
        const result = await addFamilyMember(memberData, user?.id || '');
        if (result.success) {
          setPatients([...patients, memberData]);
          setIsModalOpen(false);
          toast({ title: 'Success', description: 'Family profile created.' });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to add profile.' });
        }
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Action failed.' });
    }
    setIsSaving(false);
  };

  const openEditModal = (patient: Patient) => {
    setCurrentMember(patient);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setCurrentMember(INITIAL_PATIENT_STATE);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (id === user?.id) return;
    if (!confirm('Remove this profile?')) return;
    const result = await removeFamilyMember(id);
    if (result.success) {
      deletePatientStore(id);
      toast({ title: 'Removed', description: 'Profile deleted.' });
    }
  };

  if (!hasHydrated) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="mobile-container pb-24 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="bg-white dark:bg-slate-900 sticky top-0 z-20 shadow-sm border-b border-border dark:border-slate-800">
        <div className="p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative border border-border dark:border-slate-700 shadow-sm shrink-0">
            {user?.imageUrl ? <Image src={user.imageUrl} alt="Me" fill className="object-cover" /> : <span className="text-primary font-bold">{user?.name?.charAt(0) || 'U'}</span>}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search profiles..." 
              className="pl-11 h-12 bg-slate-50 dark:bg-slate-800 border-border dark:border-slate-700 rounded-full font-medium focus-visible:ring-primary/20 dark:text-slate-100" 
              value={search || ''} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <button 
            onClick={openAddModal}
            className="h-12 w-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all shrink-0"
          >
            <Plus className="h-6 w-6 stroke-[3px]" />
          </button>
        </div>
      </div>

      <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-3 border-b border-border dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Patient Profiles</h2>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{displayPatients.length} Active Accounts</span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-950">
        {displayPatients.map((patient) => (
          <div key={patient.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-border dark:border-slate-800 shadow-sm hover:shadow-lg transition-all relative">
            <div className="flex items-center space-x-5">
              <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative border border-border dark:border-slate-700 shrink-0">
                {patient.imageUrl ? (
                  <Image src={patient.imageUrl} alt={patient.name} fill className="object-cover" />
                ) : (
                  <span className="text-xl font-bold text-slate-400">{patient.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 truncate tracking-tight">{patient.name}</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 mb-2">{patient.relation}</p>
                <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <User className="h-3 w-3 mr-1" />
                  <span className="truncate">{patient.age} Years • {patient.gender}</span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-3 shrink-0">
                <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-border dark:border-slate-700 shadow-sm">
                  <Heart className="h-3 w-3 text-blue-500 fill-blue-500" />
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                    {patient.blood_group || 'Unknown'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => patient.relation === 'Self' ? router.push('/onboarding') : openEditModal(patient)}
                    className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 border border-border dark:border-slate-700 p-0 shadow-sm"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  {patient.relation !== 'Self' && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(patient.id)}
                      className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 dark:text-red-400 border border-border dark:border-slate-700 p-0 shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {displayPatients.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-60">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-dashed border-border">
              <User className="h-8 w-8" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm uppercase">No Profiles Found</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Your saved family profiles will appear here.</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl h-[85vh] flex flex-col">
          <DialogHeader className="p-8 bg-slate-50 border-b border-border">
            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
              {isEditing ? 'Update Profile' : 'Add New Member'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8 pb-32">
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="h-32 w-32 rounded-full bg-slate-50 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group hover:border-primary transition-all"
                >
                  {currentMember.imageUrl ? (
                    <Image src={currentMember.imageUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-slate-300 group-hover:text-primary" />
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                </div>
                <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Update Photo</span>
              </div>

              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Full Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Enter Name" className="h-14 rounded-xl bg-slate-50 border-border font-bold" value={currentMember.name || ''} onChange={e => setCurrentMember({...currentMember, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Age <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      placeholder="Enter Your Age" 
                      className={cn("h-14 rounded-xl bg-slate-50 border-border font-bold", Number(currentMember.age) > 250 && "border-red-500")}
                      value={currentMember.age || ''} 
                      min="0"
                      onChange={e => handleNumericInput('age', e.target.value)} 
                    />
                    {Number(currentMember.age) > 250 && <p className="text-red-500 text-[10px] mt-1 font-bold">Age must be less than 250.</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Blood Group</Label>
                    <Select value={currentMember.blood_group || ''} onValueChange={v => setCurrentMember({...currentMember, blood_group: v})}>
                      <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-border font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'].map(bg => (<SelectItem key={bg} value={bg} className="font-bold">{bg}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Height (cm)</Label>
                    <Input 
                      type="number" 
                      placeholder="175" 
                      className={cn("h-14 rounded-xl bg-slate-50 border-border font-bold", Number(currentMember.height_cm) > 300 && "border-red-500")}
                      value={currentMember.height_cm || ''} 
                      min="0"
                      onChange={e => handleNumericInput('height_cm', e.target.value)} 
                    />
                    {Number(currentMember.height_cm) > 300 && <p className="text-red-500 text-[10px] mt-1 font-bold">Invalid height.</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Gender <span className="text-red-500">*</span></Label>
                    <Select value={currentMember.gender || ''} onValueChange={v => setCurrentMember({...currentMember, gender: v as Gender})}>
                      <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-border font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {['Male', 'Female', 'Other'].map(g => (<SelectItem key={g} value={g} className="font-bold">{g}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Weight (kg)</Label>
                    <Input 
                      type="number" 
                      placeholder="70" 
                      className={cn("h-14 rounded-xl bg-slate-50 border-border font-bold", Number(currentMember.weight_kg) > 300 && "border-red-500")}
                      value={currentMember.weight_kg || ''} 
                      min="0"
                      onChange={e => handleNumericInput('weight_kg', e.target.value)} 
                    />
                    {Number(currentMember.weight_kg) > 300 && <p className="text-red-500 text-[10px] mt-1 font-bold">Invalid weight.</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Relation <span className="text-red-500">*</span></Label>
                    <Select value={currentMember.relation || ''} onValueChange={v => setCurrentMember({...currentMember, relation: v})}>
                      <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-border font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {['Father', 'Mother', 'Spouse', 'Child', 'Sibling', 'Other'].map(r => (<SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Mobile Number (10 Digits)</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      type="tel" 
                      placeholder="Mobile Number" 
                      maxLength={10}
                      className="h-14 rounded-xl bg-slate-50 border-border pl-12 font-bold" 
                      value={currentMember.phone || ''} 
                      onChange={e => setCurrentMember({...currentMember, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                    />
                  </div>
                </div>

                <hr className="border-border my-6" />

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Medical History (Optional)</Label>
                  <Textarea 
                    placeholder="Brief history of illnesses, surgeries, or chronic conditions..." 
                    className="rounded-xl bg-slate-50 border-border font-bold min-h-[100px]" 
                    value={currentMember.medicalHistory || ''} 
                    onChange={e => setCurrentMember({...currentMember, medicalHistory: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Allergies (Optional)</Label>
                  <Textarea 
                    placeholder="Mention any drug, food, or environmental allergies..." 
                    className="rounded-xl bg-slate-50 border-border font-bold min-h-[100px]" 
                    value={currentMember.allergies || ''} 
                    onChange={e => setCurrentMember({...currentMember, allergies: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <div className="p-8 bg-white border-t border-border z-50">
            <Button className="w-full h-16 bg-primary font-black text-lg rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all" onClick={handleSavePatient} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin h-6 w-6" /> : (isEditing ? 'Save Changes' : 'Add Profile')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isCropping && (
        <Dialog open={isCropping} onOpenChange={setIsCropping}>
          <DialogContent className="max-w-[90vw] h-[550px] flex flex-col rounded-[2.5rem] p-0 overflow-hidden border-none z-[1000]">
            <DialogHeader className="p-6 bg-white border-b border-border">
              <DialogTitle className="text-center font-black">Adjust Photo</DialogTitle>
            </DialogHeader>
            <div className="relative flex-1 bg-slate-900">
              <Cropper image={imageToCrop || ''} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-8 bg-white space-y-6">
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-primary" />
              <Button onClick={getCroppedImg} className="w-full h-16 bg-primary text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20">Confirm Photo</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
