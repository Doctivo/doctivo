import { query } from '@/lib/db';
import { Doctor } from '@/lib/types';

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

export const DoctorRepository = {
  async findDoctors(specialty?: string, searchQuery?: string): Promise<Doctor[]> {
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
  },

  async findById(id: string): Promise<Doctor | null> {
    const sql = 'SELECT * FROM doctors WHERE doctor_id = $1';
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
  },

  async findSpecialties(): Promise<string[]> {
    const sql = 'SELECT DISTINCT specialty FROM doctors WHERE is_approved = true';
    const result = await query(sql);
    const specialties = result.rows.map(r => r.specialty);
    return ['All', ...specialties];
  },

  async findAttendantsByDoctorId(doctorId: string): Promise<any[]> {
    const res = await query('SELECT * FROM attendants WHERE doctor_id = $1 ORDER BY full_name ASC', [doctorId]);
    return res.rows;
  },

  async addAttendant(attendantId: string, attendantData: any, doctorId: string): Promise<void> {
    await query(`
      INSERT INTO attendants (attendant_id, full_name, phone_number, email, doctor_id, is_approved)
      VALUES ($1, $2, $3, $4, $5, true)
    `, [
      attendantId, attendantData.name, attendantData.phone, attendantData.email || null, doctorId
    ]);
  },

  async updateSchedule(doctorId: string, defaultSchedule: any, customSchedule: any): Promise<void> {
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
  },

  async updateServices(doctorId: string, services: string[]): Promise<void> {
    await query(`UPDATE doctors SET reasons_for_visit = $1 WHERE doctor_id = $2`, [JSON.stringify(services), doctorId]);
  }
};
