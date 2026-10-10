'use server';

import { AppointmentService } from '@/server/services/appointment.service';
import { Appointment } from '@/types';
import { requireAuth, requireRoles } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/roles';
import { logger } from '@/lib/logger';

import crypto from 'crypto';

/**
 * Saves a new appointment to the appointments table and verifies payment signature if provided
 */
export async function createAppointment(app: Partial<Appointment>, razorpayData?: { order_id: string, payment_id: string, signature: string }) {
  const session = await requireAuth();
  if (session.userId !== app.patientId && session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Forbidden: You can only book appointments for your own account.');
  }

  // Verify payment if razorpayData is provided
  if (razorpayData && app.payment_mode === 'Online_UPI') {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) throw new Error('Payment gateway configuration error');
    
    const text = razorpayData.order_id + "|" + razorpayData.payment_id;
    const generated_signature = crypto.createHmac('sha256', key_secret).update(text).digest('hex');
    
    if (generated_signature !== razorpayData.signature) {
      throw new Error('Payment verification failed: Invalid signature');
    }
  }

  try {
    const data = await AppointmentService.createAppointment(app);
    return { success: true, data };
  } catch (error: any) {
    logger.error('CRITICAL ERROR during createAppointment:', { error: error.message });
    if (error.message.includes('already booked')) {
      return { success: false, error: 'This time slot is already booked. Please choose another slot.' };
    }
    return { success: false, error: error.message || 'Failed to record booking in database.' };
  }
}

/**
 * Creates a Pending Appointment in DB and generates Cashfree Payment Session
 */
export async function createPendingBooking(app: Partial<Appointment>, source?: string) {
  const session = await requireAuth();
  
  if (session.userId !== app.patientId && session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Forbidden: You can only book appointments for your own account.');
  }

  try {
    const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
    const baseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
    
    // Generate order ID
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 1. Force the appointment to Pending_Payment status so it reserves the slot in the DB immediately
    app.transaction_id = orderId;
    app.status = 'Pending_Payment' as any;
    app.payment_status = 'Pending';
    
    // 2. Save to DB first
    const dbResult = await AppointmentService.createAppointment(app);
    
    const { query } = await import('@/lib/db');
    let realPhone = '9999999999';
    try {
      const userRes = await query('SELECT phone FROM patients WHERE id = $1', [session.userId]);
      if (userRes.rowCount && userRes.rowCount > 0 && userRes.rows[0].phone) {
        const cleanP = userRes.rows[0].phone.replace(/\D/g, '').slice(-10);
        if (cleanP.length === 10) realPhone = cleanP;
      }
    } catch(e) {}

    // 3. Create Cashfree Order
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://doctivo.in'}/verify?order_id=${orderId}${source ? `&source=${encodeURIComponent(source)}` : ''}`;

    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': appId || '',
        'x-client-secret': secretKey || '',
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        order_amount: app.consultation_fee_amount,
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: session.userId,
          customer_phone: realPhone, 
          customer_name: app.patientName || 'Doctivo User'
        },
        order_meta: {
          return_url: returnUrl
        }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.payment_session_id) {
      console.error('Cashfree Create Order Failed:', data);
      // If Cashfree fails, we delete the pending appointment to free the slot
      await AppointmentService.updateAppointmentStatus(app.id!, 'Cancelled');
      throw new Error(data.message || 'Failed to generate payment_session_id from Cashfree');
    }

    return { 
      success: true, 
      payment_session_id: data.payment_session_id, 
      order_id: orderId, 
      environment: env === 'PRODUCTION' ? 'production' : 'sandbox',
      dbData: dbResult
    };

  } catch (error: any) {
    if (error.message.includes('already booked')) {
      return { success: false, error: 'This time slot is already booked. Please choose another slot.' };
    }
    return { success: false, error: error.message || 'Internal Server Error' };
  }
}

/**
 * 100% Custom Server-to-Server Payment API call to Cashfree (0% Cashfree UI Interface)
 */
export async function payWithCashfreeS2S(paymentSessionId: string, paymentMethod: any) {
  if (!paymentSessionId) {
    console.error('payWithCashfreeS2S: payment_session_id is missing or empty');
    return { success: false, error: 'payment_session_id is missing in the request. Please retry booking.' };
  }

  try {
    const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
    const baseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

    const response = await fetch(`${baseUrl}/orders/sessions`, {
      method: 'POST',
      headers: {
        'x-client-id': appId || '',
        'x-client-secret': secretKey || '',
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        payment_session_id: paymentSessionId,
        payment_method: paymentMethod
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Cashfree S2S Pay Error:', data);
      return { success: false, error: data.message || 'Payment initiation failed via API.' };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('payWithCashfreeS2S exception:', error);
    return { success: false, error: error.message || 'Server error initiating payment' };
  }
}

/**
 * Server-side verification of payment which marks the DB appointment as Confirmed
 */
export async function verifyAndConfirmBooking(orderId: string) {
  try {
    // 1. We must find the appointment by transaction_id = orderId
    const { query } = await import('@/lib/db');
    const appRes = await query('SELECT * FROM appointments WHERE transaction_id = $1', [orderId]);
    
    if (appRes.rowCount === 0) {
      return { success: false, error: 'No matching appointment found in database for this order.' };
    }
    
    const appointment = appRes.rows[0];
    
    if (appointment.status === 'Confirmed' && appointment.payment_status === 'Paid') {
      // Already confirmed (maybe via webhook or refresh)
      return { success: true, appointmentId: appointment.appointment_id, data: appointment };
    }

    const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
    const baseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

    // Fetch Order details from Cashfree
    const orderRes = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': appId || '',
        'x-client-secret': secretKey || '',
        'x-api-version': '2023-08-01',
        'Accept': 'application/json'
      }
    });

    const orderData = await orderRes.json();

    // Fetch Payments attempts from Cashfree
    const paymentsRes = await fetch(`${baseUrl}/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': appId || '',
        'x-client-secret': secretKey || '',
        'x-api-version': '2023-08-01',
        'Accept': 'application/json'
      }
    });

    const paymentsData = await paymentsRes.json();

    const isOrderPaid = orderRes.ok && orderData.order_status === 'PAID';
    const isPaymentSuccess = Array.isArray(paymentsData) && paymentsData.some((p: any) => p.payment_status === 'SUCCESS');

    if (isOrderPaid || isPaymentSuccess) {
      // Payment verified on server! Update DB to Confirmed
      await query("UPDATE appointments SET status = 'Confirmed', payment_status = 'Paid' WHERE appointment_id = $1", [appointment.appointment_id]);
      
      // Fetch the updated appointment to return token_number and visit_otp
      const updatedRes = await query('SELECT * FROM appointments WHERE appointment_id = $1', [appointment.appointment_id]);
      return { success: true, appointmentId: appointment.appointment_id, data: updatedRes.rows[0] };
    } else {
      // Payment NOT successful. Ensure DB status is NOT Paid.
      await query("UPDATE appointments SET status = 'Cancelled', payment_status = 'Failed' WHERE appointment_id = $1", [appointment.appointment_id]);
      return { success: false, error: 'Payment was not completed or failed verification.', appointmentId: appointment.appointment_id };
    }

  } catch (error: any) {
    return { success: false, error: error.message || 'Internal verification error' };
  }
}

/**
 * Fetches all appointments for a specific user and auto-handles missed visits
 */
export async function getUserAppointments(userId: string) {
  const session = await requireAuth();
  if (session.userId !== userId && session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN) {
    return []; 
  }
  try {
    return await AppointmentService.getUserAppointments(userId);
  } catch (error: any) {
    logger.error('Error fetching user appointments:', { error: error.message });
    return [];
  }
}

/**
 * Fetches a single appointment by its unique ID
 */
export async function getAppointmentById(id: string) {
  const session = await requireAuth();
  try {
    return await AppointmentService.getAppointmentById(id);
  } catch (error: any) {
    logger.error('Error fetching appointment by ID:', { error: error.message });
    return null;
  }
}

/**
 * Fetches all appointments for a specific doctor on a selected date, sorted by token number.
 */
export async function getDoctorAppointmentsForDate(doctorId: string, dateStr: string) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.ATTENDANT]);
  if (session.role === ROLES.DOCTOR && session.userId !== doctorId) throw new Error('Forbidden');
  try {
    return await AppointmentService.getDoctorAppointmentsForDate(doctorId, dateStr);
  } catch (error: any) {
    logger.error('Error fetching doctor appointments for date:', { error: error.message });
    return [];
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const session = await requireAuth(); 
  try {
    const existing = await AppointmentService.getAppointmentById(appointmentId);
    
    // Automatically trigger Cashfree Refund if cancelled by patient
    if (status === 'Cancelled' && existing?.payment_status === 'Paid' && existing?.transaction_id) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://doctivo.in';
      // Internal call to our own refund API using fetch (assuming full URL is available, or we can use local logic).
      // Actually since we are in Server Actions, we can just fetch our absolute URL or extract the refund logic.
      // To avoid absolute URL issues in server actions, we'll duplicate the Cashfree API call here for safety:
      
      const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY;
      const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
      const cfBaseUrl = env === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
      
      if (appId && secretKey) {
        // Fetch order amount first
        const orderRes = await fetch(`${cfBaseUrl}/orders/${existing.transaction_id}`, {
          method: 'GET',
          headers: { 'x-client-id': appId, 'x-client-secret': secretKey, 'x-api-version': '2023-08-01', 'Accept': 'application/json' }
        });
        
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          // Issue refund
          await fetch(`${cfBaseUrl}/orders/${existing.transaction_id}/refunds`, {
            method: 'POST',
            headers: { 'x-client-id': appId, 'x-client-secret': secretKey, 'x-api-version': '2023-08-01', 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              refund_amount: orderData.order_amount,
              refund_id: `refund_${Date.now()}_${appointmentId}`,
              refund_note: "Patient cancelled the appointment"
            })
          });
        }
      }
    }

    await AppointmentService.updateAppointmentStatus(appointmentId, status);
    return { success: true };
  } catch (error: any) {
    logger.error('Error updating appointment status:', { error: error.message });
    return { success: false, error: error.message };
  }
}

export async function verifyVisitOtp(appointmentId: string, otp: string) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.ATTENDANT]);
  try {
    await AppointmentService.verifyVisitOtp(appointmentId, otp);
    return { success: true };
  } catch (error: any) {
    logger.error('Error verifying OTP:', { error: error.message });
    return { success: false, error: error.message };
  }
}

export async function getBookedSlots(doctorId: string, date: string) {
  try {
    return await AppointmentService.getBookedSlots(doctorId, date);
  } catch (error: any) {
    logger.error('Error fetching booked slots:', { error: error.message });
    return [];
  }
}

export async function rescheduleAppointment(appId: string, newDate: string, newTime: string) {
  const session = await requireAuth();
  try {
    await AppointmentService.rescheduleAppointment(appId, newDate, newTime);
    return { success: true };
  } catch (error: any) {
    console.error('Reschedule error:', error);
    return { success: false, error: error.message || 'Failed to reschedule.' };
  }
}

/**
 * Fetches the real-time queue status for a specific appointment ID.
 * Calculates currently serving token, ahead count, and estimated time.
 */
export async function getLiveQueueStatus(appointmentId: string) {
  try {
    const { query } = await import('@/lib/db');
    
    // 1. Get the patient's appointment details
    const appRes = await query('SELECT * FROM appointments WHERE appointment_id = $1', [appointmentId]);
    if (appRes.rowCount === 0) return { success: false, error: 'Appointment not found' };
    
    const myApp = appRes.rows[0];
    
    // If it's cancelled or missed or pending payment, no queue tracking makes sense
    if (['Cancelled', 'Missed', 'Pending_Payment'].includes(myApp.status)) {
      return { success: false, error: `Queue tracking unavailable. Status: ${myApp.status}` };
    }

    // 2. Fetch all appointments for the SAME doctor on the SAME date to compute queue logic
    const queueRes = await query(
      "SELECT * FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status NOT IN ('Cancelled', 'Missed', 'Pending_Payment') ORDER BY token_number ASC",
      [myApp.doctor_id, myApp.appointment_date]
    );
    
    const allQueue = queueRes.rows;
    
    // 3. Find who is currently 'With Doctor'
    const withDoctor = allQueue.find(a => a.status === 'With Doctor');
    
    // Find the latest 'Completed' if no one is 'With Doctor'
    const completedList = allQueue.filter(a => a.status === 'Completed');
    const lastCompleted = completedList.length > 0 ? completedList[completedList.length - 1] : null;

    let currentServingToken = 0;
    if (withDoctor) {
      currentServingToken = withDoctor.token_number;
    } else if (lastCompleted) {
      currentServingToken = lastCompleted.token_number;
    }
    
    // 4. Calculate people ahead
    // People ahead are those who are 'Waiting' or 'Confirmed' and have a smaller token number than me
    const peopleAhead = allQueue.filter(a => 
      (a.status === 'Waiting' || a.status === 'Confirmed') && 
      a.token_number < myApp.token_number
    ).length;

    // Wait time: 10 mins per person ahead
    const avgConsultationMinutes = 10;
    const estWaitMinutes = peopleAhead * avgConsultationMinutes;

    return {
      success: true,
      data: {
        myToken: myApp.token_number,
        myStatus: myApp.status,
        currentServingToken,
        peopleAhead,
        estWaitMinutes,
        doctorName: myApp.doctor_name
      }
    };

  } catch (err: any) {
    logger.error('Queue Status Error:', err);
    return { success: false, error: 'Failed to load queue status.' };
  }
}

/**
 * Cancels a pending booking when payment sheet is closed by user
 */
export async function cancelPendingBooking(orderId: string) {
  try {
    if (!orderId) return { success: false };
    const { query } = await import('@/lib/db');
    await query("UPDATE appointments SET status = 'Cancelled' WHERE transaction_id = $1 AND status = 'Pending_Payment'", [orderId]);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
