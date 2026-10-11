import { NextRequest, NextResponse } from 'next/server';
import { AppointmentService } from '@/server/services/appointment.service';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
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

    // AppointmentService.getUserAppointments already verifies pending payments and filters out Pending_Payment!
    const appointments = await AppointmentService.getUserAppointments(decoded.userId);

    return NextResponse.json({
      success: true,
      data: appointments || []
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
