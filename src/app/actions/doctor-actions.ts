'use server';

import { query } from '@/lib/db';
import { Doctor } from '@/lib/types';
import { sendTransactionalEmail } from './auth-actions';
import { requireRoles } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/roles';

/**
 * Robust JSON parsing for database values that might be returned as strings or objects.
 */
function safeParseJson(val: any, fallback: any) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    console.warn('JSON Parse Error for value:', val);
    return fallback;
  }
}

/**
 * Fetches all approved doctors from the database with robust specialty filtering.
 */
export async function getDoctors(specialty?: string, searchQuery?: string) {
  let sql = 'SELECT * FROM doctors WHERE is_approved = true';
  const params: any[] = [];
  let paramCount = 1;

  if (specialty && specialty !== 'All') {
    sql += ` AND specialty ILIKE $${paramCount}`;
    params.push(`%${specialty.trim()}%`);
    paramCount++;
  }

  if (searchQuery && searchQuery.trim() !== '') {
    const term = `%${searchQuery.trim()}%`;
    sql += ` AND (full_name ILIKE $${paramCount} OR specialty ILIKE $${paramCount} OR reasons_for_visit::text ILIKE $${paramCount})`;
    params.push(term);
    paramCount++;
  }

  try {
    const result = await query(sql, params);
    return result.rows.map((row: any) => {
      return {
        id: row.doctor_id,
        name: row.full_name,
        specialty: row.specialty,
        qualification: row.qualification,
        rating: 4.5,
        fees: parseInt(String(row.consultation_fee || '500')),
        location: 'Gorakhpur',
        address: row.clinic_address,
        experience: `${row.experience_years} yrs exp`,
        imageUrl: row.image_url || '',
        startTime: row.start_time || '09:00',
        endTime: row.end_time || '17:00',
        slotDuration: parseInt(String(row.slot_duration || '15')),
        availableSlots: [], 
        workingDays: safeParseJson(row.working_days, []),
        customSchedule: safeParseJson(row.custom_schedule, {}),
        categoryIcon: '🏥',
        reasonsForVisit: safeParseJson(row.reasons_for_visit, []),
        latitude: row.latitude ? parseFloat(String(row.latitude)) : 26.7606,
        longitude: row.longitude ? parseFloat(String(row.longitude)) : 83.3731,
        consultationModes: row.consultation_modes || 'Clinic,Home',
        stops_booking_at_midnight: Boolean(row.stops_booking_at_midnight)
      };
    }) as Doctor[];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

/**
 * Fetches a single doctor by ID
 */
export async function getDoctorById(id: string) {
  const sql = 'SELECT * FROM doctors WHERE doctor_id = $1';
  try {
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];

    return {
      id: row.doctor_id,
      name: row.full_name,
      specialty: row.specialty,
      qualification: row.qualification,
      rating: 4.5,
      fees: parseInt(String(row.consultation_fee || '500')),
      location: 'Gorakhpur',
      address: row.clinic_address,
      experience: `${row.experience_years} yrs exp`,
      imageUrl: row.image_url || '',
      startTime: row.start_time || '09:00',
      endTime: row.end_time || '17:00',
      slotDuration: parseInt(String(row.slot_duration || '15')),
      availableSlots: [],
      workingDays: safeParseJson(row.working_days, []),
      customSchedule: safeParseJson(row.custom_schedule, {}),
      categoryIcon: '🏥',
      reasonsForVisit: safeParseJson(row.reasons_for_visit, []),
      latitude: row.latitude ? parseFloat(String(row.latitude)) : 26.7606,
      longitude: row.longitude ? parseFloat(String(row.longitude)) : 83.3731,
      consultationModes: row.consultation_modes || 'Clinic,Home',
      stops_booking_at_midnight: Boolean(row.stops_booking_at_midnight)
    } as Doctor;
  } catch (error) {
    console.error('Error fetching doctor by id:', error);
    return null;
  }
}

/**
 * Fetches unique specialties to use as categories
 */
export async function getSpecialties() {
  const sql = 'SELECT DISTINCT specialty FROM doctors WHERE is_approved = true';
  try {
    const result = await query(sql);
    const specialties = result.rows.map(r => r.specialty);
    return ['All', ...specialties];
  } catch (error) {
    console.error('Error fetching specialties:', error);
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
    const res = await query('SELECT * FROM attendants WHERE doctor_id = $1 ORDER BY full_name ASC', [doctorId]);
    return res.rows;
  } catch (error) {
    console.error('Error fetching doctor attendants:', error);
    return [];
  }
}

/**
 * Onboards a new attendant
 */
export async function addAttendant(attendantData: any, doctorId: string) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden: Data access boundary violation.');
  const attendantId = `ATT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  try {
    const docRes = await query('SELECT full_name, clinic_address FROM doctors WHERE doctor_id = $1', [doctorId]);
    if (docRes.rows.length === 0) {
      return { success: false, error: 'Managing doctor not found.' };
    }
    const doctor = docRes.rows[0];

    await query(`
      INSERT INTO attendants (attendant_id, full_name, phone_number, email, doctor_id, is_approved)
      VALUES ($1, $2, $3, $4, $5, true)
    `, [
      attendantId, attendantData.name, attendantData.phone, attendantData.email || null, doctorId
    ]);

    if (attendantData.email) {
      const welcomeHtml = `
        <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
          <h2 style="color: #2563eb; text-align: center;">Welcome to Doctivo</h2>
          <p>Hello <strong>${attendantData.name}</strong>,</p>
          <p>You have been added as an attendant for Dr. ${doctor.full_name}.</p>
          <p><strong>Your Attendant ID:</strong> ${attendantId}</p>
          <p>Login at <a href="https://doctivo.in/login">doctivo.in/login</a></p>
        </div>
      `;
      await sendTransactionalEmail(attendantData.email, attendantData.name, 'Welcome to Doctivo!', welcomeHtml);
    }

    return { success: true, attendantId };
  } catch (error: any) {
    console.error('Error adding attendant:', error);
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
    await query(`
      UPDATE doctors SET
        start_time = $1,
        end_time = $2,
        working_days = $3,
        custom_schedule = $4
      WHERE doctor_id = $5
    `, [
      defaultSchedule.startTime || '09:00',
      defaultSchedule.endTime || '17:00',
      JSON.stringify(defaultSchedule.workingDays || []),
      JSON.stringify(customSchedule || {}),
      doctorId
    ]);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating doctor schedule:', error);
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
    await query(`UPDATE doctors SET reasons_for_visit = $1 WHERE doctor_id = $2`, [JSON.stringify(services), doctorId]);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating doctor services:', error);
    return { success: false, error: error.message };
  }
}

