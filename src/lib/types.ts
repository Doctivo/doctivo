export type Gender = 'Male' | 'Female' | 'Other';
export type Severity = 'Mild' | 'Moderate' | 'Severe';

export interface Patient {
  id: string;
  name: string;
  age: string;
  gender: Gender;
  relation: string;
  imageUrl?: string; 
  phone?: string; 
  secondaryPhone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  currentSymptoms?: string;
  symptomsDuration?: string;
  symptomsSeverity?: Severity;
  medicalHistory: string;
  pastSurgeries?: string;
  allergies: string;
  currentMedications?: string;
  height_cm: string;
  weight_kg: string;
  blood_group: string;
  state?: string;
  city?: string;
  area?: string;
  pincode?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification?: string;
  rating: number;
  fees: number;
  location: string;
  address: string;
  experience: string;
  imageUrl: string; 
  availableSlots: string[];
  startTime: string; 
  endTime: string;   
  slotDuration: number; 
  workingDays?: string[]; 
  customSchedule?: any;
  categoryIcon?: string;
  schedule?: any;
  reasonsForVisit?: string[];
  latitude?: number;
  longitude?: number;
  distance?: number;
  consultationModes?: string;
}

export interface UserProfile extends Patient {
  phone: string;
  isProfileComplete?: boolean;
}

export interface AdminPermissions {
  dashboard: { view: boolean; view_financials: boolean };
  doctors: { view: boolean; approve: boolean; suspend: boolean };
  bookings: { view: boolean; modify: boolean };
  payroll: { view: boolean; adjust: boolean; settle: boolean };
  exporter: { allow_export: boolean };
}

export interface AdminProfile {
  admin_id: string;
  full_name: string;
  email: string;
  role: string;
  permissions: AdminPermissions;
  doctor_id?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  patientType: 'Self' | 'Family_Member';
  patientAge?: string;
  patientGender?: string;
  patientBloodGroup?: string;
  date: string;
  time: string;
  consultation_fee_amount: number;
  payment_status: 'Paid' | 'Pending';
  transaction_id: string;
  status: 'Confirmed' | 'Cancelled' | 'Completed' | 'Waiting' | 'In Consultation' | 'Missed';
  tokenNumber?: number;
  current_symptoms?: string;
  payment_mode?: string;
  visit_otp?: string;
}
