'use server';

import { query } from '@/lib/db';
import { getPatientByPhone, getFamilyMembers } from './patient-actions';
import { getUserAppointments } from './appointment-actions';
import { cookies } from 'next/headers';

/**
 * Unified Login without OTP for Prototype/Speed.
 * Supports Patient (phone), Admin (email), Doctor (email/phone/ID), and Attendant (attendant_id).
 */
export async function unifiedLogin(identifier: string) {
  if (!identifier) {
    throw new Error('Login identifier is required');
  }

  const cookieStore = await cookies();

  try {
    // 1. Check if 10-digit phone number
    if (/^\d{10}$/.test(identifier)) {
      // Check if it is a Doctor's phone number first
      const docRes = await query('SELECT * FROM doctors WHERE phone_number = $1 OR phone_number = $2', [identifier, `+91${identifier}`]);
      if (docRes.rows.length > 0) {
        const doctorData = docRes.rows[0];
        cookieStore.set('session_role', 'Doctor', { path: '/', maxAge: 30 * 24 * 60 * 60 });
        cookieStore.set('session_id', doctorData.doctor_id, { path: '/', maxAge: 30 * 24 * 60 * 60 });
        return {
          success: true,
          role: 'Doctor',
          user: doctorData
        };
      }

      // Fallback: Patient check
      const existingUser = await getPatientByPhone(identifier);
      
      let patientData;
      let familyMembers: any[] = [];
      let appointments: any[] = [];
      let isNew = false;

      if (existingUser) {
        patientData = existingUser;
        const [members, apts] = await Promise.all([
          getFamilyMembers(existingUser.id),
          getUserAppointments(existingUser.id)
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

      // Set cookies for Patient
      cookieStore.set('session_role', 'Patient', { path: '/', maxAge: 30 * 24 * 60 * 60 }); // 30 days
      cookieStore.set('session_id', patientData.id, { path: '/', maxAge: 30 * 24 * 60 * 60 });

      return {
        success: true,
        role: 'Patient',
        newUser: isNew,
        user: patientData,
        familyMembers,
        appointments
      };
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
            email: emailLower
          };
        } else {
          return { success: false, error: otpRes.error || 'Failed to send OTP' };
        }
      }

      // Check Doctor Database
      const docRes = await query('SELECT * FROM doctors WHERE email = $1', [identifier]);
      if (docRes.rows.length > 0) {
        const doctorData = docRes.rows[0];
        cookieStore.set('session_role', 'Doctor', { path: '/', maxAge: 30 * 24 * 60 * 60 }); // 30 days
        cookieStore.set('session_id', doctorData.doctor_id, { path: '/', maxAge: 30 * 24 * 60 * 60 });
        return {
          success: true,
          role: 'Doctor',
          user: doctorData
        };
      }

      return { success: false, error: 'Access Denied: Invalid email' };
    }

    // 3. Check if Doctor ID (starts with DOC- and not DOC-USR-)
    if (identifier.toUpperCase().startsWith('DOC-') && !identifier.toUpperCase().startsWith('DOC-USR-')) {
      const docRes = await query('SELECT * FROM doctors WHERE doctor_id = $1 OR doctor_id = $2', [identifier, identifier.toUpperCase()]);
      if (docRes.rows.length > 0) {
        const doctorData = docRes.rows[0];
        cookieStore.set('session_role', 'Doctor', { path: '/', maxAge: 30 * 24 * 60 * 60 }); // 30 days
        cookieStore.set('session_id', doctorData.doctor_id, { path: '/', maxAge: 30 * 24 * 60 * 60 });
        return {
          success: true,
          role: 'Doctor',
          user: doctorData
        };
      }
    }

    // 4. Check if Attendant ID (e.g. ATT-123)
    const attendantRes = await query('SELECT * FROM attendants WHERE attendant_id = $1 OR attendant_id = $2', [identifier, identifier.toUpperCase()]);
    if (attendantRes.rows.length > 0) {
      const attendantData = attendantRes.rows[0];
      cookieStore.set('session_role', 'Attendant', { path: '/', maxAge: 30 * 24 * 60 * 60 }); // 30 days
      cookieStore.set('session_id', attendantData.attendant_id, { path: '/', maxAge: 30 * 24 * 60 * 60 });
      return {
        success: true,
        role: 'Attendant',
        user: attendantData
      };
    }

    return { success: false, error: 'Login failed: Invalid phone, email, doctor ID or attendant ID' };

  } catch (error: any) {
    console.error('Unified Login Error:', error.message);
    return { success: false, error: 'Database connection failed. Please try again.' };
  }
}

export async function logoutSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session_role');
  cookieStore.delete('session_id');
}

export async function sendAdminOtp(email: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    // 1. Purge expired OTPs
    await query("DELETE FROM otp_verifications WHERE expires_at < NOW();", []);

    // 3. Save to database (Expires in 10 minutes)
    await query(`
      INSERT INTO otp_verifications (email, otp, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
      ON CONFLICT (email)
      DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, created_at = CURRENT_TIMESTAMP;
    `, [email, otp]);

    // 4. Send email via Brevo API
    const apiKey = process.env.Brevo_api_key;
    if (!apiKey) {
      console.error('Brevo API key is not configured in environment variables.');
      return { success: false, error: 'Mail server configuration missing.' };
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Doctivo', email: 'gaurav@doctivo.in' },
        to: [{ email: email, name: 'Admin' }],
        subject: 'Doctivo Admin Verification OTP',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2563eb; margin: 0; font-weight: 900; letter-spacing: -0.5px;">Doctivo Admin</h2>
              <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: bold; letter-spacing: 2px; margin-top: 4px;">Security Verification</p>
            </div>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hello Admin,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">Use the following One-Time Password (OTP) to complete your login session. This code is valid for 10 minutes:</p>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; padding: 20px; background-color: #f8fafc; text-align: center; color: #2563eb; border-radius: 16px; margin: 25px 0; border: 2px dashed #e2e8f0;">
              ${otp}
            </div>
            <p style="color: #ef4444; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 0;">Do not share this OTP with anyone for security reasons.</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Brevo API request failed:', errText);
      return { success: true, localFallback: true };
    }

    return { success: true };
  } catch (error: any) {
    console.error('sendAdminOtp Error:', error.message);
    return { success: true, localFallback: true };
  }
}

export async function verifyAdminOtp(email: string, otp: string) {
  const cookieStore = await cookies();
  try {
    // 1. Purge expired OTPs
    await query("DELETE FROM otp_verifications WHERE expires_at < NOW();", []);

    // 2. Validate OTP
    const res = await query("SELECT * FROM otp_verifications WHERE email = $1 AND otp = $2 AND expires_at >= NOW();", [email, otp]);
    if (res.rows.length === 0) {
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    // 3. Delete verified OTP record
    await query("DELETE FROM otp_verifications WHERE email = $1;", [email]);

    // 4. Authenticate admin
    const emailLower = email.trim().toLowerCase();
    
    // Super Admin check
    const adminMails = (process.env.admin_mails || '').split(',').map(m => m.trim().toLowerCase());
    if (emailLower === 'admin@doctivo.com' || adminMails.includes(emailLower)) {
      const superAdminData = {
        admin_id: 'SUPER-1',
        full_name: 'Super Administrator',
        email: emailLower,
        role: 'Super Admin',
        permissions: {
          dashboard: { view: true, view_financials: true },
          doctors: { view: true, approve: true, suspend: true },
          bookings: { view: true, modify: true },
          payroll: { view: true, adjust: true, settle: true },
          exporter: { allow_export: true }
        }
      };
      cookieStore.set('session_role', 'Admin', { path: '/', maxAge: 60 * 60 });
      cookieStore.set('session_id', 'SUPER-1', { path: '/', maxAge: 60 * 60 });
      return {
        success: true,
        role: 'Admin',
        user: superAdminData
      };
    }

    // Sub-Admin Database lookup
    const adminRes = await query('SELECT * FROM admins WHERE email = $1', [emailLower]);
    if (adminRes.rows.length > 0) {
      const adminData = adminRes.rows[0];
      cookieStore.set('session_role', 'Admin', { path: '/', maxAge: 60 * 60 });
      cookieStore.set('session_id', adminData.admin_id || adminData.id || 'admin', { path: '/', maxAge: 60 * 60 });
      return {
        success: true,
        role: 'Admin',
        user: adminData
      };
    }

    return { success: false, error: 'Admin account record not found in database.' };
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
