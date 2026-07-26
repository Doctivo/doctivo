import { ArrowLeft, FileText, Scale, AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/home" className="flex items-center text-slate-500 hover:text-blue-600 font-bold transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-12">
        <div className="mb-12">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <FileText className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">Terms & Conditions</h1>
          <p className="text-lg text-slate-500 font-medium">Last updated: July 2026</p>
        </div>

        <div className="space-y-8 text-slate-600 font-medium leading-relaxed">
          
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">1. Acceptance of Terms</h2>
            </div>
            <p>
              By accessing and using the Doctivo application or website, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our platform.
            </p>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">2. Doctivo's Role (No Medical Liability)</h2>
            </div>
            <p className="mb-4">
              <strong>Doctivo is a Technology Platform, not a Medical Provider.</strong>
            </p>
            <p>
              Our platform exists solely to connect patients with independent healthcare professionals and clinics. We do not provide medical advice, diagnosis, or treatment. 
              <strong> Doctivo and its founders are not liable for any medical decisions, malpractice, incorrect diagnosis, or treatments prescribed by the doctors booked through our platform.</strong> The doctor-patient relationship is strictly between you and the healthcare provider.
            </p>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-purple-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">3. User Responsibilities</h2>
            </div>
            <p className="mb-4">
              As a user of Doctivo, you agree to:
            </p>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li>Provide accurate and truthful information during registration and booking.</li>
              <li>Attend appointments on time or cancel them within the permitted timeframe.</li>
              <li>Treat doctors, clinic staff, and our support team with respect. Abusive behavior will lead to permanent account suspension.</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Payments & Appointments</h2>
            <p>
              When you book an appointment, the specified fee is collected securely through our payment partners. Appointment timings are approximate; doctors may experience delays due to emergencies or preceding complex cases. We request your patience in such scenarios.
            </p>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Modifications to the Terms</h2>
            <p>
              We reserve the right to update these terms at any time. Changes will be effective immediately upon posting on this page. Your continued use of the platform after any changes signifies your acceptance of the new terms.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
