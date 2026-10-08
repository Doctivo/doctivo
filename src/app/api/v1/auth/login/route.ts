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

    // Standard Auth Verification (using our existing users table)
    const res = await query('SELECT user_id, role, name FROM users WHERE phone_number = $1', [phone]);
    
    if (res.rowCount === 0) {
      // Create new user for the mobile app if they don't exist
      const userId = `U_${Date.now()}`;
      await query('INSERT INTO users (user_id, phone_number, role, name) VALUES ($1, $2, $3, $4)', [userId, phone, 'PATIENT', 'New Patient']);
      
      const tokens = generateTokens(userId, 'PATIENT');
      return NextResponse.json({ success: true, ...tokens, user: { id: userId, role: 'PATIENT', phone } });
    }

    const user = res.rows[0];
    const tokens = generateTokens(user.user_id, user.role);

    return NextResponse.json({ 
      success: true, 
      ...tokens, 
      user: { id: user.user_id, role: user.role, name: user.name, phone }
    });

  } catch (error: any) {
    console.error('Mobile API Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
