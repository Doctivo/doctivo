'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  UserCircle, MapPin, Edit3, MessageCircleQuestion,
  LogOut, ChevronRight, FileText, ShieldCheck, RefreshCcw, Trash2, Moon, Info
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { logoutSession } from '@/app/actions/auth-actions';
import { deletePatientAccount } from '@/app/actions/patient-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const isAuthenticated = useStore(state => state.isAuthenticated);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await logoutSession();
      logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      router.replace('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setIsDeleting(true);
    try {
      const res = await deletePatientAccount(user.id);
      if (res.success) {
        await handleLogout();
      } else {
        alert(res.error || 'Failed to delete account');
        setIsDeleting(false);
      }
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) return null;

  // Calculate Profile Completion
  const profileFields = ['name', 'age', 'gender', 'state', 'city', 'area', 'pincode', 'blood_group', 'weight', 'height'];
  let filledFields = 0;
  if (user) {
    profileFields.forEach(field => {
      if (user[field as keyof typeof user]) filledFields++;
    });
  }
  const completionPercentage = Math.round((filledFields / profileFields.length) * 100);

  const menuItems = [
    { label: 'Edit Profile', icon: Edit3, color: 'bg-blue-50 text-blue-500', href: '/onboarding' },
    { label: 'Help & Support', icon: MessageCircleQuestion, color: 'bg-yellow-50 text-yellow-500', href: '/support' },
    { label: 'About Founder', icon: Info, color: 'bg-purple-50 text-purple-500', href: '/about' },
    { label: 'Terms of Service', icon: FileText, color: 'bg-slate-100 text-slate-500', href: '/terms' },
    { label: 'Privacy Policy', icon: ShieldCheck, color: 'bg-slate-100 text-slate-500', href: '/privacy-policy' },
    { label: 'Refund Policy', icon: RefreshCcw, color: 'bg-slate-100 text-slate-500', href: '/refund-policy' },
  ];

  return (
    <div className="mobile-container pb-24 bg-slate-50 dark:bg-slate-950 min-h-screen overflow-y-auto">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 p-8 pt-12 rounded-b-[3rem] shadow-sm flex flex-col items-center border-b border-border">
        <div className="h-28 w-28 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 relative ring-4 ring-slate-100 dark:ring-slate-800 overflow-hidden border border-border">
          {user?.imageUrl ? (
            <Image src={user.imageUrl} alt="P" fill className="object-cover" />
          ) : (
            <UserCircle className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          )}
          <button 
            onClick={() => router.push('/onboarding')}
            className="absolute bottom-1 right-1 bg-primary h-8 w-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg"
          >
            <Edit3 className="h-3 w-3 text-white" />
          </button>
        </div>
        
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{user?.name || 'Full Name'}</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">+91 {user?.phone || '9807XXXXXX'}</p>
        
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-black text-[9px] uppercase">
            <MapPin className="h-2.5 w-2.5 mr-1" /> {user?.city || 'Gorakhpur'}, {user?.state || 'UP'}
          </Badge>
          <Badge className="bg-red-50 text-red-600 border-none px-3 py-1 font-black text-[9px] uppercase">
            {user?.blood_group || 'O+'}
          </Badge>
        </div>

        <div className="w-full max-w-xs mt-6 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Profile Completeness</span>
            <span className="text-xs font-black text-primary">{completionPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${completionPercentage}%` }}></div>
          </div>
          {completionPercentage < 100 && (
            <p onClick={() => router.push('/onboarding')} className="text-[10px] text-center font-bold text-slate-400 mt-3 cursor-pointer hover:text-primary">
              Tap to complete your profile
            </p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Settings Group */}
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Settings</h3>
          <div className="flex flex-col gap-3">
            {menuItems.map((item) => (
              <button 
                key={item.label}
                onClick={() => router.push(item.href)}
                className="w-full bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] shadow-sm border border-border flex items-center group active:scale-95 transition-all"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="ml-4 flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
              </button>
            ))}

            {/* Dark Mode Toggle */}
            <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] shadow-sm border border-border flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 bg-slate-900 text-white">
                  <Moon className="h-5 w-5" />
                </div>
                <div className="ml-4 flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Dark Mode 🌙</p>
                </div>
              </div>
              <Switch 
                checked={theme === 'dark'} 
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
              />
            </div>
          </div>
        </div>

        {/* Action Zone */}
        <div className="pt-4 flex flex-col gap-3">
          <Button 
            variant="ghost" 
            className="w-full h-14 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>

          <Button 
            variant="ghost" 
            className="w-full h-14 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-100 dark:border-red-900/50 shadow-sm flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 active:scale-95 transition-all"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Account
          </Button>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[340px] rounded-[2rem] p-6 text-center border-border dark:bg-slate-900">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight text-center">Delete Account?</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-[13px] pt-4 text-center leading-relaxed">
              Deleting your account is permanent and cannot be undone. Once your account is deleted, you will lose access to your profile, and your personal information will be permanently removed or anonymized, except where retention is required by applicable law.
              <br/><br/>
              Your medical appointment history and related records may be retained for legal, regulatory, compliance, or audit purposes, as required by law.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 pt-6 sm:justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              className="flex-1 h-12 rounded-xl font-bold"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
