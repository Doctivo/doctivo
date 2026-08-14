'use server';

import { AppointmentService } from '@/server/services/appointment.service';
import { Appointment } from '@/lib/types';
import { requireAuth, requireRoles } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/roles';
import { logger } from '@/lib/logger';

/**
 * Saves a new appointment to the appointments table
 */
export async function createAppointment(app: Partial<Appointment>) {
  const session = await requireAuth();
  if (session.userId !== app.patientId && session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Forbidden: You can only book appointments for your own account.');
  }
  try {
    const data = await AppointmentService.createAppointment(app);
    return { success: true, data };
  } catch (error: any) {
    logger.error('CRITICAL ERROR during createAppointment:', { error: error.message });
    if (error.message.includes('already booked')) {
      return { success: false, error: 'This time slot is already booked. Please choose another slot.' };
    }
    return { success: false, error: error.message || 'Failed to record booking in database.' };
  }
}

/**
 * Fetches all appointments for a specific user and auto-handles missed visits
 */
export async function getUserAppointments(userId: string) {
  const session = await requireAuth();
  if (session.userId !== userId && session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN) {
    return []; 
  }
  try {
    return await AppointmentService.getUserAppointments(userId);
  } catch (error: any) {
    logger.error('Error fetching user appointments:', { error: error.message });
    return [];
  }
}

/**
 * Fetches a single appointment by its unique ID
 */
export async function getAppointmentById(id: string) {
  const session = await requireAuth();
  try {
    return await AppointmentService.getAppointmentById(id);
  } catch (error: any) {
    logger.error('Error fetching appointment by ID:', { error: error.message });
    return null;
  }
}

/**
 * Fetches all appointments for a specific doctor on a selected date, sorted by token number.
 */
export async function getDoctorAppointmentsForDate(doctorId: string, dateStr: string) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.ATTENDANT]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden');
  try {
    return await AppointmentService.getDoctorAppointmentsForDate(doctorId, dateStr);
  } catch (error: any) {
    logger.error('Error fetching doctor appointments for date:', { error: error.message });
    return [];
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const session = await requireAuth(); 
  try {
    await AppointmentService.updateAppointmentStatus(appointmentId, status);
    return { success: true };
  } catch (error: any) {
    logger.error('Error updating appointment status:', { error: error.message });
    return { success: false, error: error.message };
  }
}

export async function verifyVisitOtp(appointmentId: string, otp: string) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.ATTENDANT]);
  try {
    await AppointmentService.verifyVisitOtp(appointmentId, otp);
    return { success: true };
  } catch (error: any) {
    logger.error('Error verifying OTP:', { error: error.message });
    return { success: false, error: error.message };
  }
}

export async function getBookedSlots(doctorId: string, date: string) {
  try {
    return await AppointmentService.getBookedSlots(doctorId, date);
  } catch (error: any) {
    logger.error('Error fetching booked slots:', { error: error.message });
    return [];
  }
}

export async function rescheduleAppointment(appId: string, newDate: string, newTime: string) {
  const session = await requireAuth();
  try {
    await AppointmentService.rescheduleAppointment(appId, newDate, newTime);
    return { success: true };
  } catch (error: any) {
    console.error('Reschedule error:', error);
    return { success: false, error: error.message || 'Failed to reschedule.' };
  }
}
