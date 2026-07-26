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
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Terms of Service</h1>
            <p className="text-slate-500 font-medium mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="text-slate-600 text-lg leading-relaxed space-y-8 pb-12">
          
          {/* Section 1 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">1. Acceptance of Terms</h3>
            <p className="mb-4">
              By downloading, accessing, or using the Doctivo application ("App"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these Terms, you must discontinue using the App immediately.
            </p>
            <p>
              Doctivo is a technology platform that facilitates appointment (parchee) bookings between patients and healthcare providers. Doctivo acts only as an intermediary and does not provide medical advice or healthcare services. Consultation fees and healthcare services are determined solely by the respective clinics and healthcare professionals in accordance with applicable laws and regulations.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">2. User Registration and Account Security</h3>
            <p className="mb-4">
              To use the App, you must register using a valid mobile number and complete verification through a One-Time Password (OTP).
            </p>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account and for all activities that occur under it. If you suspect any unauthorized access, suspicious activity, or security breach, you must notify Doctivo immediately.
            </p>
            <p>
              The App is intended solely for personal, lawful, and non-commercial healthcare management. Creation of multiple fake accounts, usage of virtual numbers, or providing false identities is strictly prohibited and will lead to immediate permanent ban without notice.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">3. Role of Doctivo and Medical Disclaimer</h3>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 text-orange-900 rounded-r-2xl my-4">
              <strong className="block text-xl mb-2">Important Medical Disclaimer:</strong> 
              Doctivo is NOT a healthcare provider, hospital, or a substitute for professional medical advice, diagnosis, or treatment. In case of a medical emergency, please visit the nearest hospital or call emergency services immediately. Doctivo assumes no responsibility for medical outcomes.
            </div>
            <ul className="list-disc pl-6 space-y-2 marker:text-blue-500">
              <li>We do not endorse any specific doctor, clinic, or medical treatment.</li>
              <li>Doctivo is not liable for any delay in consultation, doctor unavailability, misdiagnosis, or medical negligence by the healthcare provider.</li>
              <li>The live queue tracking feature is an estimated tool and may vary based on emergencies handled by the doctor. Doctivo is not liable for any delays in the actual waiting room.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">4. Bookings, Cancellations, and Anti-Fraud Policy</h3>
            <p className="mb-4">To ensure fair access to doctors and prevent exploitation of our platform, the following rules apply to all appointments:</p>
            <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
              <li><strong className="text-slate-800">No-Show Policy:</strong> If you book an appointment and fail to show up at the clinic ("No-Show") without canceling in advance, Doctivo reserves the right to suspend or permanently block your account.</li>
              <li><strong className="text-slate-800">Spam Bookings:</strong> Users found making repeated fake bookings, hoarding appointment slots, or booking slots with the intent to resell them will face immediate legal action and account termination.</li>
              <li><strong className="text-slate-800">Cancellations:</strong> Appointments must be canceled at least 2 hours prior to the scheduled time. Frequent cancellations may trigger automatic restrictions on your account.</li>
              <li><strong className="text-slate-800">Doctor Cancellations:</strong> Clinics reserve the right to cancel or reschedule appointments due to emergencies. Doctivo will attempt to notify you, but holds no liability for such cancellations.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">5. Payments, Fees, and Refunds</h3>
            <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
              <li><strong className="text-slate-800">Platform Fees:</strong> Doctivo may charge a non-refundable platform convenience fee for facilitating the booking. This fee is independent of the doctor's consultation charge.</li>
              <li><strong className="text-slate-800">Consultation Fees:</strong> Any advance consultation fees collected via the App are directly processed for the clinic. Doctivo does not determine consultation pricing.</li>
              <li><strong className="text-slate-800">Refunds:</strong> If an appointment is canceled by the clinic, or canceled by the user within the permissible timeframe, the consultation amount (excluding platform/payment gateway fees) will be refunded to the original payment method within 5-7 business days.</li>
              <li><strong className="text-slate-800">Payment Disputes:</strong> Users attempting to initiate fraudulent chargebacks via their bank for successfully completed consultations will be permanently banned and reported to authorities.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">6. Prohibited Activities</h3>
            <p className="mb-4">You strictly agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-blue-500">
              <li>Use the App to generate fake medical certificates, fake prescriptions, or solicit illegal drugs.</li>
              <li>Use bots, scrapers, or automated scripts to extract data, doctor details, or manipulate the booking queue.</li>
              <li>Harass, abuse, or threaten doctors, clinic staff, or Doctivo customer support executives.</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Doctivo application.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">7. Limitation of Liability & Indemnification</h3>
            <p className="mb-4">
              To the maximum extent permitted by law, Doctivo and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the platform.
            </p>
            <p>
              You agree to indemnify and hold Doctivo harmless from any claims, disputes, legal fees, or demands arising out of your breach of these Terms, your misuse of the platform, or any dispute you have with a doctor/clinic.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">8. Account Termination</h3>
            <p>
              Doctivo reserves the sole right to instantly suspend, deactivate, or delete any user account at any time, without prior notice or liability, for conduct that we believe violates these Terms, is harmful to other users, clinics, or our business interests, or for any suspicion of fraud.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">9. Governing Law and Jurisdiction</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any legal disputes, claims, or controversies arising out of or relating to this platform shall be subject to the exclusive jurisdiction of the competent courts in <strong>Gorakhpur, Uttar Pradesh</strong>.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h3 className="text-xl font-black text-slate-800 pb-2">10. Modifications to Terms</h3>
            <p>
              We reserve the right to update or modify these Terms of Service at any time without prior notice. Continued use of the App after such modifications constitutes your formal acceptance of the updated Terms.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
