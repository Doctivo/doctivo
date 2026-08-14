'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, MessageCircle, PhoneCall, Mail, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function SupportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    { q: 'How do I cancel my appointment?', a: 'Go to the Bookings section, tap on your upcoming appointment, and click "Cancel Booking".' },
    { q: 'When will I get my refund?', a: 'Refunds for cancelled appointments are processed automatically within 3-5 business days.' },
    { q: 'How do I download my ticket?', a: 'Tickets can be downloaded from the "My Downloads" section or directly from the Booking details popup.' }
  ];

  const handleWhatsApp = () => {
    window.open('https://wa.me/7307986604?text=Hi%20Doctivo%20Support,%20I%20need%20help', '_blank');
  };

  const handleCall = () => {
    window.open('tel:+917307986604', '_self');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ name: '', email: '', message: '' });
      toast({ title: 'Success', description: 'Your message has been sent successfully!' });
    }, 1000);
  };

  return (
    <div className="mobile-container pb-12 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 pt-10 flex items-center border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-3 h-10 w-10 rounded-full hover:bg-slate-50">
          <ArrowLeft className="h-5 w-5 text-slate-700" />
        </Button>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Help & Support</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
            24/7 Assistance
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <HelpCircle className="h-10 w-10 text-blue-200 mb-4" />
          <h2 className="text-2xl font-black leading-tight mb-2">How can we help you today?</h2>
          <p className="text-blue-100 text-sm font-medium">Our support team is available around the clock.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card onClick={handleWhatsApp} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md cursor-pointer active:scale-95 transition-all">
            <CardContent className="p-6 text-center space-y-3">
              <div className="h-14 w-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto border border-green-100">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800">WhatsApp</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fastest Reply</p>
              </div>
            </CardContent>
          </Card>
          <Card onClick={handleCall} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md cursor-pointer active:scale-95 transition-all">
            <CardContent className="p-6 text-center space-y-3">
              <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                <PhoneCall className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800">Call Us</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Support</p>
              </div>
            </CardContent>
          </Card>
          <Card onClick={() => window.location.href = 'mailto:gaurav@doctivo.in'} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md cursor-pointer active:scale-95 transition-all col-span-2 md:col-span-1">
            <CardContent className="p-6 text-center space-y-3 flex flex-row md:flex-col items-center justify-center md:justify-start gap-4 md:gap-0">
              <div className="h-14 w-14 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100 shrink-0">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left md:text-center">
                <h3 className="font-black text-slate-800">Email Support</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">gaurav@doctivo.in</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 tracking-tight mb-6 flex items-center">
            <HelpCircle className="h-4 w-4 mr-2 text-primary" /> Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-700 text-sm group-hover:text-primary transition-colors pr-4">{faq.q}</h4>
                  <ChevronRight className="h-4 w-4 text-slate-300 mt-0.5" />
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{faq.a}</p>
                {idx !== faqs.length - 1 && <div className="h-px w-full bg-slate-50 mt-4"></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mt-6">
          <h3 className="text-sm font-black text-slate-800 tracking-tight mb-6 flex items-center">
            <Mail className="h-4 w-4 mr-2 text-primary" /> Send us a Message
          </h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Full Name</label>
              <Input 
                required 
                placeholder="John Doe" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-50 border-none rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Email Address</label>
              <Input 
                required 
                type="email" 
                placeholder="john@example.com" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-50 border-none rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Message</label>
              <Textarea 
                required 
                placeholder="How can we help?" 
                value={formData.message} 
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="bg-slate-50 border-none rounded-xl resize-none"
                rows={4}
              />
            </div>
            <Button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-bold mt-2">
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

