
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
      // Check Super Admin bypass
      if (identifier === 'admin@doctivo.com') {
        const superAdminData = {
          admin_id: 'SUPER-1',
          full_name: 'Super Administrator',
          email: 'admin@doctivo.com',
          role: 'Super Admin',
          permissions: {
            dashboard: { view: true, view_financials: true },
            doctors: { view: true, approve: true, suspend: true },
            bookings: { view: true, modify: true },
            payroll: { view: true, adjust: true, settle: true },
            exporter: { allow_export: true }
          }
        };
        cookieStore.set('session_role', 'Admin', { path: '/', maxAge: 30 * 60 }); // 30 minutes
        cookieStore.set('session_id', 'SUPER-1', { path: '/', maxAge: 30 * 60 });
        return {
          success: true,
          role: 'Admin',
          user: superAdminData
        };
      }

      // Check Admin Database
      const adminRes = await query('SELECT * FROM admins WHERE email = $1', [identifier]);
      if (adminRes.rows.length > 0) {
        const adminData = adminRes.rows[0];
        cookieStore.set('session_role', 'Admin', { path: '/', maxAge: 30 * 60 }); // 30 minutes
        cookieStore.set('session_id', adminData.admin_id || adminData.id || 'admin', { path: '/', maxAge: 30 * 60 });
        return {
          success: true,
          role: 'Admin',
          user: adminData
        };
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
