'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserCircle, MapPin, Edit3, Users, History, 
  Settings, LogOut, ChevronRight,
  HeartPulse, MessageCircleQuestion, Download, Trash2
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { logoutSession } from '@/app/actions/auth-actions';
import { deletePatientAccount } from '@/app/actions/patient-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function ProfilePage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const homeCardImages = useStore(state => state.homeCardImages);
  const setHomeCardImages = useStore(state => state.setHomeCardImages);

  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      // 1. Clear server sessions (cookies)
      await logoutSession();
      // 2. Clear client state (Zustand & LocalStorage)
      logout();
      // 3. Force hard redirect to login to clear all memory
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback redirect
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setHomeCardImages({ ...homeCardImages, [idx]: base64 });
      };
      reader.readAsDataURL(file);
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
    { label: 'Edit Profile', subLabel: 'Update Name, Age, Location', icon: Edit3, color: 'bg-blue-50 text-blue-500', href: '/onboarding' },
    { label: 'Manage Family', subLabel: 'Add Mother, Father or Spouse', icon: Users, color: 'bg-indigo-50 text-indigo-500', href: '/patients' },
    { label: 'Past Appointments', subLabel: 'View your booking history', icon: History, color: 'bg-green-50 text-green-500', href: '/appointments?tab=Past' },
    { label: 'My Downloads', subLabel: 'Access saved tickets & receipts', icon: Download, color: 'bg-orange-50 text-orange-500', href: '/profile/downloads' },
    { label: 'Help & Support', subLabel: 'Contact clinic support', icon: MessageCircleQuestion, color: 'bg-yellow-50 text-yellow-500', href: '/support' },
  ];

  return (
    <div className="mobile-container pb-24 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Profile Header */}
      <div className="bg-white p-8 pt-12 rounded-b-[3rem] shadow-sm flex flex-col items-center border-b border-border">
        <div className="h-28 w-28 bg-slate-50 rounded-full flex items-center justify-center mb-4 relative ring-4 ring-slate-100 overflow-hidden border border-border">
          {user?.imageUrl ? (
            <Image src={user.imageUrl} alt="P" fill className="object-cover" />
          ) : (
            <UserCircle className="h-16 w-16 text-slate-300" />
          )}
          <button 
            onClick={() => router.push('/onboarding')}
            className="absolute bottom-1 right-1 bg-primary h-8 w-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg"
          >
            <Edit3 className="h-3 w-3 text-white" />
          </button>
        </div>
        
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{user?.name || 'Full Name'}</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">+91 {user?.phone || '9807XXXXXX'}</p>
        
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-black text-[9px] uppercase">
            <MapPin className="h-2.5 w-2.5 mr-1" /> {user?.city || 'Gorakhpur'}, {user?.state || 'UP'}
          </Badge>
          <Badge className="bg-red-50 text-red-600 border-none px-3 py-1 font-black text-[9px] uppercase">
            {user?.blood_group || 'O+'}
          </Badge>
        </div>

        <div className="w-full max-w-xs mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Profile Completeness</span>
            <span className="text-xs font-black text-primary">{completionPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${completionPercentage}%` }}></div>
          </div>
          {completionPercentage < 100 && (
            <p onClick={() => router.push('/onboarding')} className="text-[10px] text-center font-bold text-slate-400 mt-3 cursor-pointer hover:text-primary">
              Tap to complete your profile
            </p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Settings Group */}
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Account Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <button 
                key={item.label}
                onClick={() => item.href !== '#' && router.push(item.href)}
                className="w-full bg-white p-4 rounded-[1.5rem] shadow-sm border border-border flex items-center group active:scale-95 transition-all"
              >
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="ml-4 flex-1 text-left min-w-0">
                  <p className="text-sm font-black text-slate-800 leading-none">{item.label}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 truncate">{item.subLabel}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Temporary Admin Tool */}
        <div className="bg-orange-50 border-2 border-orange-100 rounded-[1.5rem] p-6 shadow-sm">
          <h3 className="text-xs font-black text-orange-600 uppercase tracking-[0.1em] mb-4">Admin Tool: Home Cards</h3>
          <p className="text-[10px] text-orange-500 font-bold mb-4">Upload images to test on the home page (saved locally). You can then hardcode them later.</p>
          <div className="space-y-4">
            {['Book Appointment', 'My Appointment', 'Physiotherapist', 'Add Patient'].map((label, idx) => (
              <div key={idx} className="space-y-1">
                <Label className="text-xs font-bold text-orange-700">{label} Card Image</Label>
                <div className="flex gap-2 items-center">
                  <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, idx)} className="bg-white border-orange-200" />
                  {homeCardImages[idx] && <div className="h-8 w-8 rounded overflow-hidden relative border border-orange-200"><Image src={homeCardImages[idx]} alt="" fill className="object-cover" /></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Zone */}
        <div className="pt-4 space-y-4">
          <Button 
            variant="ghost" 
            className="w-full h-16 bg-white text-slate-500 font-black rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" /> Sign Out from Device
          </Button>

          <Button 
            variant="ghost" 
            className="w-full h-16 bg-red-50 text-red-600 font-black rounded-2xl border-2 border-red-100 shadow-sm flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-5 w-5" /> Delete Account Permanently
          </Button>

          <p className="text-center text-[10px] text-slate-300 mt-10 font-black uppercase tracking-widest">
            Doctivo OS • v2.5.0-Gorakhpur
          </p>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[340px] rounded-[2rem] p-6 text-center border-border">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight text-center">Delete Account?</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-sm pt-2 text-center">
              Are you sure you want to permanently delete your account? This will erase your personal details and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 pt-4 border-t border-slate-100 sm:justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600"
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
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
