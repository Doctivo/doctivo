'use client';

import { use, useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ChevronLeft, Star, MapPin, Loader2, Award, Briefcase, Info 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { createAppointment, getBookedSlots } from '@/app/actions/appointment-actions';
import { getDoctorById } from '@/app/actions/doctor-actions';
import { getFamilyMembers } from '@/app/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import { Doctor } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const generateTimeSlots = (start: string, end: string, duration: number, selectedDate: string) => {
  const slots = [];
  try {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(startH, startM, 0, 0);
    const endTime = new Date();
    endTime.setHours(endH, endM, 0, 0);

    const now = new Date();
    // Offset local timezone for correct today check
    const localNowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const isToday = selectedDate === localNowStr;

    let current = new Date(startTime);
    while (current < endTime) {
      if (isToday && current < now) {
        current.setMinutes(current.getMinutes() + duration);
        continue;
      }
      let hours = current.getHours();
      const minutes = current.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12; hours = hours ? hours : 12;
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      slots.push(`${hours}:${minStr} ${ampm}`);
      current.setMinutes(current.getMinutes() + duration);
    }
  } catch (e) {}
  return slots;
};

function BookingContent({ id }: { id: string }) {
  const router = useRouter();
  const patients = useStore(state => state.patients);
  const setPatientsStore = useStore(state => state.setPatients);
  const addAppointmentStore = useStore(state => state.addAppointment);
  const user = useStore(state => state.user);
  const { toast } = useToast();

  const [doc, setDoc] = useState<Doctor | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [showCustomSymptom, setShowCustomSymptom] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getDoctorById(id);
      setDoc(data);
      const booked = await getBookedSlots(id, selectedDate);
      setBookedSlots(booked);
      setIsFetching(false);
    }
    load();
  }, [id, selectedDate]);

  useEffect(() => {
    if (user?.id) getFamilyMembers(user.id).then(f => setPatientsStore([{...user, relation: 'Self'} as any, ...f]));
  }, [user, setPatientsStore]);

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]);
  };

  const processPayment = () => {
    setIsBooking(true);
    setTimeout(() => finalizeBooking('TXN_' + Date.now()), 1500);
  };

  const finalizeBooking = async (txnId: string) => {
    if (!doc || !user) return;
    const patient = patients.find(p => p.id === selectedPatientId) || user;
    const appData = {
      id: `${Math.floor(100000 + Math.random() * 900000)}`,
      doctorId: doc.id,
      doctorName: doc.name,
      patientId: user.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientBloodGroup: patient.blood_group,
      patientType: patient.id === user.id ? 'Self' as const : 'Family_Member' as const,
      date: selectedDate,
      time: selectedSlot,
      current_symptoms: [...selectedReasons, symptoms].filter(Boolean).join(', '),
      consultation_fee_amount: doc.fees,
      payment_status: 'Paid' as const,
      payment_mode: 'Online_UPI' as const,
      transaction_id: txnId,
      status: 'Confirmed' as const
    };
    const res = await createAppointment(appData);
    if (res.success) {
      addAppointmentStore({...appData, tokenNumber: res.data.token_number, visit_otp: res.data.visit_otp} as any);
      router.push(`/success?id=${appData.id}`);
    } else {
      setIsBooking(false);
      toast({ variant: 'destructive', title: 'Failed', description: res.error });
    }
  };

  if (isFetching) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  if (!doc) return <div className="p-10 text-center">Doctor not found</div>;

  return (
    <div className="mobile-container pb-60 bg-slate-50 min-h-screen overflow-y-auto">
      <div className="bg-white p-4 flex items-center justify-between sticky top-0 z-30 border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-full border border-border">
            <ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Doctor Details</h1>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <Card className="border-border shadow-sm rounded-[2.5rem] overflow-hidden bg-white border-2">
          <CardContent className="p-8 space-y-6">
            <div className="flex space-x-6">
              <div className="h-24 w-24 rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden relative border-2 border-slate-100">
                {doc.imageUrl ? <Image src={doc.imageUrl} alt={doc.name} fill className="object-cover" /> : <span className="text-4xl">🏥</span>}
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="font-black text-slate-900 text-xl uppercase tracking-tight">{doc.name}</h2>
                <p className="text-sm font-bold text-primary uppercase tracking-widest">{doc.specialty}</p>
                <div className="flex items-center text-[11px] font-black text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-200 w-fit">
                  <Star className="h-3 w-3 fill-yellow-600 mr-1" /> {doc.rating} Rating
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Award className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Education</p><p className="text-xs font-bold text-slate-800">{doc.qualification || 'MBBS, MD'}</p></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><Briefcase className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Experience</p><p className="text-xs font-bold text-slate-800">{doc.experience}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-blue-50 border-blue-100 rounded-2xl">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-700 font-black text-xs uppercase tracking-widest">Arrival Instruction</AlertTitle>
          <AlertDescription className="text-blue-600 text-xs font-bold">
            Please arrive at least 10 minutes prior to your selected slot on <strong>{selectedDate}</strong> for smooth check-in.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 px-1">Select Patient</h3>
          <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="w-full h-14 rounded-2xl bg-white border-2 border-slate-100 px-4 font-bold outline-none">
            <option value="">Select a profile</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.relation})</option>)}
          </select>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 px-1">Reason for Visit</h3>
          <div className="flex flex-wrap gap-2">
            {(doc.reasonsForVisit || ["Routine Checkup", "Consultation", "Follow-up"]).map(reason => (
              <button 
                key={reason} 
                onClick={() => toggleReason(reason)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                  selectedReasons.includes(reason) ? "bg-primary border-primary text-white" : "bg-white border-slate-100 text-slate-600"
                )}
              >
                {reason}
              </button>
            ))}
            <button 
              onClick={() => setShowCustomSymptom(!showCustomSymptom)}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold border-2 border-dashed", showCustomSymptom ? "bg-slate-100 border-slate-300" : "border-slate-300 text-slate-400")}
            >
              + Other
            </button>
          </div>
          {showCustomSymptom && (
            <Textarea 
              placeholder="Describe your symptoms briefly..." 
              value={symptoms} 
              onChange={e => setSymptoms(e.target.value)} 
              className="mt-3 rounded-2xl bg-white border-2 border-slate-100 font-bold"
            />
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 px-1">Select Time Slot</h3>
          <div className="grid grid-cols-3 gap-3">
            {generateTimeSlots(doc.startTime, doc.endTime, doc.slotDuration, selectedDate).map(slot => {
              const isBooked = bookedSlots.includes(slot);
              return (
                <button 
                  key={slot} 
                  disabled={isBooked}
                  onClick={() => setSelectedSlot(slot)} 
                  className={cn(
                    "py-3 rounded-xl font-black text-[10px] border-2 transition-all", 
                    isBooked ? "bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed line-through" :
                    selectedSlot === slot ? "bg-primary border-primary text-white" : "bg-white border-slate-100 text-slate-800"
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-border z-40 shadow-xl">
        <div className="max-w-[480px] mx-auto flex items-center gap-6">
          <div className="flex-1"><span className="text-slate-400 text-[10px] font-black block">FEES</span><span className="text-slate-900 text-2xl font-black">₹{doc.fees}</span></div>
          <Button className="h-14 px-10 text-lg font-black bg-primary rounded-2xl flex-1" disabled={!selectedSlot || !selectedPatientId || isBooking} onClick={processPayment}>
            {isBooking ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Suspense><BookingContent id={id} /></Suspense>;
}
