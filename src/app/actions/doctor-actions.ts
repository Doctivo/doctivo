
'use server';

import { query } from '@/lib/db';
import { Doctor } from '@/lib/types';
import { sendTransactionalEmail } from './auth-actions';

/**
 * Fetches all approved doctors from the database with robust specialty filtering.
 * Uses wildcards and case-insensitive matching to ensure categories match correctly.
 */
export async function getDoctors(specialty?: string) {
  let sql = 'SELECT * FROM doctors WHERE is_approved = true';
  const params: any[] = [];

  if (specialty && specialty !== 'All') {
    // Use ILIKE with wildcards to handle "Cardiologist" matching "CARDIOLOGIST" or "Cardiology"
    sql += ' AND specialty ILIKE $1';
    params.push(`%${specialty.trim()}%`);
  }

  try {
    const result = await query(sql, params);
    return result.rows.map((row: any) => ({
      id: row.doctor_id,
      name: row.full_name,
      specialty: row.specialty,
      qualification: row.qualification,
      rating: 4.5,
      fees: row.consultation_fee,
      location: 'Gorakhpur',
      address: row.clinic_address,
      experience: `${row.experience_years} yrs exp`,
      imageUrl: row.image_url || '',
      startTime: row.start_time || '09:00',
      endTime: row.end_time || '17:00',
      slotDuration: row.slot_duration || 15,
      availableSlots: [], 
      workingDays: row.working_days ? JSON.parse(row.working_days) : [],
      customSchedule: row.custom_schedule ? JSON.parse(row.custom_schedule) : {},
      categoryIcon: '🏥',
      reasonsForVisit: row.reasons_for_visit ? JSON.parse(row.reasons_for_visit) : [],
      latitude: row.latitude ? parseFloat(row.latitude) : 26.7606,
      longitude: row.longitude ? parseFloat(row.longitude) : 83.3731,
      consultationModes: row.consultation_modes || 'Clinic,Home'
    })) as Doctor[];
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
      fees: row.consultation_fee,
      location: 'Gorakhpur',
      address: row.clinic_address,
      experience: `${row.experience_years} yrs exp`,
      imageUrl: row.image_url || '',
      startTime: row.start_time || '09:00',
      endTime: row.end_time || '17:00',
      slotDuration: row.slot_duration || 15,
      availableSlots: [],
      workingDays: row.working_days ? JSON.parse(row.working_days) : [],
      customSchedule: row.custom_schedule ? JSON.parse(row.custom_schedule) : {},
      categoryIcon: '🏥',
      reasonsForVisit: row.reasons_for_visit ? JSON.parse(row.reasons_for_visit) : [],
      latitude: row.latitude ? parseFloat(row.latitude) : 26.7606,
      longitude: row.longitude ? parseFloat(row.longitude) : 83.3731,
      consultationModes: row.consultation_modes || 'Clinic,Home'
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
  try {
    const res = await query('SELECT * FROM attendants WHERE doctor_id = $1 ORDER BY full_name ASC', [doctorId]);
    return res.rows;
  } catch (error) {
    console.error('Error fetching doctor attendants:', error);
    return [];
  }
}

/**
 * Onboards a new attendant, generates credentials, and triggers the welcome email
 */
export async function addAttendant(attendantData: any, doctorId: string) {
  const attendantId = `ATT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  try {
    // 1. Fetch doctor details for email
    const docRes = await query('SELECT full_name, clinic_address FROM doctors WHERE doctor_id = $1', [doctorId]);
    if (docRes.rows.length === 0) {
      return { success: false, error: 'Managing doctor not found.' };
    }
    const doctor = docRes.rows[0];

    // 2. Insert attendant record
    await query(`
      INSERT INTO attendants (attendant_id, full_name, phone_number, email, doctor_id, is_approved)
      VALUES ($1, $2, $3, $4, $5, true)
    `, [
      attendantId, attendantData.name, attendantData.phone, attendantData.email || null, doctorId
    ]);

    // 3. Send onboarding welcome email if email is provided
    if (attendantData.email) {
      try {
        const welcomeHtml = `
          <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 25px;">
              <h2 style="color: #2563eb; margin: 0; font-weight: 900; letter-spacing: -0.5px;">Welcome to Doctivo</h2>
              <p style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1.5px; margin-top: 6px;">Attendant Profile Active</p>
            </div>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hello <strong>${attendantData.name}</strong>,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">You have been successfully onboarded as a Clinic Attendant / Staff on the Doctivo platform.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 120px;">Attendant ID:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 800;">${attendantId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Managing Doctor:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">Dr. ${doctor.full_name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Phone Number:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${attendantData.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Clinic Location:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${doctor.clinic_address || 'Gorakhpur'}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; color: #334155; line-height: 1.6;">You can log in to manage your doctor's queue by visiting <a href="https://doctivo.in/login" style="color: #2563eb; text-decoration: none; font-weight: bold;">doctivo.in/login</a> using either your Attendant ID or registered phone number.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This is an automated system notification. Please do not reply directly to this message.</p>
          </div>
        `;
        await sendTransactionalEmail(attendantData.email, attendantData.name, 'Welcome to Doctivo - Your Attendant Account is Ready!', welcomeHtml);
      } catch (emailErr) {
        console.error('Failed to send onboarding attendant email:', emailErr);
      }
    }

    return { success: true, attendantId };
  } catch (error: any) {
    console.error('Error adding attendant:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates a doctor's default availability settings and custom date schedule overrides
 */
export async function updateDoctorSchedule(doctorId: string, defaultSchedule: any, customSchedule: any) {
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
