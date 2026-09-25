import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';

    if (!appId || !secretKey) {
      return NextResponse.json({ error: 'Payment gateway is not configured.' }, { status: 500 });
    }

    const baseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

    const response = await fetch(`${baseUrl}/orders/${order_id}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree Verify Error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to verify payment with Cashfree' },
        { status: response.status }
      );
    }

    // Cashfree returns an array of payments for the order. We look for a SUCCESS one.
    const successfulPayment = data.find((payment: any) => payment.payment_status === 'SUCCESS');

    if (successfulPayment) {
      return NextResponse.json({
        success: true,
        payment_status: 'SUCCESS',
        transaction_id: successfulPayment.cf_payment_id
      });
    } else {
      return NextResponse.json({
        success: false,
        payment_status: data[0]?.payment_status || 'FAILED'
      });
    }
  } catch (error: any) {
    console.error('Cashfree Verify Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
