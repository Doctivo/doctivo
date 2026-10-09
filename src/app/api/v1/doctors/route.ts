import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const res = await query(`
      SELECT *
      FROM doctors
      ORDER BY doctor_id DESC
    `);

    return NextResponse.json({ success: true, doctors: res.rows });
  } catch (error: any) {
    console.error('API /v1/doctors Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
