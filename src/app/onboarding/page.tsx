'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { Gender, UserProfile } from '@/types';
import { upsertPatientProfile } from '@/actions/patients';
import { Loader2, Camera, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { cn } from '@/lib/utils';

const STATES = ["Uttar Pradesh", "Bihar", "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Rajasthan"];
const CITIES: Record<string, string[]> = {
  "Uttar Pradesh": ["Gorakhpur", "Lucknow", "Kanpur", "Varanasi", "Agra"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur"],
  "Delhi": ["New Delhi", "Central Delhi"],
};

export default function OnboardingPage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const setUserStore = useStore(state => state.setUser);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || 'Male',
    height_cm: user?.height_cm || '',
    weight_kg: user?.weight_kg || '',
    blood_group: user?.blood_group || '',
    state: user?.state || 'Uttar Pradesh',
    city: user?.city || 'Gorakhpur',
    area: user?.area || '',
    pincode: user?.pincode || '',
    secondaryPhone: user?.secondaryPhone || '',
    imageUrl: user?.imageUrl || '',
    medicalHistory: user?.medicalHistory || '',
    allergies: user?.allergies || '',
  });

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => { if (user) setFormData(prev => ({ ...prev, ...user })); }, [user]);

  const onCropComplete = useCallback((_: any, cap: any) => setCroppedAreaPixels(cap), []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await new Promise(resolve => img.onload = resolve);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      setFormData({ ...formData, imageUrl: canvas.toDataURL('image/jpeg') });
      setIsCropping(false);
      setImageToCrop(null);
    } catch (e) {}
  };

  const handleNumericInput = (field: string, val: string) => {
    const num = val.replace(/\D/g, '');
    if (field === 'age' && parseInt(num) > 250) return;
    setFormData({ ...formData, [field]: num });
  };

  const handleComplete = async () => {
    // Strict Validation
    if (!formData.name || !formData.age || !formData.gender) {
      toast({ variant: 'destructive', title: 'Missing Details', description: 'Please enter your full name, age, and gender.' });
      return;
    }

    setIsLoading(true);
    const profileData = { ...user, ...formData, isProfileComplete: true } as UserProfile;
    const result = await upsertPatientProfile(profileData);
    if (result.success) {
      setUserStore(profileData);
      toast({ title: 'Success!', description: 'Your profile has been updated.' });
      router.push('/home');
    } else {
      toast({ variant: 'destructive', title: 'Failed', description: result.error });
    }
    setIsLoading(false);
  };

  return (
    <div className="mobile-container flex flex-col p-6 bg-white dark:bg-slate-950 overflow-y-auto pb-32 min-h-screen">
      <div className="mb-12 pt-8 text-center space-y-3">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Profile Details</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold px-4">Complete your profile to access healthcare services.</p>
      </div>

      <div className="space-y-10">
        <div className="flex flex-col items-center">
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="h-32 w-32 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-border dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-sm hover:border-primary dark:hover:border-primary transition-all group"
          >
            {formData.imageUrl ? (
              <Image priority src={formData.imageUrl} alt="P" fill className="object-cover" />
            ) : (
              <Camera className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
          </div>
          <p className="text-[10px] font-black text-slate-500 mt-3 uppercase tracking-widest">Update Photo</p>
        </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-900 dark:text-slate-300 ml-1 uppercase tracking-widest">Full Name <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="Enter Your Name" 
                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800 font-bold dark:text-slate-100" 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-900 dark:text-slate-300 ml-1 uppercase tracking-widest">Age <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="e.g. 28" 
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800 font-bold dark:text-slate-100" 
                  value={formData.age || ''} 
                  onChange={e => handleNumericInput('age', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-900 dark:text-slate-300 ml-1 uppercase tracking-widest">Gender <span className="text-red-500">*</span></Label>
                <Select value={formData.gender} onValueChange={(val: Gender) => setFormData({...formData, gender: val})}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800 font-bold dark:text-slate-100">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-900 dark:text-slate-300 ml-1 uppercase tracking-widest">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Secondary Phone" 
                  className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800 font-bold dark:text-slate-100" 
                  value={formData.secondaryPhone || ''} 
                  onChange={e => handleNumericInput('secondaryPhone', e.target.value)} 
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-900 dark:text-slate-300 ml-1 uppercase tracking-widest">State</Label>
                <Select value={formData.state || ''} onValueChange={val => setFormData({...formData, state: val, city: ''})}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800 font-bold dark:text-slate-100">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-900 dark:text-slate-300 ml-1 uppercase tracking-widest">City</Label>
                <Select value={formData.city || ''} onValueChange={val => setFormData({...formData, city: val})} disabled={!formData.state}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800 font-bold dark:text-slate-100">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    {(CITIES[formData.state as string] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-900 dark:text-slate-300 ml-1 uppercase tracking-widest">Medical History</Label>
              <Textarea 
                placeholder="Any previous illnesses, surgeries, or chronic conditions..." 
                className="rounded-2xl bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800 font-medium resize-none min-h-[100px] dark:text-slate-100" 
                value={formData.medicalHistory || ''} 
                onChange={e => setFormData({...formData, medicalHistory: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-900 dark:text-slate-300 ml-1 uppercase tracking-widest">Allergies</Label>
              <Textarea 
                placeholder="Any allergies to medicines or food..." 
                className="rounded-2xl bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800 font-medium resize-none min-h-[80px] dark:text-slate-100" 
                value={formData.allergies || ''} 
                onChange={e => setFormData({...formData, allergies: e.target.value})} 
              />
            </div>
          </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50">
        <Button className="w-full h-18 text-xl font-black bg-primary rounded-2xl shadow-2xl shadow-primary/30" onClick={handleComplete} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin h-6 w-6 text-white" /> : 'Save Profile'}
        </Button>
      </div>

      {isCropping && (
        <Dialog open={isCropping} onOpenChange={setIsCropping}>
          <DialogContent className="max-w-[90vw] h-[550px] flex flex-col rounded-[2.5rem] p-0 overflow-hidden border-none z-[1000]">
            <DialogHeader className="p-6 bg-white border-b border-slate-200">
              <DialogTitle className="text-center font-black">Adjust Photo</DialogTitle>
            </DialogHeader>
            <div className="relative flex-1 bg-slate-900">
              <Cropper image={imageToCrop || ''} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-8 bg-white space-y-6">
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-primary" />
              <Button onClick={getCroppedImg} className="w-full h-16 bg-primary text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20">Apply Photo</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


