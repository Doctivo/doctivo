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

    const cleanPhone = phone.toString().replace(/^\+91/, '').replace(/\s+/g, '').trim();
    const inputOtp = otp.toString().trim();

    // 1. Google Play Store reviewer bypass (Allowed solely for 9999999999)
    const isPlayStoreReviewAccount = (cleanPhone === '9999999999' && inputOtp === '123456');

    if (!isPlayStoreReviewAccount) {
      // 2. Strict Live Verification against database otp_verifications table
      const otpRes = await query(
        `SELECT * FROM otp_verifications 
         WHERE (email = $1 OR email = $2) AND otp = $3 AND expires_at >= NOW()`,
        [cleanPhone, `+91${cleanPhone}`, inputOtp]
      );

      if (otpRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP. Please enter the valid 6-digit code received on your phone.' },
          { status: 401 }
        );
      }

      // 3. Delete used OTP immediately so it cannot be re-used
      await query(
        `DELETE FROM otp_verifications WHERE email = $1 OR email = $2`,
        [cleanPhone, `+91${cleanPhone}`]
      ).catch(() => {});
    }

    // 4. Standard Auth / Patient record lookup
    const res = await query(
      `SELECT patient_id, full_name as name, phone_number, age, gender, blood_group, city, is_profile_complete 
       FROM patients 
       WHERE phone_number = $1 OR phone_number = $2`,
      [cleanPhone, `+91${cleanPhone}`]
    );

    if (res.rowCount === 0) {
      // Create new patient for the mobile app if they don't exist
      const userId = `PT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await query(
        'INSERT INTO patients (patient_id, phone_number, full_name, is_profile_complete) VALUES ($1, $2, $3, false)',
        [userId, cleanPhone, 'New Patient']
      );

      const tokens = generateTokens(userId, 'PATIENT');
      return NextResponse.json({
        success: true,
        ...tokens,
        isNewUser: true,
        isProfileComplete: false,
        user: { id: userId, role: 'PATIENT', name: 'New Patient', phone: cleanPhone, isProfileComplete: false },
      });
    }

    const user = res.rows[0];
    const tokens = generateTokens(user.patient_id, 'PATIENT');
    const isProfileComplete = Boolean(
      user.is_profile_complete === true ||
      (user.name && user.name !== 'New Patient' && user.name !== 'Patient User' && user.age && user.gender)
    );

    return NextResponse.json({
      success: true,
      ...tokens,
      isNewUser: false,
      isProfileComplete,
      user: {
        id: user.patient_id,
        role: 'PATIENT',
        name: user.name,
        phone: user.phone_number || cleanPhone,
        bloodGroup: user.blood_group,
        age: user.age,
        gender: user.gender,
        city: user.city,
        isProfileComplete,
      },
    });
  } catch (error: any) {
    console.error('Mobile API Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
