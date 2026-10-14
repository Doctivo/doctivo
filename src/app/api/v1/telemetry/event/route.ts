import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { eventType, targetId, metadata, timestamp } = body;

    // Fast non-blocking ingestion (can be piped to analytics / Redis in prod)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Telemetry Event] ${eventType || 'UNKNOWN'}:`, {
        targetId,
        metadata,
        timestamp: timestamp || new Date().toISOString(),
      });
    }

    return NextResponse.json({ status: 'ok', recorded: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e.message }, { status: 200 });
  }
}
