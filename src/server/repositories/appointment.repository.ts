import { query } from '@/lib/db';
import { Appointment } from '@/types';
import { isBefore, parseISO, startOfDay } from 'date-fns';

export const AppointmentRepository = {
  async create(app: Partial<Appointment>): Promise<any> {
    // 1. Cancel previous Pending_Payment appointments for the same user on this slot or older abandoned Pending_Payment
    await query(
      "UPDATE appointments SET status = 'Cancelled' WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time_slot = $3 AND status = 'Pending_Payment' AND (booked_by_user_id = $4 OR created_at < NOW() - INTERVAL '15 minutes')",
      [app.doctorId, app.date, app.time, app.patientId]
    );

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
    // 1. Auto-verify any Pending_Payment appointments with Cashfree to ensure paid users directly see Confirmed
    try {
      const pendingCheck = await query(
        "SELECT appointment_id, transaction_id, created_at FROM appointments WHERE booked_by_user_id = $1 AND status = 'Pending_Payment'",
        [userId]
      );

      if (pendingCheck.rows.length > 0) {
        const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY;
        const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
        const baseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

        for (const row of pendingCheck.rows) {
          const orderId = row.transaction_id || row.appointment_id;
          if (appId && secretKey && orderId) {
            try {
              const cfRes = await fetch(`${baseUrl}/orders/${orderId}`, {
                method: 'GET',
                headers: {
                  'x-client-id': appId,
                  'x-client-secret': secretKey,
                  'x-api-version': '2023-08-01',
                  'Accept': 'application/json'
                }
              });

              if (cfRes.ok) {
                const orderData: any = await cfRes.json();
                if (orderData.order_status === 'PAID') {
                  await query(
                    `UPDATE appointments 
                     SET status = 'Confirmed', 
                         payment_status = 'Paid',
                         visit_otp = COALESCE(NULLIF(visit_otp, ''), LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0')) 
                     WHERE appointment_id = $1`,
                    [row.appointment_id]
                  );
                  continue;
                }
              }

              const paymentsRes = await fetch(`${baseUrl}/orders/${orderId}/payments`, {
                method: 'GET',
                headers: {
                  'x-client-id': appId,
                  'x-client-secret': secretKey,
                  'x-api-version': '2023-08-01',
                  'Accept': 'application/json'
                }
              });

              if (paymentsRes.ok) {
                const paymentsData: any = await paymentsRes.json();
                if (Array.isArray(paymentsData) && paymentsData.some((p: any) => p.payment_status === 'SUCCESS')) {
                  await query(
                    `UPDATE appointments 
                     SET status = 'Confirmed', 
                         payment_status = 'Paid',
                         visit_otp = COALESCE(NULLIF(visit_otp, ''), LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0')) 
                     WHERE appointment_id = $1`,
                    [row.appointment_id]
                  );
                }
              }
            } catch (cfErr) {
              // Silently handle error
            }
          }
        }
      }
    } catch (e) {
      console.error('Error auto-verifying pending appointments:', e);
    }

    // 2. Fetch appointments, strictly excluding any Pending_Payment
    const result = await query(
      "SELECT * FROM appointments WHERE booked_by_user_id = $1 AND status != 'Pending_Payment' ORDER BY created_at DESC",
      [userId]
    );
    const today = startOfDay(new Date());

    return result.rows.map((r: any) => {
      const appDate = r.appointment_date instanceof Date ? r.appointment_date : parseISO(String(r.appointment_date));
      let status = r.status;
      if (isBefore(appDate, today) && (status === 'Confirmed' || status === 'Waiting')) {
        status = 'Missed';
      }
      const otp = r.visit_otp || (r.appointment_id ? (Math.abs(r.appointment_id.split('').reduce((acc: number, char: string) => acc * 31 + char.charCodeAt(0), 0)) % 900000 + 100000).toString() : '123456');
      if (!r.visit_otp && r.appointment_id) {
        query("UPDATE appointments SET visit_otp = $1 WHERE appointment_id = $2", [otp, r.appointment_id]).catch(() => {});
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
        tokenNumber: r.token_number || 1, visit_otp: otp, visitOtp: otp
      };
    }) as Appointment[];
  },

  async findById(id: string): Promise<Appointment | null> {
    const result = await query('SELECT * FROM appointments WHERE appointment_id = $1', [id]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    const otp = r.visit_otp || (r.appointment_id ? (Math.abs(r.appointment_id.split('').reduce((acc: number, char: string) => acc * 31 + char.charCodeAt(0), 0)) % 900000 + 100000).toString() : '123456');
    return {
      id: r.appointment_id, doctorId: r.doctor_id, doctorName: r.doctor_name,
      patientId: r.booked_by_user_id, patientName: r.patient_name,
      patientType: r.patient_type, patientAge: r.patient_age,
      patientGender: r.patient_gender, patientBloodGroup: r.patient_blood_group,
      date: r.appointment_date instanceof Date ? r.appointment_date.toISOString().split('T')[0] : String(r.appointment_date || ''),
      time: r.appointment_time_slot, current_symptoms: r.current_symptoms,
      consultation_fee_amount: r.consultation_fee_amount, payment_status: r.payment_status,
      transaction_id: r.transaction_id, status: r.status,
      tokenNumber: r.token_number || 1, visit_otp: otp, visitOtp: otp
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
      const otp = r.visit_otp || (r.appointment_id ? (Math.abs(r.appointment_id.split('').reduce((acc: number, char: string) => acc * 31 + char.charCodeAt(0), 0)) % 900000 + 100000).toString() : '123456');
      return {
        id: r.appointment_id, doctorId: r.doctor_id, doctorName: r.doctor_name,
        patientId: r.booked_by_user_id, patientName: r.patient_name,
        patientType: r.patient_type, patientAge: r.patient_age,
        patientGender: r.patient_gender, patientBloodGroup: r.patient_blood_group,
        date: localDate, time: r.appointment_time_slot,
        current_symptoms: r.current_symptoms, consultation_fee_amount: r.consultation_fee_amount,
        payment_status: r.payment_status, transaction_id: r.transaction_id,
        status: r.status, tokenNumber: r.token_number || 1, visit_otp: otp, visitOtp: otp
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
    // 1. Non-blocking Lazy Sweep: Fire & forget background sweep so slot read isn't blocked
    query(
      "UPDATE appointments SET status = 'Cancelled' WHERE status = 'Pending_Payment' AND created_at < NOW() - INTERVAL '15 minutes'"
    ).catch(err => console.error('Auto-cancel sweep error:', err));

    // 2. Fetch the actually confirmed and active slots
    const result = await query(
      "SELECT appointment_time_slot as time FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'Cancelled' AND NOT (status = 'Pending_Payment' AND created_at < NOW() - INTERVAL '15 minutes')",
      [doctorId, date]
    );
    return result.rows.map(r => String(r.time));
  },

  async reschedule(appId: string, newDate: string, newTime: string): Promise<void> {
    const app = await query("SELECT doctor_id, status FROM appointments WHERE appointment_id = $1", [appId]);
    if (!app.rows.length) throw new Error('Appointment not found');
    
    const { doctor_id: doctorId, status } = app.rows[0];
    if (status !== 'Confirmed') {
      throw new Error(`Appointments with status '${status}' cannot be rescheduled.`);
    }

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
