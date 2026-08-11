'use client';

import { use, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ChevronLeft, Star, MapPin, Loader2, Award, Briefcase, Info 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { createAppointment, getBookedSlots, rescheduleAppointment } from '@/app/actions/appointment-actions';
import { getDoctorById } from '@/app/actions/doctor-actions';
import { getFamilyMembers } from '@/app/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import { Doctor } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

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
  const searchParams = useSearchParams();
  const rescheduleAppId = searchParams?.get('reschedule');
  const patients = useStore(state => state.patients);
  const setPatientsStore = useStore(state => state.setPatients);
  const addAppointmentStore = useStore(state => state.addAppointment);
  const user = useStore(state => state.user);
  const { toast } = useToast();

  const [doc, setDoc] = useState<Doctor | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [showCustomSymptom, setShowCustomSymptom] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [bypassTxnId, setBypassTxnId] = useState<string | null>(null);

  const getNext7Days = () => {
    const dates = [];
    const now = new Date();
    const isRestricted = doc?.stops_booking_at_midnight === true;
    const startOffset = isRestricted ? 1 : 0;
    
    for (let i = startOffset; i < startOffset + 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        fullDate: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate()
      });
    }
    return dates;
  };

  useEffect(() => {
    async function load() {
      const data = await getDoctorById(id);
      setDoc(data);
      
      const isRestricted = data?.stops_booking_at_midnight === true;
      const startOffset = isRestricted ? 1 : 0;
      
      const firstValidDate = new Date();
      firstValidDate.setDate(firstValidDate.getDate() + startOffset);
      const firstValidDateStr = firstValidDate.toISOString().split('T')[0];

      if (selectedDate < firstValidDateStr) {
        setSelectedDate(firstValidDateStr);
        return; // Effect will re-run with the updated selectedDate
      }

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

  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [tempAge, setTempAge] = useState('');
  const [tempGender, setTempGender] = useState<string>('Male');

  const processPayment = async () => {
    const patient = patients.find(p => p.id === selectedPatientId) || user;
    if (!patient?.age || !patient?.gender) {
      setShowCompleteProfile(true);
      return;
    }
    setIsBooking(true);

    if (bypassTxnId) {
      finalizeBooking(bypassTxnId, patient);
      return;
    }
    
    if (rescheduleAppId) {
      const res = await rescheduleAppointment(rescheduleAppId, selectedDate, selectedSlot);
      if (res.success) {
        toast({ title: 'Success', description: 'Appointment rescheduled successfully.' });
        router.push('/appointments');
      } else {
        toast({ variant: 'destructive', title: 'Failed', description: res.error || 'Failed to reschedule.' });
      }
      setIsBooking(false);
      return;
    }
    
    try {
      // 1. Create order on backend
      const resOrder = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: (doc?.fees || 0) * 100 }), // amount in paise
      });
      const orderData = await resOrder.json();

      if (!resOrder.ok) {
        setIsBooking(false);
        toast({ variant: 'destructive', title: 'Order Failed', description: orderData.error || 'Failed to create payment order.' });
        return;
      }

      // Load Razorpay Script
      const resScript = await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!resScript || !(window as any).Razorpay) {
        setIsBooking(false);
        toast({ variant: 'destructive', title: 'Script Error', description: 'Failed to load Razorpay checkout script.' });
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', 
        amount: orderData.amount, 
        currency: orderData.currency,
        name: "Doctivo Medical",
        description: "Consultation Fee",
        order_id: orderData.order_id, // Pass order ID generated from backend
        handler: async function (response: any) {
          setIsBooking(true);
          
          // 3. Verify Signature on backend
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok && verifyData.success) {
              // Signature matches, finalize booking
              finalizeBooking(response.razorpay_payment_id, patient);
            } else {
              setIsBooking(false);
              toast({ variant: 'destructive', title: 'Verification Failed', description: verifyData.error || 'Payment verification failed' });
            }
          } catch (err) {
            setIsBooking(false);
            toast({ variant: 'destructive', title: 'Error', description: 'Error verifying payment signature' });
          }
        },
        prefill: {
          name: patient?.name || user?.name || '',
          contact: patient?.phone || user?.phone || '',
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: function() {
            setIsBooking(false);
          }
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        setIsBooking(false);
        toast({ variant: 'destructive', title: 'Payment Failed', description: response.error.description });
      });
      rzp.open();

    } catch (err) {
      setIsBooking(false);
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred during payment initiation.' });
    }
  };

  const finalizeBooking = async (txnId: string, patient: any) => {
    if (!doc || !user) return;
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
      setBypassTxnId(null);
    } else {
      setIsBooking(false);
      setBypassTxnId(txnId);
      toast({ variant: 'destructive', title: 'Booking Failed', description: res.error + ' (Your payment was successful. Please select a different slot and try again to book without paying.)' });
    }
  };

  const handleUpdateProfile = () => {
    if (!tempAge || !tempGender) {
      toast({ variant: 'destructive', title: 'Required', description: 'Please provide age and gender.' });
      return;
    }
    
    // Update local store so patient has it (simulate save)
    const patient = patients.find(p => p.id === selectedPatientId) || user;
    if (patient) {
      patient.age = tempAge;
      patient.gender = tempGender as any;
    }
    setShowCompleteProfile(false);
    
    // Now trigger payment automatically
    processPayment();
  };

  if (isFetching) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  if (!doc) return <div className="p-10 text-center">Doctor not found</div>;

  return (
    <div className="mobile-container pb-60 bg-slate-50 dark:bg-slate-950 min-h-screen overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 p-4 flex items-center justify-between sticky top-0 z-30 border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full border border-border">
            <ChevronLeft className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          </button>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Doctor Details</h1>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <Card className="border-border dark:border-slate-800 shadow-sm rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 border-2">
          <CardContent className="p-8 space-y-6">
            <div className="flex space-x-6">
              <div className="h-24 w-24 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative border-2 border-slate-100 dark:border-slate-700">
                {doc.imageUrl ? <Image priority src={doc.imageUrl} alt={doc.name} fill className="object-cover" /> : <span className="text-4xl">🏥</span>}
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="font-black text-slate-900 dark:text-slate-100 text-xl uppercase tracking-tight">{doc.name}</h2>
                <p className="text-sm font-bold text-primary uppercase tracking-widest">{doc.specialty}</p>
                <div className="flex items-center text-[11px] font-black text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2.5 py-1 rounded-full border border-yellow-200 dark:border-yellow-900/50 w-fit">
                  <Star className="h-3 w-3 fill-yellow-600 mr-1" /> {doc.rating} Rating
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Award className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Education</p><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{doc.qualification || 'MBBS, MD'}</p></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center"><Briefcase className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Experience</p><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{doc.experience}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50 rounded-2xl">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-700 dark:text-blue-300 font-black text-xs uppercase tracking-widest">Arrival Instruction</AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs font-bold">
            Please arrive at least 10 minutes prior to your selected slot on <strong>{selectedDate}</strong> for smooth check-in.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 px-1">Select Patient</h3>
          <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="w-full h-14 rounded-2xl bg-white dark:bg-slate-900 dark:text-slate-100 border-2 border-slate-100 dark:border-slate-800 px-4 font-bold outline-none focus:border-primary/50">
            <option value="">Select a profile</option>
            {patients.map(p => <option key={p.id} value={p.id} className="bg-white dark:bg-slate-800">{p.name} ({p.relation})</option>)}
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
                  selectedReasons.includes(reason) ? "bg-primary border-primary text-white" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                )}
              >
                {reason}
              </button>
            ))}
            <button 
              onClick={() => setShowCustomSymptom(!showCustomSymptom)}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold border-2 border-dashed", showCustomSymptom ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700" : "border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500")}
            >
              + Other
            </button>
          </div>
          {showCustomSymptom && (
            <Textarea 
              placeholder="Describe your symptoms briefly..." 
              value={symptoms} 
              onChange={e => setSymptoms(e.target.value)} 
              className="mt-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold"
            />
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 px-1">Select Date</h3>
          {doc?.stops_booking_at_midnight && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2.5 rounded-xl text-xs font-bold">
              please book next day oppointment till 11:59pm
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {getNext7Days().map((d) => (
              <button 
                key={d.fullDate} 
                onClick={() => { setSelectedDate(d.fullDate); setSelectedSlot(''); }}
                className={cn(
                  "min-w-[70px] h-20 rounded-2xl flex flex-col items-center justify-center font-black border-2 transition-all shrink-0",
                  selectedDate === d.fullDate 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/30" 
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <span className="text-[10px] uppercase tracking-widest opacity-80">{d.dayName}</span>
                <span className={cn("text-xl mt-1", selectedDate === d.fullDate ? "text-white" : "text-slate-800 dark:text-slate-200")}>{d.dayNumber}</span>
              </button>
            ))}
          </div>
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
                    isBooked ? "bg-slate-100 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed line-through" :
                    selectedSlot === slot ? "bg-primary border-primary text-white" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t border-border dark:border-slate-800 z-40 shadow-xl">
        <div className="max-w-[480px] mx-auto space-y-4">
          <div className="flex items-start space-x-3 px-1">
            <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)} className="mt-1" />
            <label htmlFor="terms" className="text-[11px] text-slate-500 font-medium leading-tight">
              I agree to the <Link href="/privacy-policy" className="text-primary hover:underline font-bold">Privacy Policy</Link>, <Link href="/terms" className="text-primary hover:underline font-bold">Terms & Conditions</Link>, and <Link href="/refund-policy" className="text-primary hover:underline font-bold">Refund Policy</Link>.
            </label>
          </div>
          <div className="flex items-center gap-6">
            {!rescheduleAppId && (
              <div className="flex-1"><span className="text-slate-400 text-[10px] font-black block">FEES</span><span className="text-slate-900 dark:text-slate-100 text-2xl font-black">₹{doc.fees}</span></div>
            )}
            <Button className="h-14 px-10 text-lg font-black bg-primary rounded-2xl flex-1" disabled={!selectedSlot || !selectedPatientId || !acceptedTerms || isBooking} onClick={processPayment}>
              {isBooking ? <Loader2 className="animate-spin" /> : rescheduleAppId ? 'Confirm Reschedule' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showCompleteProfile} onOpenChange={setShowCompleteProfile}>
        <DialogContent className="max-w-[90vw] rounded-[2.5rem] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 text-center">Complete Your Profile</DialogTitle>
            <p className="text-xs text-slate-500 font-bold text-center mt-2">
              Age and gender are required to book this appointment for better diagnosis.
            </p>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Age <span className="text-red-500">*</span></Label>
              <Input 
                type="number" 
                placeholder="Enter Age" 
                className="h-14 rounded-xl bg-slate-50 border-border font-bold"
                value={tempAge} 
                onChange={(e) => setTempAge(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-900 ml-1 uppercase tracking-widest">Gender <span className="text-red-500">*</span></Label>
              <Select value={tempGender} onValueChange={setTempGender}>
                <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-border font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {['Male', 'Female', 'Other'].map(g => (
                    <SelectItem key={g} value={g} className="font-bold">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button className="w-full h-14 bg-primary text-white font-black text-lg rounded-xl shadow-lg" onClick={handleUpdateProfile}>
              Save & Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Suspense><BookingContent id={id} /></Suspense>;
}
