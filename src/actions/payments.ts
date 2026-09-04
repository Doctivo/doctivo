
'use server';

import Razorpay from 'razorpay';

/**
 * Creates a Razorpay order for the specified amount.
 * Includes a fallback for prototype testing when API keys are missing.
 */
export async function createRazorpayOrder(amount: number) {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  // For prototyping: If keys are missing, we signal the client to use a mock payment
  if (!key_id || !key_secret) {
    console.warn('Razorpay keys missing. Entering Mock/Simulation mode.');
    return { 
      success: true, 
      isMock: true,
      amount: Math.round(amount * 100),
      error: 'Simulated Payment: No real transaction will occur.' 
    };
  }

  try {
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return { 
      success: true, 
      orderId: order.id, 
      amount: order.amount, 
      keyId: key_id,
      isMock: false
    };
  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create payment order' 
    };
  }
}
