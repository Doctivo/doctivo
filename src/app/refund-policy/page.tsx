import { ArrowLeft, ShieldCheck, Clock, CreditCard, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RefundPolicy() {
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
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">Refund & Cancellation Policy</h1>
          <p className="text-lg text-slate-500 font-medium">Last updated: July 2026</p>
        </div>

        <div className="space-y-12">
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-green-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">1. Patient Cancellations</h2>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium mb-4">
              We understand that plans can change. To ensure a smooth process for both you and our doctors, we have a clear cancellation window:
            </p>
            <ul className="space-y-3 mt-4 text-slate-600 font-medium">
              <li className="flex items-start">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-2 mr-3 shrink-0"></div>
                <span><strong>100% Refund:</strong> If you cancel your appointment at least <strong>2 hours</strong> before the scheduled time, you are eligible for a full refund.</span>
              </li>
              <li className="flex items-start">
                <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 mr-3 shrink-0"></div>
                <span><strong>No Refund:</strong> Cancellations made less than 2 hours before the appointment time are not eligible for a refund, as the doctor's time slot has already been reserved.</span>
              </li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">2. Doctor Cancellations & No-Shows</h2>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium mb-4">
              In rare circumstances, a doctor might be unavailable due to emergencies.
            </p>
            <ul className="space-y-3 mt-4 text-slate-600 font-medium">
              <li className="flex items-start">
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 shrink-0"></div>
                <span><strong>Doctor Cancellation:</strong> If the doctor cancels your appointment, you will automatically receive a <strong>100% refund</strong>, or you can choose to reschedule for free.</span>
              </li>
              <li className="flex items-start">
                <div className="h-2 w-2 bg-slate-400 rounded-full mt-2 mr-3 shrink-0"></div>
                <span><strong>Patient No-Show:</strong> If you fail to visit the clinic or attend the online consultation at the scheduled time without prior cancellation, the booking amount is non-refundable.</span>
              </li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <CreditCard className="h-6 w-6 text-purple-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">3. Refund Processing Time</h2>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              All approved refunds are automatically processed back to your original payment method (UPI, Credit/Debit Card, or Netbanking). 
              Please allow <strong>5 to 7 business days</strong> for the amount to reflect in your bank account, depending on your bank's processing speed.
            </p>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-4">
              <XCircle className="h-6 w-6 text-red-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">4. Non-Refundable Services</h2>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Convenience fees, internet handling charges, or platform fees (if applicable and explicitly mentioned during checkout) are strictly non-refundable under any circumstances.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
