import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white py-16 px-6 md:px-12 border-t border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-center space-x-3 opacity-50">
          <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="text-slate-900 font-black tracking-tighter text-sm">DOCTIVO</span>
        </div>
        
        <div className="flex items-center justify-center space-x-6 text-xs text-slate-400 font-bold uppercase tracking-wider">
          <Link href="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link>
        </div>

        <p>© {new Date().getFullYear()} Doctivo Inc. Gorakhpur OS v2.5.0</p>
      </div>
    </footer>
  );
}
