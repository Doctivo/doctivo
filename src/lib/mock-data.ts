
import { Doctor } from './types';

export const DOCTOR_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🏥' },
  { id: 'gen', name: 'General', icon: '🩺' },
  { id: 'ped', name: 'Pediatrician', icon: '👶' },
  { id: 'den', name: 'Dentist', icon: '🦷' },
  { id: 'eye', name: 'Eye Specialist', icon: '👁️' },
  { id: 'cardio', name: 'Cardiologist', icon: '❤️' },
  { id: 'ortho', name: 'Orthopedic', icon: '🦴' },
];

// Removed MOCK_DOCTORS to ensure only database data is used
export const MOCK_DOCTORS: Doctor[] = [];
