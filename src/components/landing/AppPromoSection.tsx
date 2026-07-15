import Link from 'next/link';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppPromoSection() {
  return (
    <section className="bg-slate-900 text-white py-20 px-6 md:px-12 border-t border-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,0.15),transparent)] pointer-events-none" />
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        <div className="space-y-6 max-w-xl text-center lg:text-left">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Healthcare in Your Pocket.
          </h2>
          <p className="text-slate-200 font-medium text-lg leading-relaxed">
            Install the lightweight Doctivo PWA application to receive immediate notifications and access your booking tickets instantly.
          </p>
        </div>
        <Link href="/download-app">
          <Button className="h-20 px-12 rounded-[2rem] bg-blue-600 text-white font-black text-xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 flex items-center justify-center gap-3 group shrink-0">
            Get the Mobile App <Download className="h-7 w-7 group-hover:translate-y-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
