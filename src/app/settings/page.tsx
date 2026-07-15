'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { logoutSession } from '@/app/actions/auth-actions';
import { deletePatientAccount } from '@/app/actions/patient-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function SettingsPage() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

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

  return (
    <div className="mobile-container pb-24 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center space-x-4 sticky top-0 z-10 border-b border-border shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 bg-slate-50 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-colors">
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </button>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Settings</h1>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Account Danger Zone</h3>
          <Button 
            variant="ghost" 
            className="w-full h-16 bg-red-50 text-red-600 font-black rounded-2xl border-2 border-red-100 shadow-sm flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-5 w-5" /> Delete Account Permanently
          </Button>
          <p className="text-center text-xs text-slate-400 font-medium mt-3 px-4">
            Deleting your account will remove your profile access. Your past medical and payment records will be retained for audit purposes.
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
