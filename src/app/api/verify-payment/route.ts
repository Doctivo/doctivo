import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error('Razorpay key secret missing');
      return NextResponse.json(
        { error: 'Payment gateway configuration error' },
        { status: 500 }
      );
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Signature matches
      return NextResponse.json({ success: true, message: 'Payment verified successfully' });
    } else {
      // Signature mismatch
      return NextResponse.json(
        { error: 'Payment verification failed: Invalid signature' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Verify Payment Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during verification' },
      { status: 500 }
    );
  }
}
