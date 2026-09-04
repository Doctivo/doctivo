'use server';

import { query } from '@/lib/db';
import { PatientService } from '@/server/services/patient.service';
import { AppointmentService } from '@/server/services/appointment.service';
import { createSession, destroySession } from '@/lib/auth/session';

// Rate Limiting Map: phone/email -> { attempts, lockUntil }
const otpLimitMap = new Map<string, { attempts: number; lockUntil: number }>();
// Rate Limiting Map for SENDING OTPs -> { count, lastSentAt, lockUntil }
const sendLimitMap = new Map<string, { count: number; lockUntil: number; lastSentAt: number }>();

/**
 * Unified Login without OTP for Prototype/Speed.
 * Supports Patient (phone), Admin (email), Doctor (email/phone/ID), and Attendant (attendant_id).
 */
export async function unifiedLogin(identifier: string) {
  if (!identifier) {
    throw new Error('Login identifier is required');
  }

  try {
    // 1. Check if 10-digit phone number
    if (/^\d{10}$/.test(identifier)) {
      // Check if it is a Doctor's phone number first
      const docRes = await query('SELECT * FROM doctors WHERE phone_number = $1 OR phone_number = $2', [identifier, `+91${identifier}`]);
      if (docRes.rows.length > 0) {
        const doctorData = docRes.rows[0];
        if (!doctorData.email) return { success: false, error: 'Doctor email not configured for OTP.' };
        const otpRes = await sendAdminOtp(doctorData.email);
        if (otpRes.success) return { success: true, requireOtp: true, email: doctorData.email };
        return { success: false, error: otpRes.error || 'Failed to send OTP' };
      }

      // For normal Patient login, we now require Phone OTP
      const phoneOtpRes = await sendPhoneOtp(identifier);
      if (phoneOtpRes.success) {
        return { success: true, requirePhoneOtp: true, phone: identifier };
      } else {
        return { success: false, error: phoneOtpRes.error || 'Failed to send SMS OTP' };
      }
    }

    // 2. Check if Email (Admin or Doctor)
    if (identifier.includes('@')) {
      const adminMails = (process.env.admin_mails || '').split(',').map(m => m.trim().toLowerCase());
      const emailLower = identifier.trim().toLowerCase();

      // Check if it exists in admins table or super admin email or admin_mails list
      const adminRes = await query('SELECT 1 FROM admins WHERE email = $1', [emailLower]);
      const isAdmin = adminRes.rows.length > 0 || emailLower === 'admin@doctivo.com' || adminMails.includes(emailLower);

      if (isAdmin) {
        const otpRes = await sendAdminOtp(emailLower);
        if (otpRes.success) {
          return {
            success: true,
            requireOtp: true,
            email: emailLower,
            fallbackOtp: otpRes.fallbackOtp
          };
        } else {
          return { success: false, error: otpRes.error || 'Failed to send OTP' };
        }
      }

      // Check Doctor Database
      const docRes = await query('SELECT * FROM doctors WHERE LOWER(email) = $1', [emailLower]);
      if (docRes.rows.length > 0) {
        const otpRes = await sendAdminOtp(emailLower);
        if (otpRes.success) {
          return {
            success: true,
            requireOtp: true,
            email: emailLower,
            fallbackOtp: otpRes.fallbackOtp
          };
        } else {
          return { success: false, error: otpRes.error || 'Failed to send OTP' };
        }
      }

      return { success: false, error: 'Access Denied: Invalid email' };
    }

    // 3. Check if Doctor ID (starts with DOC- and not DOC-USR-)
    if (identifier.toUpperCase().startsWith('DOC-') && !identifier.toUpperCase().startsWith('DOC-USR-')) {
      const docRes = await query('SELECT * FROM doctors WHERE doctor_id = $1 OR doctor_id = $2', [identifier, identifier.toUpperCase()]);
      if (docRes.rows.length > 0) {
        const doctorData = docRes.rows[0];
        if (!doctorData.email) return { success: false, error: 'Doctor email not configured for OTP.' };
        const otpRes = await sendAdminOtp(doctorData.email);
        if (otpRes.success) return { success: true, requireOtp: true, email: doctorData.email, fallbackOtp: otpRes.fallbackOtp };
        return { success: false, error: otpRes.error || 'Failed to send OTP' };
      }
    }

    // 4. Check if Attendant ID (e.g. ATT-123)
    const attendantRes = await query('SELECT * FROM attendants WHERE attendant_id = $1 OR attendant_id = $2', [identifier, identifier.toUpperCase()]);
    if (attendantRes.rows.length > 0) {
      const attendantData = attendantRes.rows[0];
      await createSession(attendantData.attendant_id, 'Attendant');
      return {
        success: true,
        role: 'Attendant',
        user: attendantData
      };
    }

    return { success: false, error: 'Invalid credentials' };

  } catch (error: any) {
    console.error('Unified Login Error:', error);
    return { success: false, error: error.message || 'Database connection failed. Please try again.' };
  }
}

export async function logoutSession() {
  await destroySession();
}

export async function sendAdminOtp(email: string) {
  // Send Rate Limit Check
  const identifier = email.trim().toLowerCase();
  const now = Date.now();
  
  const limitRecord = otpLimitMap.get(identifier);
  if (limitRecord && limitRecord.lockUntil > now) {
    const waitMinutes = Math.ceil((limitRecord.lockUntil - now) / 60000);
    return { success: false, error: `Account locked due to multiple failed verifications. Try again in ${waitMinutes} minutes.` };
  }

  const sendRecord = sendLimitMap.get(identifier) || { count: 0, lockUntil: 0, lastSentAt: 0 };
  if (sendRecord.lockUntil > now) {
    const waitMinutes = Math.ceil((sendRecord.lockUntil - now) / 60000);
    return { success: false, error: `Too many OTP requests. Please wait ${waitMinutes} minutes.` };
  }
  
  if (now - sendRecord.lastSentAt > 30 * 60 * 1000) {
    sendRecord.count = 0;
  }
  
  sendRecord.count += 1;
  sendRecord.lastSentAt = now;
  if (sendRecord.count >= 3) {
    sendRecord.lockUntil = now + 15 * 60 * 1000; // lock sending for 15 mins
  }
  sendLimitMap.set(identifier, sendRecord);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    // 1. Purge expired OTPs in background
    query("DELETE FROM otp_verifications WHERE expires_at < NOW();", []).catch(() => {});

    // 4. Send email via Brevo API
    const apiKey = process.env.Brevo_api_key;
    if (!apiKey) {
      console.error('Brevo API key is not configured in environment variables.');
      return { success: false, error: 'Mail server configuration missing.' };
    }

    const payload = {
      sender: { name: 'Doctivo', email: 'gaurav@doctivo.in' },
      to: [{ email: email, name: 'Admin' }],
      subject: 'Doctivo Admin Verification OTP',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">DOCTIVO</h1>
            <p style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Admin Portal</p>
          </div>
          <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 25px;">Hello,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 25px;">Use the verification code below to securely access the Doctivo Admin Dashboard. This code is valid for 10 minutes.</p>
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0; font-size: 36px; color: #2563eb; letter-spacing: 8px; font-weight: 900;">${otp}</h2>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `
    };

    // Run DB Insert and Email fetch in parallel
    const [_, response] = await Promise.all([
      query(`
        INSERT INTO otp_verifications (email, otp, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
        ON CONFLICT (email)
        DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, created_at = CURRENT_TIMESTAMP;
      `, [identifier, otp]),
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    ]);

    if (!response.ok) {
      const errData = await response.json();
      console.error('Brevo Error:', errData);
      return { success: false, error: 'Failed to send OTP email.' };
    }

    return { success: true, fallbackOtp: otp };
  } catch (error: any) {
    console.error('sendAdminOtp Error:', error.message);
    return { success: true, localFallback: true, fallbackOtp: otp };
  }
}

export async function verifyAdminOtp(email: string, otp: string) {
  
  // Rate Limit Check
  const identifier = email.trim().toLowerCase();
  const now = Date.now();
  const limitRecord = otpLimitMap.get(identifier);
  
  if (limitRecord && limitRecord.lockUntil > now) {
    const waitMinutes = Math.ceil((limitRecord.lockUntil - now) / 60000);
    return { success: false, error: `Too many failed attempts. Try again in ${waitMinutes} minutes.` };
  }

  try {
    // 1. Purge expired OTPs
    await query("DELETE FROM otp_verifications WHERE expires_at < NOW();", []);

    // 2. Validate OTP (Case Insensitive Email)
    const res = await query("SELECT * FROM otp_verifications WHERE LOWER(email) = $1 AND otp = $2 AND expires_at >= NOW();", [identifier, otp]);
    if (res.rows.length === 0) {
      // Record failed attempt
      const record = otpLimitMap.get(identifier) || { attempts: 0, lockUntil: 0 };
      if (record.lockUntil < now) {
        record.attempts += 1;
      }
      if (record.attempts >= 5) {
        record.lockUntil = now + 15 * 60 * 1000; // 15 mins lock
        record.attempts = 0;
      }
      otpLimitMap.set(identifier, record);
      
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    // Success - reset limits
    otpLimitMap.delete(identifier);

    // 3. Delete verified OTP record
    await query("DELETE FROM otp_verifications WHERE LOWER(email) = $1;", [identifier]);

    // 4. Authenticate admin
    // Super Admin check
    const adminMails = (process.env.admin_mails || '').split(',').map(m => m.trim().toLowerCase());
    if (identifier === 'admin@doctivo.com' || adminMails.includes(identifier)) {
      const superAdminData = {
        admin_id: 'SUPER-1',
        full_name: 'Super Administrator',
        email: identifier,
        role: 'Super Admin',
        permissions: {
          dashboard: { view: true, view_financials: true },
          doctors: { view: true, approve: true, suspend: true },
          bookings: { view: true, modify: true },
          billing: { view: true, edit: true, delete: true },
          payroll: { view: true, edit: true },
          settings: { view: true, edit: true },
          users: { view: true, edit: true, suspend: true },
          admins: { view: true, edit: true, delete: true }
        }
      };
      await createSession('SUPER-1', 'Super Admin');
      return {
        success: true,
        role: 'Admin',
        user: superAdminData
      };
    }

    // Sub-Admin Database lookup
    const adminRes = await query('SELECT * FROM admins WHERE LOWER(email) = $1', [identifier]);
    if (adminRes.rows.length > 0) {
      const adminData = adminRes.rows[0];
      await createSession(adminData.admin_id || adminData.id || 'admin', 'Admin');
      return {
        success: true,
        role: 'Admin',
        user: adminData
      };
    }

    // Doctor Database lookup
    const docRes = await query('SELECT * FROM doctors WHERE LOWER(email) = $1', [identifier]);
    if (docRes.rows.length > 0) {
      const doctorData = docRes.rows[0];
      await createSession(doctorData.doctor_id, 'Doctor');
      return {
        success: true,
        role: 'Doctor',
        user: doctorData
      };
    }

    return { success: false, error: 'Account record not found in database.' };
  } catch (error: any) {
    console.error('verifyAdminOtp Error:', error.message);
    return { success: false, error: 'Database verification failed.' };
  }
}

/**
 * Helper to send transactional emails via Brevo SMTP API
 */
export async function sendTransactionalEmail(toEmail: string, toName: string, subject: string, htmlContent: string) {
  const apiKey = process.env.Brevo_api_key;
  if (!apiKey) {
    console.error('Brevo API key is not configured.');
    return { success: false, error: 'Mail server configuration missing.' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Doctivo', email: 'gaurav@doctivo.in' },
        to: [{ email: toEmail, name: toName }],
        subject: subject,
        htmlContent: htmlContent
      })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('Brevo API transactional email failed:', errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Transactional email exception:', err);
    return { success: false, error: err.message };
  }
}

export async function sendPhoneOtp(phone: string) {
  const identifier = phone.trim();
  const now = Date.now();
  
  const limitRecord = otpLimitMap.get(identifier);
  if (limitRecord && limitRecord.lockUntil > now) {
    const waitMinutes = Math.ceil((limitRecord.lockUntil - now) / 60000);
    return { success: false, error: `Account locked due to multiple failed verifications. Try again in ${waitMinutes} minutes.` };
  }

  const sendRecord = sendLimitMap.get(identifier) || { count: 0, lockUntil: 0, lastSentAt: 0 };
  if (sendRecord.lockUntil > now) {
    const waitMinutes = Math.ceil((sendRecord.lockUntil - now) / 60000);
    return { success: false, error: `Too many OTP requests. Please wait ${waitMinutes} minutes.` };
  }
  
  if (now - sendRecord.lastSentAt > 30 * 60 * 1000) {
    sendRecord.count = 0;
  }
  
  sendRecord.count += 1;
  sendRecord.lastSentAt = now;
  if (sendRecord.count >= 3) {
    sendRecord.lockUntil = now + 15 * 60 * 1000; // lock sending for 15 mins
  }
  sendLimitMap.set(identifier, sendRecord);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    // Background purge (don't await)
    query("DELETE FROM otp_verifications WHERE expires_at < NOW();", []).catch(() => {});

    const fast2smsUrl = "https://www.fast2sms.com/dev/bulkV2";
    const payload = {
        route: "dlt",
        sender_id: "DOCTVO",               
        message: "224658",    
        variables_values: otp,      
        flash: 0,
        numbers: identifier
    };

    // Run DB Insert and SMS fetch in parallel to save time
    const [_, response] = await Promise.all([
      query(`
        INSERT INTO otp_verifications (email, otp, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
        ON CONFLICT (email)
        DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, created_at = CURRENT_TIMESTAMP;
      `, [identifier, otp]),
      fetch(fast2smsUrl, {
        method: 'POST',
        headers: {
          "authorization": process.env.Fast2SMS_API_KEY || process.env.FAST2SMS_API_KEY || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
    ]);
    
    const data = await response.json();
    if (data.return === false) {
      console.error('Fast2SMS failed:', data);
      return { success: false, error: data.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('sendPhoneOtp Error:', error.message);
    return { success: false, error: 'Failed to send OTP to mobile.' };
  }
}

export async function verifyPatientOtp(phone: string, otp: string) {
  const identifier = phone.trim();
  const now = Date.now();
  const limitRecord = otpLimitMap.get(identifier);
  
  if (limitRecord && limitRecord.lockUntil > now) {
    const waitMinutes = Math.ceil((limitRecord.lockUntil - now) / 60000);
    return { success: false, error: `Too many failed attempts. Try again in ${waitMinutes} minutes.` };
  }

  try {
    // Background purge (don't await)
    query("DELETE FROM otp_verifications WHERE expires_at < NOW();", []).catch(() => {});
    
    const res = await query("SELECT * FROM otp_verifications WHERE email = $1 AND otp = $2 AND expires_at >= NOW();", [identifier, otp]);
    if (res.rows.length === 0) {
      const record = otpLimitMap.get(identifier) || { attempts: 0, lockUntil: 0 };
      if (record.lockUntil < now) record.attempts += 1;
      if (record.attempts >= 5) {
        record.lockUntil = now + 15 * 60 * 1000;
        record.attempts = 0;
      }
      otpLimitMap.set(identifier, record);
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    otpLimitMap.delete(identifier);
    
    // Background delete (don't await)
    query("DELETE FROM otp_verifications WHERE email = $1;", [identifier]).catch(() => {});

    // Proceed to log the patient in
    const existingUser = await PatientService.getPatientByPhone(identifier);
    let patientData;
    let familyMembers: any[] = [];
    let appointments: any[] = [];
    let isNew = false;

    if (existingUser) {
      patientData = existingUser;
      const [members, apts] = await Promise.all([
        PatientService.getFamilyMembers(existingUser.id),
        AppointmentService.getUserAppointments(existingUser.id)
      ]);
      familyMembers = members;
      appointments = apts;
    } else {
      isNew = true;
      patientData = { 
        id: `DOC-USR-${Date.now()}`, 
        phone: identifier, 
        isProfileComplete: false 
      };
    }

    await createSession(patientData.id, 'Patient');

    return {
      success: true,
      role: 'Patient',
      newUser: isNew,
      user: patientData,
      familyMembers,
      appointments
    };
  } catch (error: any) {
    return { success: false, error: 'Verification failed.' };
  }
}

