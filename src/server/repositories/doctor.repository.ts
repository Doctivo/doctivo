import { query } from '@/lib/db';
import { Doctor } from '@/types';

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
    const res = await query(`
      SELECT 
        attendant_id, 
        full_name, 
        COALESCE(phone_number, mobile) as phone_number, 
        email, 
        doctor_id, 
        pin, 
        COALESCE(status, account_status, 'Active') as status, 
        created_at 
      FROM attendants 
      WHERE doctor_id = $1 
      ORDER BY created_at DESC, full_name ASC
    `, [doctorId]);
    return res.rows;
  },

  async addAttendant(attendantId: string, attendantData: any, doctorId: string): Promise<string> {
    const pin = attendantData.pin && /^\d{6}$/.test(attendantData.pin) 
      ? attendantData.pin 
      : Math.floor(100000 + Math.random() * 900000).toString();

    await query(`
      INSERT INTO attendants (
        attendant_id, full_name, phone_number, mobile, email, doctor_id, pin, status, account_status
      )
      VALUES ($1, $2, $3, $3, $4, $5, $6, 'Active', 'Active')
    `, [
      attendantId, 
      attendantData.name, 
      attendantData.phone, 
      attendantData.email || null, 
      doctorId, 
      pin
    ]);
    return pin;
  },

  async deleteAttendant(attendantId: string, doctorId: string): Promise<void> {
    await query('DELETE FROM attendants WHERE attendant_id = $1 AND doctor_id = $2', [attendantId, doctorId]);
  },

  async updateAttendantStatus(attendantId: string, doctorId: string, status: string): Promise<void> {
    await query('UPDATE attendants SET status = $1, account_status = $1 WHERE attendant_id = $2 AND doctor_id = $3', [status, attendantId, doctorId]);
  },

  async resetAttendantPin(attendantId: string, doctorId: string, newPin: string): Promise<void> {
    await query('UPDATE attendants SET pin = $1 WHERE attendant_id = $2 AND doctor_id = $3', [newPin, attendantId, doctorId]);
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
