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
    
    if (result.success) {
      return NextResponse.json({ success: true, message: 'OTP Sent successfully' });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to send OTP' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Send OTP API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
