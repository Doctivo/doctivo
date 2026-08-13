import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { txnId } = await request.json();

    if (!txnId) {
      return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
    }

    // MOCK REFUND LOGIC
    // In a real application, you would call Razorpay refund API here:
    // const refund = await razorpay.payments.refund(txnId, { speed: 'optimum' });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({ 
      success: true, 
      message: 'Refund initiated successfully',
      refundId: 'rfnd_' + Math.random().toString(36).substring(2, 10)
    });

  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ success: false, error: 'Failed to process refund' }, { status: 500 });
  }
}
