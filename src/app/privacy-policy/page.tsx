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
            <p className="text-slate-500 font-medium mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="text-slate-600 text-lg leading-relaxed space-y-6">
          <p className="text-slate-800 font-medium">
            At Doctivo, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application or website to book doctor appointments in Gorakhpur.
          </p>

          <h3 className="text-xl font-black text-slate-800 pt-6">1. Information We Collect</h3>
          <p>
            We may collect information about you in a variety of ways. The information we may collect via the Application includes:
          </p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li><strong className="text-slate-800">Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests.</li>
            <li><strong className="text-slate-800">Medical Information:</strong> To facilitate appointments, we may collect symptoms, past medical history, current medications, and allergies as provided by you.</li>
            <li><strong className="text-slate-800">Financial Data:</strong> Data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Application. (Payments are securely processed via Razorpay).</li>
          </ul>

          <h3 className="text-xl font-black text-slate-800 pt-6">2. Use of Your Information</h3>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:</p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li>Create and manage your account.</li>
            <li>Process your doctor appointment bookings and payments.</li>
            <li>Send you reminders for upcoming appointments (via SMS/WhatsApp).</li>
            <li>Improve app performance and analyze user trends.</li>
            <li>Respond to customer service requests and support needs.</li>
          </ul>

          <h3 className="text-xl font-black text-slate-800 pt-6">3. Disclosure of Your Information</h3>
          <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li><strong className="text-slate-800">By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
            <li><strong className="text-slate-800">To Doctors/Clinics:</strong> We share your booking details, name, and basic medical history with the doctor you have booked an appointment with to ensure proper treatment.</li>
            <li><strong className="text-slate-800">Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing (Razorpay), data analysis, email delivery, hosting services, and customer service.</li>
          </ul>

          <h3 className="text-xl font-black text-slate-800 pt-6">4. Data Security</h3>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </p>

          <div className="bg-slate-100 p-8 rounded-[2rem] mt-10">
            <h3 className="text-xl font-black text-slate-800 mb-4">5. Contact Us</h3>
            <p className="text-slate-600 mb-2">If you have questions or comments about this Privacy Policy, please contact us at:</p>
            <p className="font-bold text-slate-800">Email: <span className="text-blue-600 font-medium">support@doctivo.com</span></p>
            <p className="font-bold text-slate-800">Address: <span className="text-slate-600 font-medium">Doctivo Inc., Gorakhpur, Uttar Pradesh, India</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
