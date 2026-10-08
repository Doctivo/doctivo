import { NextRequest, NextResponse } from 'next/server';
import { generateTokens, verifyRefreshToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Generate new set of tokens
    const tokens = generateTokens(decoded.userId, decoded.role);

    return NextResponse.json({ success: true, ...tokens });

  } catch (error: any) {
    console.error('Refresh Token Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
