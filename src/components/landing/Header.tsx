import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 md:px-12 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <span className="text-white font-black text-xl">D</span>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">DOCTIVO</h1>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">Healthcare Simplified</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-8">
        <a href="tel:+917307986604" className="hidden lg:flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <Phone className="h-4 w-4 mr-2" /> +91 73079 86604
        </a>
        
        {!isAuthenticated ? (
          <Link href="/login">
            <Button variant="outline" className="h-11 px-6 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
              Sign In
            </Button>
          </Link>
        ) : (
          <Link href="/home">
            <Button variant="outline" className="h-11 px-6 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
              Dashboard
            </Button>
          </Link>
        )}
        
        <Link href={isAuthenticated ? "/home" : "/login"}>
          <Button className="h-11 px-6 rounded-xl font-black bg-blue-600 text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700">
            Book Now
          </Button>
        </Link>
      </div>
    </header>
  );
}

