import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const appointmentId = (await params).id;
    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
    }

    // 1. Fetch Appointment
    const appRes = await query(
      `SELECT a.appointment_id, a.doctor_id, a.doctor_name, a.token_number, 
              a.status, a.appointment_date, a.appointment_time_slot,
              d.clinic_name, d.clinic_address, d.phone_number, d.slot_duration
       FROM appointments a
       LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.appointment_id = $1`,
      [appointmentId]
    );

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const app = appRes.rows[0];
    const doctorId = app.doctor_id;
    const dateStr = String(app.appointment_date).split('T')[0];
    const myToken = Number(app.token_number || 1);

    // 2. Query currently serving / highest completed token for this doctor on this day
    const queueRes = await query(
      `SELECT 
         COALESCE(MAX(CASE WHEN status = 'In Consultation' THEN token_number END),
                  MAX(CASE WHEN status = 'Completed' THEN token_number END),
                  0) as current_serving
       FROM appointments
       WHERE doctor_id = $1 
         AND appointment_date = $2 
         AND status != 'Cancelled'`,
      [doctorId, dateStr]
    );

    const currentServingToken = Number(queueRes.rows[0]?.current_serving || 0);
    const peopleAhead = Math.max(0, myToken - currentServingToken - 1);
    const slotDuration = Number(app.slot_duration || 10);
    const estWaitMinutes = peopleAhead * slotDuration;

    return NextResponse.json({
      success: true,
      data: {
        appointmentId: app.appointment_id,
        doctorName: app.doctor_name,
        clinicName: app.clinic_name || 'Clinic',
        clinicAddress: app.clinic_address || '',
        doctorPhone: app.phone_number || '',
        myToken,
        myStatus: app.status,
        currentServingToken,
        peopleAhead,
        estWaitMinutes
      }
    });
  } catch (error: any) {
    console.error('Error fetching queue status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
