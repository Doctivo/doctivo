'use server';

import { query } from '@/lib/db';
import { Appointment } from '@/lib/types';
import { isBefore, parseISO, startOfDay } from 'date-fns';

/**
 * Saves a new appointment to the appointments table
 */
export async function createAppointment(app: Partial<Appointment>) {
  try {
    // 0. Prevent double booking
    const existingCheck = await query(
      "SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time_slot = $3 AND status != 'Cancelled'",
      [app.doctorId, app.date, app.time]
    );
    if (existingCheck.rows.length > 0) {
      return { success: false, error: 'This time slot is already booked. Please choose another slot.' };
    }

    // 1. Calculate the token number for this doctor on this day
    const tokenResult = await query(
      "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND appointment_date = $2",
      [app.doctorId, app.date]
    );
    const tokenNumber = parseInt(tokenResult.rows[0].count || '0') + 1;

    // 2. Insert the appointment
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
      app.id,
      app.doctorId,
      app.doctorName,
      app.patientId, 
      app.patientType,
      app.patientName,
      app.patientAge || 'N/A',
      app.patientGender || 'N/A',
      app.patientBloodGroup || 'N/A',
      app.date, 
      app.time,
      app.current_symptoms || '',
      app.consultation_fee_amount || 0,
      app.payment_status || 'Pending',
      app.payment_mode || 'Online_UPI',
      app.transaction_id || 'TXN-' + Date.now(),
      app.status || 'Confirmed',
      tokenNumber,
      visitOtp
    ];

    const result = await query(sql, values);
    if (result.rowCount && result.rowCount > 0) {
      return { success: true, data: result.rows[0] };
    }
    return { success: false, error: 'Database accepted query but no rows were saved.' };
  } catch (error: any) {
    console.error('CRITICAL DB ERROR during createAppointment:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to record booking in database.' 
    };
  }
}

/**
 * Fetches all appointments for a specific user and auto-handles missed visits
 */
export async function getUserAppointments(userId: string) {
  try {
    const result = await query('SELECT * FROM appointments WHERE booked_by_user_id = $1 ORDER BY created_at DESC', [userId]);
    const today = startOfDay(new Date());

    return result.rows.map((r: any) => {
      const appDate = r.appointment_date instanceof Date ? r.appointment_date : parseISO(String(r.appointment_date));
      let status = r.status;

      if (isBefore(appDate, today) && (status === 'Confirmed' || status === 'Waiting')) {
        status = 'Missed';
      }

      return {
        id: r.appointment_id,
        doctorId: r.doctor_id,
        doctorName: r.doctor_name,
        patientId: r.booked_by_user_id,
        patientName: r.patient_name,
        patientType: r.patient_type,
        patientAge: r.patient_age,
        patientGender: r.patient_gender,
        patientBloodGroup: r.patient_blood_group,
        date: r.appointment_date instanceof Date ? r.appointment_date.toISOString().split('T')[0] : String(r.appointment_date || ''),
        time: r.appointment_time_slot,
        current_symptoms: r.current_symptoms,
        consultation_fee_amount: r.consultation_fee_amount,
        payment_status: r.payment_status,
        transaction_id: r.transaction_id,
        status: status,
        tokenNumber: r.token_number || 1,
        visit_otp: r.visit_otp
      };
    }) as Appointment[];
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    return [];
  }
}

/**
 * Fetches a single appointment by its unique ID
 */
export async function getAppointmentById(id: string) {
  try {
    const result = await query('SELECT * FROM appointments WHERE appointment_id = $1', [id]);
    if (result.rows.length === 0) return null;
    
    const r = result.rows[0];
    return {
      id: r.appointment_id,
      doctorId: r.doctor_id,
      doctorName: r.doctor_name,
      patientId: r.booked_by_user_id,
      patientName: r.patient_name,
      patientType: r.patient_type,
      patientAge: r.patient_age,
      patientGender: r.patient_gender,
      patientBloodGroup: r.patient_blood_group,
      date: r.appointment_date instanceof Date ? r.appointment_date.toISOString().split('T')[0] : String(r.appointment_date || ''),
      time: r.appointment_time_slot,
      current_symptoms: r.current_symptoms,
      consultation_fee_amount: r.consultation_fee_amount,
      payment_status: r.payment_status,
      transaction_id: r.transaction_id,
      status: r.status,
      tokenNumber: r.token_number || 1,
      visit_otp: r.visit_otp
    } as Appointment;
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    return null;
  }
}

/**
 * Fetches all appointments for a specific doctor on a selected date, sorted by token number.
 */
export async function getDoctorAppointmentsForDate(doctorId: string, dateStr: string) {
  try {
    const result = await query(
      'SELECT * FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 ORDER BY token_number ASC',
      [doctorId, dateStr]
    );

    return result.rows.map((r: any) => {
      const d = r.appointment_date instanceof Date ? r.appointment_date : new Date(r.appointment_date);
      const localDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

      return {
        id: r.appointment_id,
        doctorId: r.doctor_id,
        doctorName: r.doctor_name,
        patientId: r.booked_by_user_id,
        patientName: r.patient_name,
        patientType: r.patient_type,
        patientAge: r.patient_age,
        patientGender: r.patient_gender,
        patientBloodGroup: r.patient_blood_group,
        date: localDate,
        time: r.appointment_time_slot,
        current_symptoms: r.current_symptoms,
        consultation_fee_amount: r.consultation_fee_amount,
        payment_status: r.payment_status,
        transaction_id: r.transaction_id,
        status: r.status,
        tokenNumber: r.token_number || 1,
        visit_otp: r.visit_otp
      };
    });
  } catch (error) {
    console.error('Error fetching doctor appointments for date:', error);
    return [];
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  try {
    await query(
      'UPDATE appointments SET status = $1 WHERE appointment_id = $2',
      [status, appointmentId]
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyVisitOtp(appointmentId: string, otp: string) {
  try {
    const res = await query('SELECT visit_otp FROM appointments WHERE appointment_id = $1', [appointmentId]);
    if (res.rowCount === 0) return { success: false, error: 'Not found.' };
    if (res.rows[0].visit_otp !== otp) return { success: false, error: 'Incorrect OTP.' };
    
    await query("UPDATE appointments SET status = 'Completed', payment_status = 'Paid' WHERE appointment_id = $1", [appointmentId]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBookedSlots(doctorId: string, date: string) {
  try {
    const result = await query(
      "SELECT appointment_time_slot as time FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'Cancelled'",
      [doctorId, date]
    );
    return result.rows.map(r => String(r.time));
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return [];
  }
}
