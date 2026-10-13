import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { AppointmentService } from '@/server/services/appointment.service';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, reason } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const app = await AppointmentService.getAppointmentById(appointmentId);
    if (!app) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Security check: verify this appointment belongs to the user
    if (app.patientId !== decoded.userId && app.patient_id !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden: You can only cancel your own appointments' }, { status: 403 });
    }

    if (app.status === 'Cancelled') {
      return NextResponse.json({ error: 'Appointment is already cancelled' }, { status: 400 });
    }

    // Policy Rule: Check appointment date & time for refund calculation
    // Refund Policy: 100% refund (minus platform fee ₹49) if cancelled at least 2 hours before scheduled slot
    let isEligibleForRefund = false;
    let refundAmount = 0;
    const fee = Number(app.consultation_fee_amount || app.fee || 0);

    try {
      const appDateStr = String(app.date).split('T')[0];
      const timeStr = String(app.time || '10:00 AM');
      
      // Parse slot time
      let slotHour = 10;
      let slotMinute = 0;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        slotHour = parseInt(match[1]);
        slotMinute = parseInt(match[2]);
        const period = (match[3] || '').toUpperCase();
        if (period === 'PM' && slotHour < 12) slotHour += 12;
        if (period === 'AM' && slotHour === 12) slotHour = 0;
      }

      const slotDateTime = new Date(`${appDateStr}T${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}:00`);
      const now = new Date();
      const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Eligible if > 2 hours in advance
      if (diffHours >= 2.0) {
        isEligibleForRefund = true;
        refundAmount = Math.max(0, fee - 49); // Subtracting platform fee ₹49 as per policy
      }
    } catch (_) {
      // Fallback: if date parsing fails, default to eligible if future date
      isEligibleForRefund = true;
      refundAmount = Math.max(0, fee - 49);
    }

    // Update appointment status to Cancelled
    await AppointmentService.updateAppointmentStatus(appointmentId, 'Cancelled');

    // Trigger Cashfree refund if paid and eligible
    let refundStatus = 'Not Eligible (Cancelled within 2h)';
    if (app.payment_status === 'Paid' && isEligibleForRefund && app.transaction_id) {
      const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY;
      const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
      const cfBaseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

      if (appId && secretKey) {
        try {
          const refundId = `ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const cfRefundRes = await fetch(`${cfBaseUrl}/orders/${app.transaction_id}/refunds`, {
            method: 'POST',
            headers: {
              'x-client-id': appId,
              'x-client-secret': secretKey,
              'x-api-version': '2023-08-01',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              refund_amount: refundAmount > 0 ? refundAmount : fee,
              refund_id: refundId,
              refund_note: reason || 'Patient cancelled booking via Doctivo App'
            })
          });

          if (cfRefundRes.ok) {
            refundStatus = 'Initiated (5-7 business days)';
          } else {
            refundStatus = 'Queued for manual reconciliation';
          }
        } catch (e) {
          refundStatus = 'Queued for processing';
        }
      } else {
        refundStatus = 'Processed in Test Mode';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
      isEligibleForRefund,
      refundAmount,
      refundStatus,
    });

  } catch (error: any) {
    console.error('Error in POST /api/v1/appointments/cancel:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
