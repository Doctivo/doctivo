import { NextRequest, NextResponse } from 'next/server';
import { unifiedLogin } from '@/actions/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phone.toString().replace(/^\+91/, '').replace(/\s+/g, '').trim();

    if (!/^\d{10}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    // Google Play Store Reviewer test account (Required by Google review policy)
    if (cleanPhone === '9999999999') {
      await query(
        `INSERT INTO otp_verifications (email, otp, expires_at)
         VALUES ($1, '123456', NOW() + INTERVAL '30 minutes')
         ON CONFLICT (email)
         DO UPDATE SET otp = '123456', expires_at = NOW() + INTERVAL '30 minutes', created_at = CURRENT_TIMESTAMP;`,
        [cleanPhone]
      ).catch(() => {});

      return NextResponse.json({ success: true, message: 'OTP sent successfully (Review Account)' });
    }

    // Send real live OTP via Fast2SMS DLT route
    const result = await unifiedLogin(cleanPhone);

    if (result && result.success === false) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch live SMS OTP. Please check SMS balance or try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Live OTP sent successfully via SMS' });
  } catch (error: any) {
    console.error('Send OTP API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
