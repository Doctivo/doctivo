import { NextRequest, NextResponse } from 'next/server';
import { verifyAndConfirmBooking } from '@/actions/appointments';
import { verifyAccessToken } from '@/lib/auth/jwt';
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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Security Check: Verify that this orderId belongs to the authenticated user (Prevents IDOR)
    const orderCheck = await query(
      'SELECT booked_by_user_id FROM appointments WHERE transaction_id = $1 OR appointment_id = $1',
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Appointment order not found' }, { status: 404 });
    }

    const bookedByUserId = orderCheck.rows[0].booked_by_user_id;
    const isOwner = bookedByUserId === decoded.userId;
    const isAdmin = decoded.role === 'SUPER_ADMIN' || decoded.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: You do not have permission to verify or view this appointment order' 
      }, { status: 403 });
    }

    // Use the existing server action to verify payment with Cashfree and update DB
    const verificationResult = await verifyAndConfirmBooking(orderId);

    if (verificationResult.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified and appointment confirmed',
        data: verificationResult.data 
      });
    } else {
      return NextResponse.json({ success: false, error: verificationResult.error || 'Payment not verified' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verify API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
