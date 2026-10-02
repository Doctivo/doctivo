import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
    }

    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!secretKey) {
      console.error('CASHFREE_SECRET_KEY not found in environment');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Verify Cashfree Signature
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(timestamp + rawBody)
      .digest('base64');

    if (expectedSignature !== signature) {
      console.error('Webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Parse the payload safely after verification
    const payload = JSON.parse(rawBody);

    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = payload.data.order.order_id;
      
      // Mark as Paid and Confirmed
      await query(
        "UPDATE appointments SET status = 'Confirmed', payment_status = 'Paid' WHERE transaction_id = $1 AND status = 'Pending_Payment'",
        [orderId]
      );
      console.log(`Webhook: Order ${orderId} marked as Confirmed.`);

    } else if (payload.type === 'PAYMENT_FAILED_WEBHOOK' || payload.type === 'PAYMENT_USER_DROPPED_WEBHOOK') {
      const orderId = payload.data.order.order_id;

      // Free the slot instantly
      await query(
        "UPDATE appointments SET status = 'Cancelled' WHERE transaction_id = $1 AND status = 'Pending_Payment'",
        [orderId]
      );
      console.log(`Webhook: Order ${orderId} marked as Cancelled (Payment Failed).`);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
