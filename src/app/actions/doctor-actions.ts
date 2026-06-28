
'use server';

import { query } from '@/lib/db';
import { Doctor } from '@/lib/types';

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
      slot_duration: row.slot_duration || 15,
      availableSlots: [], 
      categoryIcon: '🏥'
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
      categoryIcon: '🏥'
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
