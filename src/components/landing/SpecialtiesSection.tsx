import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

export function SpecialtiesSection({ setIsPhysioOpen }: { setIsPhysioOpen: (open: boolean) => void }) {
  const router = useRouter();
  
  const specialties = [
    { name: 'Cardiologist', icon: '❤️', desc: 'Heart specialist consultations & ECG tracking.', href: '/doctors?specialty=Cardiologist' },
    { name: 'Eye Specialist', icon: '👁️', desc: 'Vision testing, refractive errors & general checkups.', href: '/doctors?specialty=Eye%20Specialist' },
    { name: 'Physiotherapist', icon: '💪', desc: 'Joint rehab, back therapy & customized recovery programs.', onClick: () => setIsPhysioOpen(true) },
    { name: 'General Physician', icon: '🩺', desc: 'Viral fever, chronic health reviews & physicals.', href: '/doctors?specialty=General%20Physician' },
  ];

  return (
    <section className="bg-white py-24 px-6 md:px-12 border-y border-slate-100">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 block">Specialties</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">Our Premium Medical Network</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {specialties.map((spec) => (
            <Card 
              key={spec.name} 
              onClick={spec.onClick || (() => router.push(spec.href!))}
              className="border-none bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[2.5rem] p-8 cursor-pointer group"
            >
              <CardContent className="p-0 space-y-6">
                <div className="h-16 w-16 rounded-[1.25rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-3xl group-hover:bg-blue-600 transition-colors">
                  <span className="group-hover:scale-110 transition-transform">{spec.icon}</span>
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-xl leading-tight group-hover:text-blue-600 transition-colors">{spec.name}</h4>
                  <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed">{spec.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
