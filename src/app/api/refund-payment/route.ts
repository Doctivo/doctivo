import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId, refundAmount } = await request.json(); // transactionId maps to order_id in our Cashfree setup

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID (Order ID) is required' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';

    if (!appId || !secretKey) {
      return NextResponse.json({ success: false, error: 'Payment gateway is not configured.' }, { status: 500 });
    }

    const baseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
    const refund_id = `refund_${Date.now()}`;

    // If refundAmount is not provided from frontend, we must fetch the order to get the full amount
    let refund_amount = refundAmount;
    if (!refund_amount) {
      const orderRes = await fetch(`${baseUrl}/orders/${transactionId}`, {
        method: 'GET',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
          'Accept': 'application/json'
        }
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        console.error('Cashfree Fetch Order Error:', orderData);
        return NextResponse.json({ success: false, error: 'Could not fetch order details for refund' }, { status: 500 });
      }
      refund_amount = orderData.order_amount;
    }

    // Process the refund
    const response = await fetch(`${baseUrl}/orders/${transactionId}/refunds`, {
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        refund_amount: refund_amount,
        refund_id: refund_id,
        refund_note: "Booking slot conflict or user cancellation"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree Refund Error:', data);
      return NextResponse.json({ success: false, error: data.message || 'Failed to process refund with Cashfree' }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Refund initiated successfully',
      refundId: data.cf_refund_id
    });

  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ success: false, error: 'Failed to process refund' }, { status: 500 });
  }
}
