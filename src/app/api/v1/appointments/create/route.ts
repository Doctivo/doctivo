import { NextRequest, NextResponse } from 'next/server';
import { AppointmentService } from '@/server/services/appointment.service';
import { DoctorService } from '@/server/services/doctor.service';
import { query } from '@/lib/db';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate mobile user using JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await req.json();
    const { doctorId, date, time } = body;

    if (!doctorId || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Validate Slot
    const doctor = await DoctorService.getDoctorById(doctorId);
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const existingCheck = await query(
      "SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time_slot = $3 AND status != 'Cancelled'",
      [doctorId, date, time]
    );
    if (existingCheck.rows.length > 0) {
      return NextResponse.json({ error: 'This time slot was just booked by someone else.' }, { status: 409 });
    }

    // 3. Get User Details
    const userRes = await query("SELECT phone_number, full_name FROM patients WHERE patient_id = $1", [decoded.userId]);
    const phone = userRes.rows[0]?.phone_number || '9999999999';
    const patientName = userRes.rows[0]?.full_name || 'Mobile User';

    // 4. Create Pending Appointment
    const appointmentId = `APT_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const amount = Number(doctor.fees || 0);
    
    await query(`
      INSERT INTO appointments (appointment_id, booked_by_user_id, doctor_id, doctor_name, patient_name, appointment_date, appointment_time_slot, status, consultation_fee_amount, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending_Payment', $8, NOW())
    `, [appointmentId, decoded.userId, doctorId, doctor.name, patientName, date, time, amount]);

    // 5. Create Cashfree Order
    const orderData = {
      order_id: appointmentId,
      order_amount: amount > 0 ? amount : 1, // Minimum 1 INR
      order_currency: "INR",
      customer_details: {
        customer_id: decoded.userId,
        customer_phone: phone.replace('+91', ''),
        customer_name: patientName
      },
      order_meta: {
        return_url: "https://doctivo.in/verify?order_id={order_id}" // Fallback, not really used in mobile
      }
    };

    const clientId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID || '';
    const clientSecret = process.env.CASHFREE_SECRET_KEY || '';

    if (!clientId || !clientSecret) {
      console.warn("Missing Cashfree Keys! Bypassing Payment Gateway for testing.");
      return NextResponse.json({
        success: true,
        orderId: appointmentId,
        paymentSessionId: 'mock_session_' + Date.now(),
        environment: 'SANDBOX'
      });
    }

    const isSandbox = process.env.CASHFREE_ENVIRONMENT !== "PRODUCTION";
    const cashfreeUrl = isSandbox ? "https://sandbox.cashfree.com/pg/orders" : "https://api.cashfree.com/pg/orders";

    const cashfreeRes = await fetch(cashfreeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.NEXT_PUBLIC_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID || '',
        "x-client-secret": process.env.CASHFREE_SECRET_KEY || '',
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify(orderData)
    });

    const cashfreeResult = (await cashfreeRes.json()) as any;

    if (cashfreeResult.payment_session_id) {
      return NextResponse.json({ 
        success: true, 
        orderId: appointmentId, 
        paymentSessionId: cashfreeResult.payment_session_id,
        environment: isSandbox ? "SANDBOX" : "PRODUCTION"
      });
    } else {
      console.error("Cashfree Error:", cashfreeResult);
      return NextResponse.json({ error: 'Failed to initiate payment gateway.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API /v1/appointments/create Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
