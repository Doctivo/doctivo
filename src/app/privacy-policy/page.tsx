'use client';
import { ArrowLeft, Lock, UserCheck, Share2, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-blue-600 font-bold transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-12">
        <div className="mb-12">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-lg text-slate-500 font-medium">Last updated: July 2026</p>
        </div>

        <div className="space-y-8 text-slate-600 font-medium leading-relaxed">
          
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <UserCheck className="h-6 w-6 text-emerald-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">1. Information We Collect</h2>
            </div>
            <p className="mb-4">
              To provide you with seamless healthcare services, Doctivo collects essential information when you register and use our platform. This includes:
            </p>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li><strong>Personal Data:</strong> Your name, phone number, email address, and date of birth.</li>
              <li><strong>Medical Data:</strong> Symptoms, past medical history, and prescriptions (only shared securely with your selected doctors).</li>
              <li><strong>Technical Data:</strong> Device type, IP address, and app usage analytics to improve our services.</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <Server className="h-6 w-6 text-purple-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">2. How We Use Your Data</h2>
            </div>
            <p>
              Your privacy is our priority. We use your data strictly to:
            </p>
            <ul className="space-y-2 list-disc list-inside ml-2 mt-4">
              <li>Facilitate appointment bookings and connect you with healthcare professionals.</li>
              <li>Send critical notifications like booking confirmations, delays, or prescription updates.</li>
              <li>Improve platform security and prevent fraudulent activities.</li>
              <li>Provide personalized medical recommendations based on your profile (optional).</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <Share2 className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">3. Data Sharing & Security</h2>
            </div>
            <p className="mb-4">
              <strong>We do not sell your personal or health data to third-party marketers.</strong>
            </p>
            <p>
              Your data is only shared with the specific doctors or clinics you choose to book with. All data is encrypted both in transit and at rest using industry-standard security protocols to ensure it remains confidential and protected against unauthorized access.
            </p>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Your Rights</h2>
            <p>
              You have the right to request access to the personal data we hold about you. You can also request the deletion of your account and associated data at any time from the app settings. Please note that certain basic records may be retained for legal and compliance purposes.
            </p>
          </section>

          <p className="text-sm text-slate-400 text-center mt-12">
            By using Doctivo, you consent to the data practices described in this Privacy Policy. For any privacy-related concerns, please contact our support team.
          </p>

        </div>
      </div>
    </div>
  );
}
