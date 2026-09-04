import { query } from '@/lib/db';
import { Appointment } from '@/types';
import { isBefore, parseISO, startOfDay } from 'date-fns';

export const AppointmentRepository = {
  async create(app: Partial<Appointment>): Promise<any> {
    const existingCheck = await query(
      "SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time_slot = $3 AND status != 'Cancelled'",
      [app.doctorId, app.date, app.time]
    );
    if (existingCheck.rows.length > 0) {
      throw new Error('This time slot is already booked. Please choose another slot.');
    }

    const tokenResult = await query(
      "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND appointment_date = $2",
      [app.doctorId, app.date]
    );
    const tokenNumber = parseInt(tokenResult.rows[0].count || '0') + 1;

    const visitOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const sql = `
      INSERT INTO appointments (
        appointment_id, doctor_id, doctor_name, booked_by_user_id, 
        patient_type, patient_name, patient_age, patient_gender, patient_blood_group,
        appointment_date, appointment_time_slot,
        current_symptoms, consultation_fee_amount, payment_status, 
        payment_mode, transaction_id, status, token_number, visit_otp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *;
    `;

    const values = [
      app.id, app.doctorId, app.doctorName, app.patientId, 
      app.patientType, app.patientName, app.patientAge || 'N/A',
      app.patientGender || 'N/A', app.patientBloodGroup || 'N/A',
      app.date, app.time, app.current_symptoms || '',
      app.consultation_fee_amount || 0, app.payment_status || 'Pending',
      app.payment_mode || 'Online_UPI', app.transaction_id || 'TXN-' + Date.now(),
      app.status || 'Confirmed', tokenNumber, visitOtp
    ];

    const result = await query(sql, values);
    if (result.rowCount && result.rowCount > 0) {
      return result.rows[0];
    }
    throw new Error('Database accepted query but no rows were saved.');
  },

  async findByUserId(userId: string): Promise<Appointment[]> {
    const result = await query('SELECT * FROM appointments WHERE booked_by_user_id = $1 ORDER BY created_at DESC', [userId]);
    const today = startOfDay(new Date());

    return result.rows.map((r: any) => {
      const appDate = r.appointment_date instanceof Date ? r.appointment_date : parseISO(String(r.appointment_date));
      let status = r.status;
      if (isBefore(appDate, today) && (status === 'Confirmed' || status === 'Waiting')) {
        status = 'Missed';
      }
      return {
        id: r.appointment_id, doctorId: r.doctor_id, doctorName: r.doctor_name,
        patientId: r.booked_by_user_id, patientName: r.patient_name,
        patientType: r.patient_type, patientAge: r.patient_age,
        patientGender: r.patient_gender, patientBloodGroup: r.patient_blood_group,
        date: r.appointment_date instanceof Date ? r.appointment_date.toISOString().split('T')[0] : String(r.appointment_date || ''),
        time: r.appointment_time_slot, current_symptoms: r.current_symptoms,
        consultation_fee_amount: r.consultation_fee_amount, payment_status: r.payment_status,
        transaction_id: r.transaction_id, status: status,
        tokenNumber: r.token_number || 1, visit_otp: r.visit_otp
      };
    }) as Appointment[];
  },

  async findById(id: string): Promise<Appointment | null> {
    const result = await query('SELECT * FROM appointments WHERE appointment_id = $1', [id]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return {
      id: r.appointment_id, doctorId: r.doctor_id, doctorName: r.doctor_name,
      patientId: r.booked_by_user_id, patientName: r.patient_name,
      patientType: r.patient_type, patientAge: r.patient_age,
      patientGender: r.patient_gender, patientBloodGroup: r.patient_blood_group,
      date: r.appointment_date instanceof Date ? r.appointment_date.toISOString().split('T')[0] : String(r.appointment_date || ''),
      time: r.appointment_time_slot, current_symptoms: r.current_symptoms,
      consultation_fee_amount: r.consultation_fee_amount, payment_status: r.payment_status,
      transaction_id: r.transaction_id, status: r.status,
      tokenNumber: r.token_number || 1, visit_otp: r.visit_otp
    } as Appointment;
  },

  async findDoctorAppointmentsForDate(doctorId: string, dateStr: string): Promise<Appointment[]> {
    const result = await query(
      'SELECT * FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 ORDER BY token_number ASC',
      [doctorId, dateStr]
    );
    return result.rows.map((r: any) => {
      const d = r.appointment_date instanceof Date ? r.appointment_date : new Date(r.appointment_date);
      const localDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      return {
        id: r.appointment_id, doctorId: r.doctor_id, doctorName: r.doctor_name,
        patientId: r.booked_by_user_id, patientName: r.patient_name,
        patientType: r.patient_type, patientAge: r.patient_age,
        patientGender: r.patient_gender, patientBloodGroup: r.patient_blood_group,
        date: localDate, time: r.appointment_time_slot,
        current_symptoms: r.current_symptoms, consultation_fee_amount: r.consultation_fee_amount,
        payment_status: r.payment_status, transaction_id: r.transaction_id,
        status: r.status, tokenNumber: r.token_number || 1, visit_otp: r.visit_otp
      };
    }) as Appointment[];
  },

  async updateStatus(appointmentId: string, status: string): Promise<void> {
    await query('UPDATE appointments SET status = $1 WHERE appointment_id = $2', [status, appointmentId]);
  },

  async verifyVisitOtp(appointmentId: string, otp: string): Promise<void> {
    const res = await query('SELECT visit_otp FROM appointments WHERE appointment_id = $1', [appointmentId]);
    if (res.rowCount === 0) throw new Error('Not found.');
    if (res.rows[0].visit_otp !== otp) throw new Error('Incorrect OTP.');
    await query("UPDATE appointments SET status = 'Waiting', payment_status = 'Paid' WHERE appointment_id = $1", [appointmentId]);
  },

  async getBookedSlots(doctorId: string, date: string): Promise<string[]> {
    const result = await query(
      "SELECT appointment_time_slot as time FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'Cancelled'",
      [doctorId, date]
    );
    return result.rows.map(r => String(r.time));
  },

  async reschedule(appId: string, newDate: string, newTime: string): Promise<void> {
    const app = await query("SELECT doctor_id FROM appointments WHERE appointment_id = $1", [appId]);
    if (!app.rows.length) throw new Error('Appointment not found');
    const doctorId = app.rows[0].doctor_id;

    const existingCheck = await query(
      "SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time_slot = $3 AND status != 'Cancelled'",
      [doctorId, newDate, newTime]
    );
    if (existingCheck.rows.length > 0) throw new Error('This time slot is already booked. Please choose another slot.');

    const tokenResult = await query(
      "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND appointment_date = $2",
      [doctorId, newDate]
    );
    const tokenNumber = parseInt(tokenResult.rows[0].count || '0') + 1;

    await query(`
      UPDATE appointments 
      SET appointment_date = $1, appointment_time_slot = $2, token_number = $3 
      WHERE appointment_id = $4
    `, [newDate, newTime, tokenNumber, appId]);
  }
};
