import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}` } = body;

    // Validate minimum amount (100 paise = 1 INR)
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (₹1)' },
        { status: 400 }
      );
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('Razorpay credentials missing in environment variables.');
      return NextResponse.json(
        { error: 'Payment gateway is not configured correctly.' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount,
      currency,
      receipt,
      payment_capture: 1, // Auto capture
    };

    const order = await razorpay.orders.create(options);

    if (!order || !order.id) {
      return NextResponse.json(
        { error: 'Failed to create order with Razorpay' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    
    // Auth failure specific handling if razorpay throws it
    if (error.statusCode === 401 || error?.error?.code === 'BAD_REQUEST_ERROR') {
      return NextResponse.json(
        { error: 'Authentication Failed with Payment Gateway.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
