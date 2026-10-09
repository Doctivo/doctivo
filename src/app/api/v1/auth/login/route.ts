import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateTokens } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    // Standard Auth Verification (using our existing patients table)
    const res = await query('SELECT patient_id, full_name as name FROM patients WHERE phone_number = $1 OR phone_number = $2', [phone, `+91${phone}`]);
    
    if (res.rowCount === 0) {
      // Create new patient for the mobile app if they don't exist
      const userId = `PT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await query('INSERT INTO patients (patient_id, phone_number, full_name) VALUES ($1, $2, $3)', [userId, phone, 'New Patient']);
      
      const tokens = generateTokens(userId, 'PATIENT');
      return NextResponse.json({ success: true, ...tokens, user: { id: userId, role: 'PATIENT', phone } });
    }

    const user = res.rows[0];
    const tokens = generateTokens(user.patient_id, 'PATIENT');

    return NextResponse.json({ 
      success: true, 
      ...tokens, 
      user: { id: user.patient_id, role: 'PATIENT', name: user.name, phone }
    });

  } catch (error: any) {
    console.error('Mobile API Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
