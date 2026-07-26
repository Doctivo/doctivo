'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RefundPolicy() {
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
            <RefreshCcw className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Refund Policy</h1>
            <p className="text-slate-500 font-medium mt-1">Last updated: July 2026</p>
          </div>
        </div>

        <div className="text-slate-600 text-lg leading-relaxed space-y-6">
          <h3 className="text-xl font-black text-slate-800 pt-6">1. Appointment Cancellation</h3>
          <p>
            Patients may cancel or reschedule a booked appointment up to 1 hour before the scheduled appointment time through the Doctivo application.
          </p>
          <p>
            Cancellations made less than 1 hour before the scheduled appointment may not be eligible for a refund of any booking or facilitation fee, depending on the clinic's or healthcare provider's cancellation policy.
          </p>

          <h3 className="text-xl font-black text-slate-800 pt-6">2. Refund Eligibility</h3>
          <p className="font-bold text-slate-800">Refunds may be issued in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-3 marker:text-blue-500">
            <li>The doctor or clinic cancels the scheduled appointment.</li>
            <li>A technical error results in duplicate or incorrect payment.</li>
            <li>A medicine order is cancelled before it has been dispatched by the pharmacy.</li>
            <li>A payment is successfully charged but the appointment is not confirmed due to a technical error.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
