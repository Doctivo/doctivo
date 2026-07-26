import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/">
            <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-blue-600">
              <ArrowLeft className="h-5 w-5 mr-2" /> Back to Home
            </Button>
          </Link>
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

        <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-600">
          <p>
            At Doctivo, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application or website to book doctor appointments in Gorakhpur.
          </p>

          <h3>1. Information We Collect</h3>
          <p>
            We may collect information about you in a variety of ways. The information we may collect via the Application includes:
          </p>
          <ul>
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests.</li>
            <li><strong>Medical Information:</strong> To facilitate appointments, we may collect symptoms, past medical history, current medications, and allergies as provided by you.</li>
            <li><strong>Financial Data:</strong> Data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Application. (Payments are securely processed via Razorpay).</li>
          </ul>

          <h3>2. Use of Your Information</h3>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:</p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Process your doctor appointment bookings and payments.</li>
            <li>Send you reminders for upcoming appointments (via SMS/WhatsApp).</li>
            <li>Improve app performance and analyze user trends.</li>
            <li>Respond to customer service requests and support needs.</li>
          </ul>

          <h3>3. Disclosure of Your Information</h3>
          <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
          <ul>
            <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
            <li><strong>To Doctors/Clinics:</strong> We share your booking details, name, and basic medical history with the doctor you have booked an appointment with to ensure proper treatment.</li>
            <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing (Razorpay), data analysis, email delivery, hosting services, and customer service.</li>
          </ul>

          <h3>4. Data Security</h3>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </p>

          <h3>5. Contact Us</h3>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at: <br/>
            <strong>Email:</strong> support@doctivo.com <br/>
            <strong>Address:</strong> Doctivo Inc., Gorakhpur, Uttar Pradesh, India
          </p>
        </div>
      </div>
    </div>
  );
}
