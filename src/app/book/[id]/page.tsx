'use client';

import { use, useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Star, MapPin, Loader2, Plus, CheckCircle2, Calendar as CalendarIcon, Clock as ClockIcon, MessageSquare, AlertCircle, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { createAppointment, getBookedSlots } from '@/app/actions/appointment-actions';
import { getDoctorById } from '@/app/actions/doctor-actions';
import { addFamilyMember, getFamilyMembers } from '@/app/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import { Doctor, Patient } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const generateTimeSlots = (start: string, end: string, duration: number) => {
  const slots = [];
  try {
    let current = new Date(`2024-01-01T${start}:00`);
    const stop = new Date(`2024-01-01T${end}:00`);

    while (current < stop) {
      const timeString = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      slots.push(timeString);
      current = new Date(current.getTime() + duration * 60000);
    }
  } catch (e) {}
  return slots;
};

function BookingContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const user = useStore(state => state.user);
  const patients = useStore(state => state.patients);
  const setPatientsStore = useStore(state => state.setPatients);
  const addPatientStore = useStore(state => state.addPatient);
  const addAppointmentStore = useStore(state => state.addAppointment);
  const { toast } = useToast();

  const [doc, setDoc] = useState<Doctor | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [showCustomSymptom, setShowCustomSymptom] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showMockAlert, setShowMockAlert] = useState(false);

  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const doctorReasons = useMemo(() => {
    const list = [...(doc?.reasonsForVisit || [])];
    if (mode === 'Home' && !list.includes('Home Visit Request')) {
      list.unshift('Home Visit Request');
    }
    return list;
  }, [doc?.reasonsForVisit, mode]);

  useEffect(() => {
    if (mode === 'Home') {
      setSelectedReasons(['Home Visit Request']);
    }
  }, [mode]);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    name: '', age: '', gender: 'Male', relation: 'Other', height_cm: '', weight_kg: '', blood_group: '', medicalHistory: '', allergies: '', secondaryPhone: ''
  });

  const dayRange = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        fullDate: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: date.getDate()
      });
    }
    return days;
  }, []);

  const timeSlots = useMemo(() => {
    if (!doc) return [];
    return generateTimeSlots(doc.startTime, doc.endTime, doc.slotDuration);
  }, [doc]);

  useEffect(() => {
    async function sync() {
      if (user?.id) {
        const family = await getFamilyMembers(user.id);
        const fullList = [{ ...user, relation: 'Self' } as Patient, ...family];
        setPatientsStore(fullList);
      }
    }
    sync();
  }, [user?.id, setPatientsStore]);

  useEffect(() => {
    async function load() {
      const data = await getDoctorById(id);
      setDoc(data);
      setIsFetching(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    async function fetchBooked() {
      if (!doc || !selectedDate) return;
      const booked = await getBookedSlots(doc.id, selectedDate);
      setBookedSlots(booked);
      setSelectedSlot('');
    }
    fetchBooked();
  }, [doc, selectedDate]);

  const displayPatients = useMemo(() => {
    const list = [...patients];
    const hasSelf = list.some(p => p.id === user?.id || p.relation === 'Self');
    if (!hasSelf && user?.name) list.push({ ...user, relation: 'Self' } as Patient);
    const unique = Array.from(new Map(list.map(p => [p.id, p])).values());
    return unique.sort((a, b) => a.relation === 'Self' ? -1 : 1);
  }, [patients, user]);

  useEffect(() => {
    if (displayPatients.length > 0 && !selectedPatientId) setSelectedPatientId(displayPatients[0].id);
  }, [displayPatients, selectedPatientId]);

  const handleAddQuickPatient = async () => {
    if (!newPatient.name || !newPatient.age || !newPatient.height_cm || !newPatient.weight_kg || !newPatient.gender || !newPatient.relation || !newPatient.blood_group) {
      toast({ variant: 'destructive', title: 'Error', description: 'All mandatory fields are required.' });
      return;
    }

    const ageNum = parseInt(newPatient.age);
    const heightNum = parseInt(newPatient.height_cm);
    const weightNum = parseInt(newPatient.weight_kg);

    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 150) {
      toast({ variant: 'destructive', title: 'Invalid Age', description: 'Age must be between 1 and 150.' });
      return;
    }
    if (isNaN(heightNum) || heightNum <= 0 || heightNum > 243) {
      toast({ variant: 'destructive', title: 'Invalid Height', description: 'Height must be between 1 and 243 cm (8 feet).' });
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 200) {
      toast({ variant: 'destructive', title: 'Invalid Weight', description: 'Weight must be between 1 and 200 kg.' });
      return;
    }

    setIsSavingPatient(true);
    const memberId = `DOC-MEM-${Date.now()}`;
    const memberData = { ...newPatient, id: memberId } as Patient;
    const result = await addFamilyMember(memberData, user?.id || '');
    if (result.success) {
      addPatientStore(memberData);
      setSelectedPatientId(memberId);
      setIsAddOpen(false);
      setNewPatient({ name: '', age: '', gender: 'Male', relation: 'Other', height_cm: '', weight_kg: '', blood_group: '', medicalHistory: '', allergies: '', secondaryPhone: '' });
      toast({ title: 'Success', description: 'Family profile added.' });
    }
    setIsSavingPatient(false);
  };

  const processPayment = async () => {
    if (!selectedSlot || !selectedPatientId) return;
    setIsBooking(true);
    setShowMockAlert(true);
    setTimeout(() => finalizeBooking('TXN_' + Date.now()), 1200);
  };

  const finalizeBooking = async (txnId: string) => {
    if (!doc || !user) return;
    const patient = displayPatients.find(p => p.id === selectedPatientId);
    const appData = {
      id: `${Math.floor(100000 + Math.random() * 900000)}`,
      doctorId: doc.id,
      doctorName: doc.name,
      patientId: user.id,
      patientName: patient?.name || 'Unknown',
      patientType: (patient?.id === user.id || patient?.relation === 'Self') ? 'Self' as const : 'Family_Member' as const,
      date: selectedDate,
      time: selectedSlot,
      current_symptoms: [
        ...selectedReasons,
        ...(showCustomSymptom && symptoms.trim() ? [symptoms.trim()] : (!doc?.reasonsForVisit || doc.reasonsForVisit.length === 0 ? [symptoms.trim()] : []))
      ].join(', '),
      consultation_fee_amount: doc.fees,
      payment_status: 'Paid' as const,
      transaction_id: txnId,
      status: 'Confirmed' as const
    };
    const result = await createAppointment(appData);
    if (result.success) {
      addAppointmentStore({ ...appData, tokenNumber: result.data.token_number } as any);
      router.push(`/success?id=${appData.id}`);
    } else {
      setIsBooking(false);
      toast({ variant: 'destructive', title: 'Failed', description: result.error });
    }
  };

  const checkIsPast = (slot: string) => {
    const now = new Date();
    const isToday = selectedDate === now.toISOString().split('T')[0];
    if (!isToday) return false;
    
    const [hourStr, minutePart] = slot.split(':');
    const [minuteStr, period] = minutePart.split(' ');
    let h = parseInt(hourStr);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    
    const slotTime = new Date();
    slotTime.setHours(h, parseInt(minuteStr), 0, 0);
    return slotTime < now;
  };

  if (isFetching) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>;
  if (!doc) return <div className="p-10 text-center font-black">Doctor not found</div>;

  const displayDateString = new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

  return (
    <div className="mobile-container pb-60 bg-slate-50 min-h-screen overflow-y-auto">
      <div className="bg-white p-4 flex items-center gap-4 sticky top-0 z-30 border-b border-border shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-full border border-border">
          <ChevronLeft className="h-6 w-6 text-slate-700" />
        </button>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Schedule Appointment</h1>
      </div>

      <div className="p-6 space-y-8">
        {showMockAlert && (
          <Alert className="bg-blue-50 border-blue-200 rounded-2xl mb-4">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-[10px] font-black uppercase text-blue-700">Payment Simulation</AlertTitle>
            <AlertDescription className="text-xs text-blue-600 font-medium">Processing mock transaction for prototype...</AlertDescription>
          </Alert>
        )}
        
        <Card className="border-border shadow-sm rounded-[1.5rem] overflow-hidden bg-white border-2">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="flex space-x-4">
                <div className="h-20 w-20 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden relative border border-border">
                  {doc.imageUrl ? <Image src={doc.imageUrl} alt={doc.name} fill className="object-cover" /> : <span className="text-3xl">🏥</span>}
                </div>
                <div className="space-y-0.5">
                  <h2 className="font-black text-slate-900 text-[13px] uppercase tracking-tight">{doc.name}</h2>
                  <p className="text-[11px] font-bold text-slate-500 leading-tight">
                    {doc.specialty} {doc.qualification ? `— ${doc.qualification}` : '— MBBS, MD'}
                  </p>
                  <div className="flex items-center text-[10px] font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200 w-fit">
                    <Star className="h-3 w-3 fill-yellow-600 mr-1" /> {doc.rating}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fee</p>
                <p className="text-base font-black text-slate-900 leading-none">₹{doc.fees}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[11px] font-bold text-slate-500">
              <MapPin className="h-3 w-3 mr-1 text-red-500 fill-red-500/20" />
              {doc.address}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Select Patient Profile</h3>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="h-8 text-[10px] font-black text-primary uppercase p-0">
                  <Plus className="h-3 w-3 mr-1" /> Add Family Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-border flex items-center justify-between">
                  <DialogTitle className="text-2xl font-black">Add Family Profile</DialogTitle>
                </DialogHeader>
                
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto scroll-hide">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-900 uppercase">Full Name <span className="text-red-500">*</span></Label>
                    <Input placeholder="Enter Name" value={newPatient.name || ''} onChange={e => setNewPatient({...newPatient, name: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-border font-bold" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Age <span className="text-red-500">*</span></Label>
                      <Input type="number" placeholder="Enter Age" value={newPatient.age || ''} onChange={e => setNewPatient({...newPatient, age: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-border font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Gender <span className="text-red-500">*</span></Label>
                      <Select value={newPatient.gender} onValueChange={v => setNewPatient({...newPatient, gender: v as any})}>
                        <SelectTrigger className="h-12 bg-slate-50 border-border rounded-xl font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {['Male', 'Female', 'Other'].map(g => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Height (cm) <span className="text-red-500">*</span></Label>
                      <Input type="number" placeholder="Height in cm" value={newPatient.height_cm || ''} onChange={e => setNewPatient({...newPatient, height_cm: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-border font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Weight (kg) <span className="text-red-500">*</span></Label>
                      <Input type="number" placeholder="Weight in kg" value={newPatient.weight_kg || ''} onChange={e => setNewPatient({...newPatient, weight_kg: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-border font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Blood Group <span className="text-red-500">*</span></Label>
                      <Select value={newPatient.blood_group} onValueChange={v => setNewPatient({...newPatient, blood_group: v})}>
                        <SelectTrigger className="h-12 bg-slate-50 border-border rounded-xl font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'].map(bg => (<SelectItem key={bg} value={bg}>{bg}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-900 uppercase">Relation <span className="text-red-500">*</span></Label>
                      <Select value={newPatient.relation} onValueChange={v => setNewPatient({...newPatient, relation: v})}>
                        <SelectTrigger className="h-12 bg-slate-50 border-border rounded-xl font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {['Spouse', 'Child', 'Parent', 'Sibling', 'Other'].map(rel => (<SelectItem key={rel} value={rel}>{rel}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-900 uppercase">Medical History</Label>
                    <Textarea placeholder="Any chronic illnesses, past surgeries..." value={newPatient.medicalHistory || ''} onChange={e => setNewPatient({...newPatient, medicalHistory: e.target.value})} className="rounded-xl bg-slate-50 border-border font-bold min-h-[80px]" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-900 uppercase">Allergies</Label>
                    <Textarea placeholder="Food, drug, or environmental allergies..." value={newPatient.allergies || ''} onChange={e => setNewPatient({...newPatient, allergies: e.target.value})} className="rounded-xl bg-slate-50 border-border font-bold min-h-[80px]" />
                  </div>
                </div>

                <DialogFooter className="px-6 py-5 border-t border-border bg-white">
                  <Button onClick={handleAddQuickPatient} disabled={isSavingPatient} className="w-full h-14 bg-primary font-black text-lg rounded-2xl">
                    {isSavingPatient ? <Loader2 className="animate-spin" /> : 'Confirm Profile'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-border font-bold">
              <SelectValue placeholder="Choose a patient" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 border-border shadow-xl">
              {displayPatients.map(p => (
                <SelectItem key={p.id} value={p.id} className="py-4 font-bold border-b last:border-0 border-slate-50">
                  {p.name} ({p.relation === 'Self' ? 'Self' : p.relation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Reason for Visit</h3>
          
          {doctorReasons && doctorReasons.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-5 rounded-[2rem] border-2 border-border shadow-sm">
                {doctorReasons.map((reason) => {
                  const isChecked = selectedReasons.includes(reason);
                  return (
                    <div 
                      key={reason} 
                      onClick={() => {
                        if (isChecked) {
                          setSelectedReasons(selectedReasons.filter(r => r !== reason));
                        } else {
                          setSelectedReasons([...selectedReasons, reason]);
                        }
                      }}
                      className={cn(
                        "flex items-center space-x-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer",
                        isChecked ? "bg-blue-50/50 border-primary text-slate-900" : "bg-slate-50/20 border-slate-100 hover:border-slate-200 text-slate-600"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                        isChecked ? "bg-primary border-primary text-white" : "border-slate-300"
                      )}>
                        {isChecked && <Check className="h-3 w-3 stroke-[3px]" />}
                      </div>
                      <span className="text-xs font-bold leading-tight">{reason}</span>
                    </div>
                  );
                })}

                {/* Other/Custom Checkbox */}
                <div 
                  onClick={() => setShowCustomSymptom(!showCustomSymptom)}
                  className={cn(
                    "flex items-center space-x-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer",
                    showCustomSymptom ? "bg-blue-50/50 border-primary text-slate-900" : "bg-slate-50/20 border-slate-100 hover:border-slate-200 text-slate-600"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                    showCustomSymptom ? "bg-primary border-primary text-white" : "border-slate-300"
                  )}>
                    {showCustomSymptom && <Check className="h-3 w-3 stroke-[3px]" />}
                  </div>
                  <span className="text-xs font-bold leading-tight">Other (Please describe)</span>
                </div>
              </div>

              {showCustomSymptom && (
                <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                  <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <Textarea 
                    placeholder="Briefly describe your current symptoms..." 
                    className="min-h-[100px] rounded-2xl bg-white border-2 border-border p-5 pl-12 font-bold placeholder:text-slate-300 focus:border-primary"
                    value={symptoms || ''}
                    onChange={e => setSymptoms(e.target.value)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <Textarea 
                placeholder="Briefly describe your current symptoms..." 
                className="min-h-[100px] rounded-2xl bg-white border-2 border-border p-5 pl-12 font-bold placeholder:text-slate-300 focus:border-primary"
                value={symptoms || ''}
                onChange={e => setSymptoms(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Select Date</h3>
          <div className="flex space-x-3 overflow-x-auto pb-4 scroll-hide -mx-6 px-6">
            {dayRange.map(day => (
              <div 
                key={day.fullDate} 
                onClick={() => { setSelectedDate(day.fullDate); setSelectedSlot(''); }}
                className={cn(
                  "min-w-[65px] py-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center",
                  selectedDate === day.fullDate ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-border text-slate-900"
                )}
              >
                <span className="text-[9px] font-black uppercase mb-1 opacity-60">{day.dayName}</span>
                <span className="text-base font-black">{day.dateNum}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Select Time Slot</h3>
          <div className="grid grid-cols-3 gap-3">
            {timeSlots.map(slot => {
              const isBooked = bookedSlots.includes(slot);
              const isPast = checkIsPast(slot);
              const isDisabled = isBooked || isPast;

              return (
                <button
                  key={slot}
                  disabled={isDisabled}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "py-3 rounded-xl font-black text-[10px] border-2 transition-all",
                    isDisabled ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60" :
                    selectedSlot === slot ? "bg-primary border-primary text-white" : "bg-white border-border text-slate-900"
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-orange-50 border-2 border-orange-100 rounded-3xl p-5 space-y-2">
          <div className="flex items-center space-x-2 text-orange-700">
            <AlertCircle className="h-5 w-5" />
            <h4 className="text-sm font-black uppercase tracking-tight">Booking Policy</h4>
          </div>
          <p className="text-xs font-bold text-orange-600 leading-relaxed">
            If you do not reach the clinic on <span className="text-slate-900 font-black">{displayDateString}</span>, your appointment will be automatically cancelled. Please arrive on time.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-border z-40 shadow-xl">
        <div className="max-w-[480px] mx-auto flex items-center gap-6">
          <div className="flex-1">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block">Total Fee</span>
            <span className="text-slate-900 text-2xl font-black">₹{doc.fees}</span>
          </div>
          <Button 
            className="h-14 px-10 text-lg font-black bg-primary rounded-2xl flex-1 shadow-lg shadow-primary/20" 
            disabled={!selectedSlot || !selectedPatientId || isBooking} 
            onClick={processPayment}
          >
            {isBooking ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>}>
      <BookingContent params={params} />
    </Suspense>
  );
}
