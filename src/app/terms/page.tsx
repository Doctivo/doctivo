'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsAndConditions() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:bg-transparent hover:text-blue-600 font-bold text-slate-500">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-12 md:pt-20">
        <div className="flex items-center space-x-4 mb-8">
          <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Terms and Conditions</h1>
            <p className="text-slate-500 font-medium mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="text-slate-600 text-lg leading-relaxed space-y-6">
          <p className="text-slate-800 font-medium">
            Welcome to Doctivo! These Terms and Conditions outline the rules and regulations for the use of Doctivo's Website and Mobile Application, located in Gorakhpur, UP.
          </p>
          <p>
            By accessing this app, we assume you accept these terms and conditions. Do not continue to use Doctivo if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h3 className="text-xl font-black text-slate-800 pt-6">1. Services Provided</h3>
          <p>
            Doctivo acts as a technology platform connecting patients with doctors, clinics, and physiotherapists in Gorakhpur. 
            We facilitate appointment booking, token generation, and live queue tracking. 
          </p>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 text-orange-900 rounded-r-2xl my-8">
            <strong className="block text-xl mb-2">Important Medical Disclaimer:</strong> 
            Doctivo is NOT a substitute for professional medical advice, diagnosis, or treatment. In case of a medical emergency, please visit the nearest hospital or call emergency services immediately. Doctivo does not provide emergency services.
          </div>

          <h3 className="text-xl font-black text-slate-800 pt-6">2. User Accounts</h3>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li>You must provide accurate, complete, and current information when creating an account.</li>
            <li>You are responsible for safeguarding the password/OTP that you use to access the service.</li>
            <li>You agree not to disclose your password to any third party and to notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
          </ul>

          <h3 className="text-xl font-black text-slate-800 pt-6">3. Appointment Booking and Cancellation</h3>
          <p>
            When you book an appointment through Doctivo, you are reserving a slot with the respective doctor.
          </p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li><strong className="text-slate-800">Booking Fees:</strong> A nominal platform fee or advance consultation fee may be charged at the time of booking to confirm your slot.</li>
            <li><strong className="text-slate-800">Cancellations:</strong> You may cancel your appointment through the app up to 2 hours before the scheduled time.</li>
            <li><strong className="text-slate-800">Refunds:</strong> If a booking is cancelled within the allowed time frame, or if the doctor cancels the appointment, the paid amount will be refunded to your original payment method within 5-7 business days. Platform convenience fees (if any) are non-refundable.</li>
          </ul>

          <h3 className="text-xl font-black text-slate-800 pt-6">4. Acceptable Use</h3>
          <p>You agree not to use the application in any way that causes, or may cause, damage to the application or impairment of the availability or accessibility of the application. You must not use our app for any unlawful, illegal, fraudulent, or harmful purpose.</p>

          <h3 className="text-xl font-black text-slate-800 pt-6">5. Limitation of Liability</h3>
          <p>
            In no event shall Doctivo, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li>Your access to or use of or inability to access or use the Service;</li>
            <li>Any conduct or content of any third party on the Service;</li>
            <li>Any medical outcome or consequence of visiting a doctor booked through the platform.</li>
          </ul>

          <h3 className="text-xl font-black text-slate-800 pt-6">6. Changes to Terms</h3>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </div>
      </div>
    </div>
  );
}
