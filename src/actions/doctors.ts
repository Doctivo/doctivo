'use server';

import { DoctorService } from '@/server/services/doctor.service';
import { requireAuth, requireRoles } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/roles';
import { logger } from '@/lib/logger';

import { unstable_cache } from 'next/cache';

const getCachedDoctors = unstable_cache(
  async (specialty?: string, searchQuery?: string) => DoctorService.getDoctors(specialty, searchQuery),
  ['doctors-list-cache'],
  { revalidate: 3600, tags: ['doctors'] } // Increased revalidate to 1 hour
);

const getCachedDoctorById = unstable_cache(
  async (id: string) => DoctorService.getDoctorById(id),
  ['doctor-by-id-cache'],
  { revalidate: 3600, tags: ['doctors'] }
);

const getCachedSpecialties = unstable_cache(
  async () => DoctorService.getSpecialties(),
  ['specialties-cache'],
  { revalidate: 3600, tags: ['doctors'] }
);

/**
 * Fetches all approved doctors from the database with robust specialty filtering.
 */
export async function getDoctors(specialty?: string, searchQuery?: string) {
  try {
    return await getCachedDoctors(specialty, searchQuery);
  } catch (error: any) {
    logger.error('Error fetching doctors::', { error: error.message || error });
    return [];
  }
}

/**
 * Fetches a single doctor by ID
 */
export async function getDoctorById(id: string) {
  try {
    return await getCachedDoctorById(id);
  } catch (error: any) {
    logger.error('Error fetching doctor by id::', { error: error.message || error });
    return null;
  }
}

/**
 * Fetches unique specialties to use as categories
 */
export async function getSpecialties() {
  try {
    return await getCachedSpecialties();
  } catch (error: any) {
    logger.error('Error fetching specialties::', { error: error.message || error });
    return ['All'];
  }
}

/**
 * Fetches all attendants assigned to a doctor
 */
export async function getDoctorAttendants(doctorId: string) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden: Data access boundary violation.');
  try {
    return await DoctorService.getDoctorAttendants(doctorId);
  } catch (error: any) {
    logger.error('Error fetching doctor attendants::', { error: error.message || error });
    return [];
  }
}

/**
 * Onboards a new attendant
 */
export async function addAttendant(attendantData: any, doctorId: string) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden: Data access boundary violation.');
  try {
    const result = await DoctorService.addAttendant(attendantData, doctorId);
    return { success: true, attendantId: result.attendantId, pin: result.pin };
  } catch (error: any) {
    logger.error('Error adding attendant::', { error: error.message || error });
    return { success: false, error: error.message };
  }
}

/**
 * Removes an attendant from a doctor's clinic
 */
export async function deleteAttendant(attendantId: string, doctorId: string) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden: Data access boundary violation.');
  try {
    await DoctorService.deleteAttendant(attendantId, doctorId);
    return { success: true };
  } catch (error: any) {
    logger.error('Error deleting attendant::', { error: error.message || error });
    return { success: false, error: error.message };
  }
}

/**
 * Toggles an attendant's status between 'Active' and 'Suspended'
 */
export async function toggleAttendantStatus(attendantId: string, doctorId: string, status: string) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden: Data access boundary violation.');
  try {
    await DoctorService.updateAttendantStatus(attendantId, doctorId, status);
    return { success: true };
  } catch (error: any) {
    logger.error('Error toggling attendant status::', { error: error.message || error });
    return { success: false, error: error.message };
  }
}

/**
 * Resets an attendant's 6-digit access PIN
 */
export async function resetAttendantPin(attendantId: string, doctorId: string, newPin?: string) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden: Data access boundary violation.');
  try {
    const pin = newPin && /^\d{6}$/.test(newPin) 
      ? newPin 
      : Math.floor(100000 + Math.random() * 900000).toString();
    await DoctorService.resetAttendantPin(attendantId, doctorId, pin);
    return { success: true, pin };
  } catch (error: any) {
    logger.error('Error resetting attendant pin::', { error: error.message || error });
    return { success: false, error: error.message };
  }
}

/**
 * Updates a doctor's availability
 */
export async function updateDoctorSchedule(doctorId: string, defaultSchedule: any, customSchedule: any) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden: Data access boundary violation.');
  try {
    await DoctorService.updateDoctorSchedule(doctorId, defaultSchedule, customSchedule);
    return { success: true };
  } catch (error: any) {
    logger.error('Error updating doctor schedule::', { error: error.message || error });
    return { success: false, error: error.message };
  }
}

/**
 * Updates a doctor's reasons for visit (Services)
 */
export async function updateDoctorServices(doctorId: string, services: string[]) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden: Data access boundary violation.');
  try {
    await DoctorService.updateDoctorServices(doctorId, services);
    return { success: true };
  } catch (error: any) {
    logger.error('Error updating doctor services::', { error: error.message || error });
    return { success: false, error: error.message };
  }
}
