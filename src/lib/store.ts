
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, Patient, Appointment, AdminProfile } from './types';

interface AppState {
  user: UserProfile | null;
  admin: AdminProfile | null;
  patients: Patient[];
  appointments: Appointment[];
  homeCardImages: Record<string, string>;
  homeBanners: string[];
  homeDataLastFetched: number | null;
  downloadedTickets: string[];
  searchHistory: string[];
  language: 'en' | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  
  setUser: (user: UserProfile | null) => void;
  setAdmin: (admin: AdminProfile | null) => void;
  setIsAuthenticated: (val: boolean) => void;
  setPatients: (patients: Patient[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setHomeCardImages: (images: Record<string, string>) => void;
  setHomeBanners: (banners: string[]) => void;
  setHomeDataLastFetched: (timestamp: number) => void;
  setDownloadedTickets: (tickets: string[]) => void;
  addSearchTerm: (term: string) => void;
  setLanguage: (lang: 'en') => void;
  setHasHydrated: (val: boolean) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addAppointment: (appointment: Appointment) => void;
  login: (phone: string, id: string) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      admin: null,
      patients: [],
      appointments: [],
      homeCardImages: {},
      homeBanners: [],
      homeDataLastFetched: null,
      downloadedTickets: [],
      searchHistory: [],
      language: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setUser: (user) => set({ user }),
      setAdmin: (admin) => set({ admin }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setPatients: (patients) => set({ patients }),
      setAppointments: (appointments) => set({ appointments }),
      setHomeCardImages: (homeCardImages) => set({ homeCardImages }),
      setHomeBanners: (homeBanners) => set({ homeBanners }),
      setHomeDataLastFetched: (timestamp) => set({ homeDataLastFetched: timestamp }),
      setDownloadedTickets: (downloadedTickets) => set({ downloadedTickets }),
      addSearchTerm: (term) => set((state) => {
        if (!term.trim()) return state;
        const newHistory = [term, ...state.searchHistory.filter(t => t !== term)].slice(0, 10);
        return { searchHistory: newHistory };
      }),
      setLanguage: (lang) => set({ language: lang }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      addPatient: (patient) => set((state) => ({ 
        patients: [...state.patients.filter(p => p.id !== patient.id), patient] 
      })),
      updatePatient: (id, updatedData) => set((state) => ({
        patients: state.patients.map(p => p.id === id ? { ...p, ...updatedData } : p)
      })),
      deletePatient: (id) => set((state) => ({
        patients: state.patients.filter(p => p.id !== id)
      })),
      addAppointment: (appointment) => set((state) => ({
        appointments: [appointment, ...state.appointments]
      })),
      login: (phone, id) => set({ isAuthenticated: true, user: { id, phone } as UserProfile }),
      logout: () => {
        sessionStorage.removeItem('doctivo-storage');
        set({ isAuthenticated: false, user: null, admin: null, patients: [], appointments: [] });
      },
    }),
    {
      name: 'doctivo-storage',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated, 
        user: state.user,
        admin: state.admin,
        patients: state.patients,
        homeCardImages: state.homeCardImages,
        homeBanners: state.homeBanners,
        homeDataLastFetched: state.homeDataLastFetched,
        downloadedTickets: state.downloadedTickets || [],
        language: state.language
      }),
    }
  )
);
