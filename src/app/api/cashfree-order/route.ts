import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // amount should be in rupees for cashfree, unlike razorpay which is paise
    const { amount, currency = 'INR', customer_id, customer_phone, customer_name } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least ₹1' },
        { status: 400 }
      );
    }

    const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';

    if (!appId || !secretKey) {
      console.error('Cashfree credentials missing in environment variables.');
      return NextResponse.json(
        { error: 'Payment gateway is not configured correctly.' },
        { status: 500 }
      );
    }

    const baseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        order_amount: amount,
        order_currency: currency,
        order_id: orderId,
        customer_details: {
          customer_id: customer_id || session.userId || `cust_${Date.now()}`,
          customer_phone: customer_phone || '9999999999',
          customer_name: customer_name || 'Doctivo User'
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://doctivo.in'}/verify?order_id=${orderId}`
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree Create Order Error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to create order with Cashfree' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      payment_session_id: data.payment_session_id,
      order_id: data.order_id,
      environment: env === 'PRODUCTION' ? 'production' : 'sandbox'
    });
  } catch (error: any) {
    console.error('Cashfree Create Order Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
