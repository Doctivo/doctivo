import { query } from '@/lib/db';

export const AdminRepository = {
  async getEmployeePayroll(): Promise<any[]> {
    const result = await query(`
      SELECT 
        a.*,
        COALESCE((SELECT SUM(amount) FROM payroll_adjustments WHERE employee_id = a.attendant_id AND type = 'Advance' AND is_settled = false), 0) as total_advances,
        COALESCE((SELECT SUM(amount) FROM payroll_adjustments WHERE employee_id = a.attendant_id AND type = 'Bonus' AND is_settled = false), 0) as total_bonuses,
        COALESCE((SELECT SUM(amount) FROM payroll_adjustments WHERE employee_id = a.attendant_id AND type = 'Penalty' AND is_settled = false), 0) as total_penalties
      FROM attendants a
    `);
    
    return result.rows.map(r => ({
      ...r,
      net_balance: parseInt(r.base_salary || '0') + parseInt(r.total_bonuses || '0') - parseInt(r.total_advances || '0') - parseInt(r.total_penalties || '0')
    }));
  },

  async adjustPayroll(data: any): Promise<void> {
    await query(`
      INSERT INTO payroll_adjustments (employee_id, employee_name, type, amount, reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [data.employeeId, data.employeeName, data.type, data.amount, data.reason]);
  },

  async settlePayroll(employeeId: string): Promise<void> {
    await query('UPDATE payroll_adjustments SET is_settled = true WHERE employee_id = $1', [employeeId]);
  },

  async getPayrollLogs(): Promise<any[]> {
    const result = await query('SELECT * FROM payroll_adjustments ORDER BY created_at DESC LIMIT 50');
    return result.rows;
  },

  async getDoctorsCatalog(): Promise<any[]> {
    const result = await query('SELECT * FROM doctors ORDER BY created_at DESC');
    return result.rows || [];
  },

  async getDoctorsByStatus(isApproved: boolean): Promise<any[]> {
    const result = await query('SELECT * FROM doctors WHERE is_approved = $1 ORDER BY created_at DESC', [isApproved]);
    return result.rows || [];
  },

  async updateDoctorBilling(doctorId: string, data: any): Promise<void> {
    await query(`
      UPDATE doctors SET
        allowed_free_attendants = $1,
        total_purchased_slots = $2,
        allow_revenue_deduction = $3,
        current_active_campaign = $4
      WHERE doctor_id = $5
    `, [
      data.allowed_free_attendants,
      data.total_purchased_slots,
      data.allow_revenue_deduction,
      data.current_active_campaign,
      doctorId
    ]);
  },

  async getAdminUsers(): Promise<any[]> {
    const result = await query('SELECT * FROM admins ORDER BY created_at DESC');
    return result.rows || [];
  },

  async createAdminUser(id: string, data: any): Promise<void> {
    await query('INSERT INTO admins (admin_id, full_name, email, role, permissions) VALUES ($1, $2, $3, $4, $5)', [id, data.name, data.email, data.role, JSON.stringify(data.permissions || {})]);
  },

  async deleteAdminUser(adminId: string): Promise<void> {
    await query('DELETE FROM admins WHERE admin_id = $1', [adminId]);
  },

  async getAdminMetrics(): Promise<any> {
    const doctorsCount = await query('SELECT COUNT(*) FROM doctors WHERE is_approved = true');
    const patientsCount = await query('SELECT COUNT(*) FROM patients');
    const activeBookings = await query("SELECT COUNT(*) FROM appointments WHERE status IN ('Waiting', 'In Consultation', 'Confirmed') AND appointment_date = CURRENT_DATE");
    const totalRevenue = await query("SELECT SUM(consultation_fee_amount) FROM appointments WHERE payment_status = 'Paid'");
    
    const trendResult = await query(`
      SELECT TO_CHAR(appointment_date, 'Mon DD') as date, COUNT(*) as count
      FROM appointments WHERE appointment_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY appointment_date ORDER BY appointment_date ASC
    `);

    const specialtyResult = await query(`
      SELECT specialty as name, COUNT(*) as value
      FROM doctors WHERE is_approved = true GROUP BY specialty
    `);

    return {
      activeDoctors: parseInt(doctorsCount.rows[0]?.count || '0'),
      totalPatients: parseInt(patientsCount.rows[0]?.count || '0'),
      liveBookings: parseInt(activeBookings.rows[0]?.count || '0'),
      grossRevenue: parseInt(totalRevenue.rows[0]?.sum || '0'),
      trendData: trendResult.rows.map((row: any) => ({ ...row, count: parseInt(row.count || '0') })) || [],
      specialtyData: specialtyResult.rows.map((row: any) => ({ ...row, value: parseInt(row.value || '0') })) || [],
    };
  },

  async getAdminBookings(): Promise<any[]> {
    const result = await query('SELECT * FROM appointments ORDER BY created_at DESC');
    return result.rows || [];
  },

  async cancelAppointment(appointmentId: string): Promise<void> {
    await query("UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = $1", [appointmentId]);
  },

  async getAllUsers(role: string): Promise<any[]> {
    const table = role === 'Doctor' ? 'doctors' : role === 'Patient' ? 'patients' : 'attendants';
    const result = await query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    return result.rows || [];
  },

  async addDoctorDirectly(id: string, data: any): Promise<void> {
    await query(`
      INSERT INTO doctors (
        doctor_id, full_name, phone_number, email, specialty, qualification, 
        experience_years, clinic_address, consultation_fee, is_approved,
        start_time, end_time, slot_duration, image_url, consultation_modes, reasons_for_visit, stops_booking_at_midnight, working_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      id, data.name, data.phone, data.email || null, data.specialty, data.qualification || '',
      parseInt(data.experience || '0'), data.address || '', parseInt(data.fees || '500'),
      data.startTime, data.endTime, parseInt(data.slotDuration || '15'), data.imageUrl || null,
      data.consultation_modes || 'Clinic,Home', JSON.stringify(data.reasons_for_visit || []),
      data.stops_booking_at_midnight || false, JSON.stringify(data.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    ]);
  },

  async updateDoctor(doctorId: string, data: any): Promise<void> {
    await query(`
      UPDATE doctors SET
        full_name = $1, phone_number = $2, email = $3, specialty = $4, 
        qualification = $5, experience_years = $6, clinic_address = $7, 
        consultation_fee = $8, start_time = $9, end_time = $10, 
        slot_duration = $11, image_url = $12, consultation_modes = $13, reasons_for_visit = $14, stops_booking_at_midnight = $15, working_days = $16
      WHERE doctor_id = $17
    `, [
      data.full_name, data.phone_number, data.email, data.specialty, data.qualification,
      data.experience_years, data.clinic_address, data.consultation_fee,
      data.start_time, data.end_time, data.slot_duration, data.image_url,
      data.consultation_modes, JSON.stringify(data.reasons_for_visit || []), data.stops_booking_at_midnight || false, JSON.stringify(data.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']), doctorId
    ]);
  },

  async deleteDoctor(doctorId: string): Promise<void> {
    await query('DELETE FROM doctors WHERE doctor_id = $1', [doctorId]);
  },

  async setAppSetting(key: string, value: any): Promise<void> {
    await query(`
      INSERT INTO app_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [key, JSON.stringify(value)]);
  },

  async getAppSetting(key: string): Promise<any> {
    const res = await query('SELECT value FROM app_settings WHERE key = $1', [key]);
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
    return null;
  },

  async logAdminAction(adminId: string, actionType: string, targetId: string, details: any): Promise<void> {
    await query(
      'INSERT INTO audit_logs (admin_id, action_type, target_id, details) VALUES ($1, $2, $3, $4)',
      [adminId, actionType, targetId, JSON.stringify(details)]
    );
  }
};
