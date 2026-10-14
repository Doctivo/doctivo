import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { AppointmentService } from '@/server/services/appointment.service';
import { AdminService } from '@/server/services/admin.service';
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
    const appPatientId = app.patientId || (app as any).patient_id;
    if (appPatientId && appPatientId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden: You can only cancel your own appointments' }, { status: 403 });
    }

    if (app.status === 'Cancelled') {
      return NextResponse.json({ error: 'Appointment is already cancelled' }, { status: 400 });
    }

    // Policy Rule: Check appointment date & time for refund calculation
    const appDateStr = String(app.date).split('T')[0];
    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    // Website Rule: Same-day appointments cannot be cancelled after 2:00 AM on the day of the appointment
    if (appDateStr === todayStr && now.getHours() >= 2) {
      return NextResponse.json({ 
        error: 'Appointments cannot be cancelled after 2:00 AM on the day of the appointment.' 
      }, { status: 400 });
    }

    // Dynamic Platform Fee from app_settings
    let platformFee = 49;
    try {
      const feeRes = await AdminService.getAppSetting('platform_fee');
      if (feeRes && feeRes.value) {
        const val = typeof feeRes.value === 'string' ? JSON.parse(feeRes.value) : feeRes.value;
        platformFee = val.enabled !== false ? Number(val.amount ?? 49) : 0;
      }
    } catch (_) {
      platformFee = 49;
    }

    let isEligibleForRefund = false;
    let refundAmount = 0;
    const fee = Number(app.consultation_fee_amount || (app as any).fee || 0);

    try {
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
      const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Refund Policy: 100% refund (minus platform fee) if cancelled at least 2 hours before scheduled slot
      if (diffHours >= 2.0) {
        isEligibleForRefund = true;
        refundAmount = Math.max(0, fee - platformFee);
      }
    } catch (_) {
      // Fallback: if date parsing fails, default to eligible if future date
      isEligibleForRefund = true;
      refundAmount = Math.max(0, fee - platformFee);
    }

    // Update appointment status to Cancelled
    await AppointmentService.updateAppointmentStatus(appointmentId, 'Cancelled');

    // Trigger Cashfree refund if paid and eligible
    let refundStatus = isEligibleForRefund ? 'Initiated (3-5 business days)' : 'Not Eligible (Cancelled within 2h)';
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
              refund_note: reason || 'Patient cancelled booking via Doctivo'
            })
          });

          if (cfRefundRes.ok) {
            refundStatus = 'Initiated (3-5 business days)';
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
      message: 'Booking cancelled successfully.',
      isEligibleForRefund,
      refundAmount,
      refundStatus,
      platformFeeDeducted: isEligibleForRefund ? platformFee : 0
    });

  } catch (error: any) {
    console.error('Error in POST /api/v1/appointments/cancel:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
