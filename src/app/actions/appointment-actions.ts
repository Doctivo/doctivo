'use server';

import { query } from '@/lib/db';
import { Appointment } from '@/lib/types';

/**
 * Saves a new appointment to the appointments table
 */
export async function createAppointment(app: Partial<Appointment>) {
  try {
    // 1. Calculate the token number for this doctor on this day
    const tokenResult = await query(
      "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND appointment_date = $2",
      [app.doctorId, app.date]
    );
    const tokenNumber = parseInt(tokenResult.rows[0].count || '0') + 1;

    // 2. Insert the appointment
    const sql = `
      INSERT INTO appointments (
        appointment_id, doctor_id, doctor_name, booked_by_user_id, 
        patient_type, patient_name, appointment_date, appointment_time_slot,
        current_symptoms, consultation_fee_amount, payment_status, 
        payment_mode, transaction_id, status, token_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const values = [
      app.id,
      app.doctorId,
      app.doctorName,
      app.patientId, 
      app.patientType,
      app.patientName,
      app.date, 
      app.time,
      app.current_symptoms || '',
      app.consultation_fee_amount || 0,
      app.payment_status || 'Pending',
      app.payment_mode || 'Online_UPI',
      app.transaction_id || 'TXN-' + Date.now(),
      app.status || 'Confirmed',
      tokenNumber
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
 * Fetches all appointments for a specific user
 */
export async function getUserAppointments(userId: string) {
  try {
    const result = await query('SELECT * FROM appointments WHERE booked_by_user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows.map((r: any) => ({
      id: r.appointment_id,
      doctorId: r.doctor_id,
      doctorName: r.doctor_name,
      patientId: r.booked_by_user_id,
      patientName: r.patient_name,
      patientType: r.patient_type,
      date: r.appointment_date instanceof Date ? r.appointment_date.toISOString().split('T')[0] : String(r.appointment_date || ''),
      time: r.appointment_time_slot,
      current_symptoms: r.current_symptoms,
      consultation_fee_amount: r.consultation_fee_amount,
      payment_status: r.payment_status,
      transaction_id: r.transaction_id,
      status: r.status,
      tokenNumber: r.token_number || 1
    })) as Appointment[];
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    return [];
  }
}

/**
 * Fetches already booked slots for a specific doctor on a specific date
 */
export async function getBookedSlots(doctorId: string, date: string) {
  try {
    const result = await query(
      "SELECT appointment_time_slot FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status = 'Confirmed'",
      [doctorId, date]
    );
    return result.rows.map(r => r.appointment_time_slot) as string[];
  } catch (error) {
    console.error('Error fetching booked slots:', error);
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
      date: r.appointment_date instanceof Date ? r.appointment_date.toISOString().split('T')[0] : String(r.appointment_date || ''),
      time: r.appointment_time_slot,
      current_symptoms: r.current_symptoms,
      consultation_fee_amount: r.consultation_fee_amount,
      payment_status: r.payment_status,
      transaction_id: r.transaction_id,
      status: r.status,
      tokenNumber: r.token_number || 1
    } as Appointment;
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    return null;
  }
}
