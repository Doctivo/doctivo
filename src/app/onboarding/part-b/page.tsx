'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/lib/store';
import { doctorSpecializationRecommendation } from '@/ai/flows/doctor-specialization-recommendation';
import { upsertPatientProfile } from '@/actions/patients';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SYMPTOMS_OPTIONS = [
  { id: 'dental', label: 'Daant ka dard (Dental Problems)' },
  { id: 'heart', label: 'Dil ki pareshani (Heart Issues)' },
  { id: 'fever', label: 'Bukhar / Khansi (Fever / Cold)' },
  { id: 'skin', label: 'Skin ki pareshani (Skin Issues)' },
];

export default function PartBPage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const setUserStore = useStore(state => state.setUser);
  const addPatient = useStore(state => state.addPatient);
  const { toast } = useToast();
  
  const [history, setHistory] = useState(user?.medicalHistory || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const symptomsText = selectedSymptoms.map(id => SYMPTOMS_OPTIONS.find(o => o.id === id)?.label).join(', ');
      
      // AI Recommendation
      const recommendation = await doctorSpecializationRecommendation({
        symptoms: symptomsText,
        medicalHistory: history,
        allergiesMedications: allergies
      });

      const updatedUser = {
        ...user,
        medicalHistory: history,
        allergies: allergies,
        isProfileComplete: true
      };

      // Save to Database
      const result = await upsertPatientProfile(updatedUser);

      if (result.success) {
        setUserStore(updatedUser);
        
        addPatient({
          id: user.id || 'USER-SELF',
          name: user.name,
          age: user.age,
          gender: user.gender,
          relation: 'Self',
          medicalHistory: history,
          allergies: allergies,
          height_cm: user.height_cm || '',
          weight_kg: user.weight_kg || '',
          blood_group: user.blood_group || ''
        } as any);

        const params = new URLSearchParams();
        recommendation.specializations.forEach(s => params.append('rec', s));
        router.push(`/choose-category?${params.toString()}`);
      } else {
        toast({ variant: 'destructive', title: 'DB Sync Failed', description: result.error });
      }
    } catch (error: any) {
      console.error('Error during onboarding recommendation:', error);
      router.push('/choose-category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-container flex flex-col p-6 bg-white overflow-y-auto pb-10">
      <div className="mb-8 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-slate-800">Medical Profile</h1>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Final Step</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full w-full bg-primary rounded-full" />
        </div>
      </div>

      <div className="space-y-8 flex-1">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Past Medical History / Chronic Illnesses
            </label>
            <Textarea 
              placeholder="e.g. Sugar, BP, Diabetes, Thyroid..." 
              className="min-h-[120px] bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Known Allergies / Ongoing Medications
            </label>
            <Textarea 
              placeholder="Mention any drug allergies or current medicines..." 
              className="min-h-[120px] bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold text-primary uppercase tracking-widest">
            Select Current Symptoms
          </label>
          <div className="grid grid-cols-1 gap-3">
            {SYMPTOMS_OPTIONS.map((symptom) => (
              <div 
                key={symptom.id}
                onClick={() => toggleSymptom(symptom.id)}
                className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedSymptoms.includes(symptom.id) 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <Checkbox 
                  checked={selectedSymptoms.includes(symptom.id)}
                  className="mr-4 h-5 w-5 border-slate-300 data-[state=checked]:bg-primary"
                />
                <span className={`text-sm font-bold ${selectedSymptoms.includes(symptom.id) ? 'text-primary' : 'text-slate-700'}`}>
                  {symptom.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Button 
          className="w-full h-14 text-lg font-bold bg-primary shadow-lg shadow-primary/20 rounded-2xl"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Submit & Analyze Profile'}
        </Button>
      </div>
    </div>
  );
}

