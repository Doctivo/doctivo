import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const res = await query(`
      SELECT 
        doctor_id, full_name, degree, specialty, experience, 
        consultation_fee, clinic_name, clinic_address, avatar_url, rating 
      FROM doctors
      ORDER BY rating DESC NULLS LAST
    `);

    return NextResponse.json({ success: true, doctors: res.rows });
  } catch (error: any) {
    console.error('API /v1/doctors Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
