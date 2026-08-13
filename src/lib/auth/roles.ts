export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  ATTENDANT: 'ATTENDANT',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
