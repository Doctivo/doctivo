'use server';

import { DoctorService } from '@/server/services/doctor.service';
import { requireAuth, requireRoles } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/roles';
import { logger } from '@/lib/logger';

/**
 * Fetches all approved doctors from the database with robust specialty filtering.
 */
export async function getDoctors(specialty?: string, searchQuery?: string) {
  try {
    return await DoctorService.getDoctors(specialty, searchQuery);
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
    return await DoctorService.getDoctorById(id);
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
    return await DoctorService.getSpecialties();
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
    const attendantId = await DoctorService.addAttendant(attendantData, doctorId);
    return { success: true, attendantId };
  } catch (error: any) {
    logger.error('Error adding attendant::', { error: error.message || error });
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

