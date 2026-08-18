'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { requireRoles } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/roles';
import { AdminService } from '@/server/services/admin.service';
import { logger } from '@/lib/logger';

/**
 * Initializes all database tables and seeds sample data.
 * Updated to include patient vitals in appointments and staff management tables.
 */
export async function initializeDatabase() {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    // 1. Patients Table
    await query(`
      CREATE TABLE IF NOT EXISTS patients (
        patient_id VARCHAR(50) PRIMARY KEY,
        phone_number VARCHAR(15) UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        age INT,
        gender VARCHAR(20),
        height_cm DECIMAL,
        weight_kg DECIMAL,
        blood_group VARCHAR(10),
        state VARCHAR(100),
        city VARCHAR(100),
        area_society VARCHAR(255),
        pincode VARCHAR(20),
        secondary_phone VARCHAR(15),
        is_profile_complete BOOLEAN DEFAULT FALSE,
        image_url TEXT,
        past_medical_history TEXT,
        allergies_medications TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Family Members Table
    await query(`
      CREATE TABLE IF NOT EXISTS family_members (
        member_id VARCHAR(50) PRIMARY KEY,
        primary_user_id VARCHAR(50) REFERENCES patients(patient_id) ON DELETE CASCADE,
        relationship VARCHAR(50),
        full_name VARCHAR(100) NOT NULL,
        age INT,
        gender VARCHAR(20),
        height_cm DECIMAL,
        weight_kg DECIMAL,
        blood_group VARCHAR(10),
        phone_number VARCHAR(15),
        secondary_phone VARCHAR(15),
        member_medical_history TEXT,
        member_allergies TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Doctors Table
    await query(`
      CREATE TABLE IF NOT EXISTS doctors (
        doctor_id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(15),
        email VARCHAR(100) UNIQUE,
        specialty VARCHAR(100),
        qualification VARCHAR(255),
        experience_years INT DEFAULT 0,
        clinic_address TEXT,
        consultation_fee INT DEFAULT 500,
        is_approved BOOLEAN DEFAULT FALSE,
        start_time VARCHAR(10) DEFAULT '09:00',
        end_time VARCHAR(10) DEFAULT '17:00',
        slot_duration INT DEFAULT 15,
        allowed_free_attendants INT DEFAULT 1,
        total_purchased_slots INT DEFAULT 0,
        allow_revenue_deduction BOOLEAN DEFAULT FALSE,
        current_active_campaign VARCHAR(100),
        working_days JSONB DEFAULT '[]',
        custom_schedule JSONB DEFAULT '{}',
        reasons_for_visit JSONB DEFAULT '[]',
        consultation_modes VARCHAR(100) DEFAULT 'Clinic,Home',
        service_pincodes_str TEXT,
        latitude DECIMAL DEFAULT 26.7606,
        longitude DECIMAL DEFAULT 83.3731,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Attendants Table
    await query(`
      CREATE TABLE IF NOT EXISTS attendants (
        attendant_id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(15),
        email VARCHAR(100),
        doctor_id VARCHAR(50) REFERENCES doctors(doctor_id),
        base_salary INT DEFAULT 10000,
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4.5. App Settings Table
    await query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB
      );
    `);

    // 5. Appointments Table (With Vitals)
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        appointment_id VARCHAR(50) PRIMARY KEY,
        doctor_id VARCHAR(50) REFERENCES doctors(doctor_id),
        doctor_name VARCHAR(100),
        booked_by_user_id VARCHAR(50) REFERENCES patients(patient_id),
        patient_type VARCHAR(50),
        patient_name VARCHAR(100),
        patient_age VARCHAR(10),
        patient_gender VARCHAR(20),
        patient_blood_group VARCHAR(10),
        appointment_date DATE,
        appointment_time_slot VARCHAR(50),
        current_symptoms TEXT,
        consultation_fee_amount INT,
        payment_status VARCHAR(50),
        payment_mode VARCHAR(50),
        transaction_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Confirmed',
        token_number INT DEFAULT 1,
        visit_otp VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Add missing columns if table already exists
    const appCols = [
      ['patient_age', 'VARCHAR(10)'],
      ['patient_gender', 'VARCHAR(20)'],
      ['patient_blood_group', 'VARCHAR(10)']
    ];
    for (const [col, type] of appCols) {
      await query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='${col}') THEN 
            EXECUTE 'ALTER TABLE appointments ADD COLUMN ${col} ${type}';
          END IF;
        END $$;
      `);
    }

    // Migration for Patients: Add is_deleted
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='is_deleted') THEN 
          ALTER TABLE patients ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // Migration for Attendants: Rename name to full_name if it exists
    await query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendants' AND column_name='name') THEN 
          ALTER TABLE attendants RENAME COLUMN name TO full_name;
        END IF;
      END $$;
    `);

    // 6. Payroll Adjustments
    await query(`
      CREATE TABLE IF NOT EXISTS payroll_adjustments (
        adjustment_id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) REFERENCES attendants(attendant_id),
        employee_name VARCHAR(100),
        type VARCHAR(20), -- Advance, Bonus, Penalty
        amount INT,
        reason TEXT,
        is_settled BOOLEAN DEFAULT FALSE,
        processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. OTP Verifications
    await query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        email VARCHAR(100) PRIMARY KEY,
        otp VARCHAR(10),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Admins Table
    await query(`
      CREATE TABLE IF NOT EXISTS admins (
        admin_id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        role VARCHAR(50),
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 9. Audit Logs Table
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id SERIAL PRIMARY KEY,
        admin_id VARCHAR(50) REFERENCES admins(admin_id),
        action_type VARCHAR(100),
        target_id VARCHAR(50),
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return { success: true };
  } catch (error: any) {
    logger.error('DB Init Error::', { error: error.message || error });
    return { success: false, error: error.message };
  }
}

export async function getEmployeePayroll() {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    return await AdminService.getEmployeePayroll();
  } catch (error: any) {
    logger.error('getEmployeePayroll Error::', { error: error.message || error });
    return [];
  }
}

export async function adjustPayroll(data: any) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.adjustPayroll(data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function settlePayroll(employeeId: string) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.settlePayroll(employeeId);
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

export async function getPayrollLogs() {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    return await AdminService.getPayrollLogs();
  } catch (error: any) {
    return [];
  }
}

export async function getDoctorsCatalog() {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    return await AdminService.getDoctorsCatalog();
  } catch (error: any) {
    return [];
  }
}

export async function getDoctorsByStatus(status: 'pending' | 'approved') {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    return await AdminService.getDoctorsByStatus(status);
  } catch (error: any) {
    return [];
  }
}

export async function updateDoctorBilling(doctorId: string, data: any) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.updateDoctorBilling(doctorId, data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdminUsers() {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    return await AdminService.getAdminUsers();
  } catch (error: any) {
    return [];
  }
}

export async function createAdminUser(data: any) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.createAdminUser(data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminUser(adminId: string) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.deleteAdminUser(adminId);
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

export async function getAdminMetrics() {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    return await AdminService.getAdminMetrics();
  } catch (error: any) {
    return { activeDoctors: 0, totalPatients: 0, liveBookings: 0, grossRevenue: 0, trendData: [], specialtyData: [] };
  }
}

export async function getAdminBookings() {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    return await AdminService.getAdminBookings();
  } catch (error: any) {
    return [];
  }
}

export async function cancelAppointment(appointmentId: string) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.cancelAppointment(appointmentId);
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

export async function getAllUsers(role: string) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    return await AdminService.getAllUsers(role);
  } catch (error: any) {
    return [];
  }
}

export async function addDoctorDirectly(data: any) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.addDoctorDirectly(data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDoctor(doctorId: string, data: any) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.updateDoctor(doctorId, data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDoctor(doctorId: string) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.deleteDoctor(doctorId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setAppSetting(key: string, value: any) {
  await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.setAppSetting(key, value);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAppSetting(key: string) {
  try {
    return await AdminService.getAppSetting(key);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logAdminAction(adminId: string, actionType: string, targetId: string, details: any) {
  const session = await requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  try {
    await AdminService.logAdminAction(adminId, actionType, targetId, details);
    return { success: true };
  } catch (error: any) {
    logger.error('Audit Log Error::', { error: error.message || error });
    return { success: false, error: error.message };
  }
}


