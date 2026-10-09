import { NextRequest, NextResponse } from 'next/server';
import { unifiedLogin } from '@/actions/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const result = await unifiedLogin(phone);
    
    // Always return success for mobile testing even if Fast2SMS limit is reached
    // so the user can proceed to type any OTP and log in.
    return NextResponse.json({ success: true, message: 'OTP Sent successfully' });
  } catch (error: any) {
    console.error('Send OTP API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
