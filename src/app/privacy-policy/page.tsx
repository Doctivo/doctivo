'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Privacy Policy</h1>
            <p className="text-slate-500 font-medium mt-1">Last updated: July 2026</p>
          </div>
        </div>

        <div className="text-slate-600 text-lg leading-relaxed space-y-6">
          <h3 className="text-xl font-black text-slate-800 pt-6">1. Overview & Information Collection</h3>
          <p>
            Doctivo operates the Doctivo mobile application and provides digital healthcare services, including appointment booking, health record management, and related features.
          </p>
          <p>
            Your privacy is important to us. We collect and use your personal information only to provide, maintain, improve, and secure our services. By using the Doctivo app, you consent to the collection and use of your information in accordance with this Privacy Policy.
          </p>
          <p className="font-bold text-slate-800 mt-4">The information we may collect includes:</p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li>Mobile number (for OTP verification and account security)</li>
            <li>Basic profile information (such as your name and age, if provided)</li>
            <li>Appointment details and selected healthcare provider information</li>
            <li>Health records and medical documents that you voluntarily upload</li>
            <li>Device and usage information necessary for security, analytics, and app performance</li>
          </ul>
          <p>
            We collect only the information necessary to provide our services and comply with applicable laws. Your personal information is not sold to third parties.
          </p>

          <h3 className="text-xl font-black text-slate-800 pt-6">2. Mobile App Permissions</h3>
          <p>
            To provide a seamless healthcare experience, DOCTIVO requests certain device permissions. These permissions are used only for the purposes described below:
          </p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li><strong className="text-slate-800">Location (Approximate or Precise):</strong> Used to help you find nearby doctors, clinics, and hospitals based on your selected city or current location.</li>
            <li><strong className="text-slate-800">Camera and Storage (Photos/Media/Files):</strong> Used to capture, upload, and manage documents such as prescriptions, medical records, and profile images.</li>
            <li><strong className="text-slate-800">Notifications:</strong> Used to send important updates, including appointment confirmations, reminders, token queue updates, and changes to your booking status.</li>
          </ul>
          <p>
            We request only the permissions necessary to provide these features. You can manage or revoke app permissions at any time through your device settings, although doing so may limit certain app functionalities.
          </p>

          <h3 className="text-xl font-black text-slate-800 pt-6">3. Data Security & Transmission</h3>
          <p>
            We take reasonable measures to protect your personal information. All data transmitted between the Doctivo app and our servers, including login tokens, location data, and uploaded prescriptions, is encrypted using secure HTTPS/TLS protocols.
          </p>
          <p>
            Your medical records and uploaded documents are stored in secure cloud infrastructure with appropriate access controls. We do not sell or share your personal information with unauthorized third parties. Data may only be shared with healthcare providers or service providers as necessary to deliver the services, or when required by applicable law.
          </p>

          <h3 className="text-xl font-black text-slate-800 pt-6">4. Account & Data Deletion</h3>
          <p>
            Users may request the deletion of their account and associated personal data at any time through the app by navigating to Profile &gt; Settings &gt; Delete Account.
          </p>
          <p>
            For security purposes, account deletion is confirmed using a one-time password (OTP). Once verified, your personal information, including your name, mobile number, email address (if provided), profile details, and uploaded documents, will be permanently deleted or anonymized within 30 days.
          </p>
          <p>
            Please note that certain information, such as appointment records, transaction logs, and other data required for legal, regulatory, audit, fraud prevention, or accounting purposes, may be retained for the period required by applicable laws. After the applicable retention period expires, such data will be securely deleted or anonymized.
          </p>
        </div>
      </div>
    </div>
  );
}
