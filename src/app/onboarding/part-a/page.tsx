'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useStore } from '@/lib/store';
import { Gender } from '@/types';
import { upsertPatientProfile } from '@/actions/patients';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PartAPage() {
  const router = useRouter();
  const setUserStore = useStore(state => state.setUser);
  const user = useStore(state => state.user);
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: (user?.gender as Gender) || 'Male',
    state: user?.state || '',
    city: user?.city || '',
    area: user?.area || '',
    pincode: user?.pincode || ''
  });

  const handleContinue = async () => {
    if (!formData.name || !formData.city) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name and City are required' });
      return;
    }

    setIsLoading(true);
    const profileData = {
      ...user,
      ...formData,
      id: user?.id || 'USER-' + Date.now(),
      phone: user?.phone || '9876543210'
    };

    const result = await upsertPatientProfile(profileData);

    if (result.success) {
      setUserStore(profileData as any);
      router.push('/onboarding/part-b');
    } else {
      toast({ variant: 'destructive', title: 'Database Error', description: result.error });
    }
    setIsLoading(false);
  };

  return (
    <div className="mobile-container flex flex-col p-6 bg-white overflow-y-auto">
      <div className="mb-8 pt-6">
        <h1 className="text-2xl font-bold text-slate-800">Complete Your Profile (Part A)</h1>
        <div className="h-1.5 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-primary rounded-full transition-all duration-500" />
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 w-fit px-3 py-1 rounded-full">Personal Info</h2>
          <div className="space-y-2">
            <Label className="text-slate-600 font-bold">Full Name</Label>
            <Input 
              placeholder="Enter Your Name" 
              className="h-12 rounded-xl bg-slate-50 border-slate-100"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold">Age</Label>
              <Input 
                type="number" 
                placeholder="25"
                className={cn("h-12 rounded-xl bg-slate-50 border-slate-100", Number(formData.age) > 250 && "border-red-500")}
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
              />
              {Number(formData.age) > 250 && <p className="text-red-500 text-xs mt-1">Invalid age.</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold">Gender</Label>
              <RadioGroup 
                value={formData.gender} 
                className="flex h-12 items-center space-x-4 bg-slate-50 rounded-xl px-4 border border-slate-100"
                onValueChange={(val) => setFormData({...formData, gender: val as Gender})}
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male" className="font-medium text-xs">Male</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female" className="font-medium text-xs">Female</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 w-fit px-3 py-1 rounded-full">Location Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold">State</Label>
              <Input 
                placeholder="Uttar Pradesh"
                className="h-12 rounded-xl bg-slate-50 border-slate-100"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold">City</Label>
              <Input 
                placeholder="Gorakhpur"
                className="h-12 rounded-xl bg-slate-50 border-slate-100"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-bold">Area / Society Name</Label>
            <Input 
              placeholder="e.g. Civil Lines"
              className="h-12 rounded-xl bg-slate-50 border-slate-100"
              value={formData.area}
              onChange={(e) => setFormData({...formData, area: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-bold">Pincode</Label>
            <Input 
              type="number" 
              placeholder="273001"
              className="h-12 rounded-xl bg-slate-50 border-slate-100"
              value={formData.pincode}
              onChange={(e) => setFormData({...formData, pincode: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="py-8 mt-6">
        <Button 
          className="w-full h-14 text-lg font-bold bg-primary shadow-lg shadow-primary/20 rounded-2xl"
          onClick={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Continue to Medical Info'}
        </Button>
      </div>
    </div>
  );
}

