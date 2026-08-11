'use server';

import { query } from '@/lib/db';
import { cookies } from 'next/headers';

/**
 * Initializes all database tables and seeds sample data.
 * Updated to include patient vitals in appointments and staff management tables.
 */
export async function initializeDatabase() {
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

    return { success: true };
  } catch (error: any) {
    console.error('DB Init Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getEmployeePayroll() {
  try {
    const result = await query(`
      SELECT 
        a.*,
        COALESCE((SELECT SUM(amount) FROM payroll_adjustments WHERE employee_id = a.attendant_id AND type = 'Advance' AND is_settled = false), 0) as total_advances,
        COALESCE((SELECT SUM(amount) FROM payroll_adjustments WHERE employee_id = a.attendant_id AND type = 'Bonus' AND is_settled = false), 0) as total_bonuses,
        COALESCE((SELECT SUM(amount) FROM payroll_adjustments WHERE employee_id = a.attendant_id AND type = 'Penalty' AND is_settled = false), 0) as total_penalties
      FROM attendants a
    `);
    
    return result.rows.map(r => ({
      ...r,
      net_balance: parseInt(r.base_salary || '0') + parseInt(r.total_bonuses || '0') - parseInt(r.total_advances || '0') - parseInt(r.total_penalties || '0')
    }));
  } catch (error) {
    console.error('getEmployeePayroll Error:', error);
    return [];
  }
}

export async function adjustPayroll(data: any) {
  try {
    await query(`
      INSERT INTO payroll_adjustments (employee_id, employee_name, type, amount, reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [data.employeeId, data.employeeName, data.type, data.amount, data.reason]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function settlePayroll(employeeId: string) {
  try {
    await query('UPDATE payroll_adjustments SET is_settled = true WHERE employee_id = $1', [employeeId]);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getPayrollLogs() {
  try {
    const result = await query('SELECT * FROM payroll_adjustments ORDER BY created_at DESC LIMIT 50');
    return result.rows;
  } catch (error) {
    return [];
  }
}

export async function getDoctorsCatalog() {
  try {
    const result = await query('SELECT * FROM doctors ORDER BY created_at DESC');
    return result.rows || [];
  } catch (error) {
    return [];
  }
}

export async function getDoctorsByStatus(status: 'pending' | 'approved') {
  try {
    const isApproved = status === 'approved';
    const result = await query('SELECT * FROM doctors WHERE is_approved = $1 ORDER BY created_at DESC', [isApproved]);
    return result.rows || [];
  } catch (error) {
    return [];
  }
}

export async function updateDoctorBilling(doctorId: string, data: any) {
  try {
    await query(`
      UPDATE doctors SET
        allowed_free_attendants = $1,
        total_purchased_slots = $2,
        allow_revenue_deduction = $3,
        current_active_campaign = $4
      WHERE doctor_id = $5
    `, [
      data.allowed_free_attendants,
      data.total_purchased_slots,
      data.allow_revenue_deduction,
      data.current_active_campaign,
      doctorId
    ]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdminUsers() {
  try {
    const result = await query('SELECT * FROM admins ORDER BY created_at DESC');
    return result.rows || [];
  } catch (error) {
    return [];
  }
}

export async function createAdminUser(data: any) {
  const id = `ADM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  try {
    await query('INSERT INTO admins (admin_id, full_name, email, role, permissions) VALUES ($1, $2, $3, $4, $5)', [id, data.name, data.email, data.role, JSON.stringify(data.permissions || {})]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminUser(adminId: string) {
  try {
    await query('DELETE FROM admins WHERE admin_id = $1', [adminId]);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getAdminMetrics() {
  try {
    const doctorsCount = await query('SELECT COUNT(*) FROM doctors WHERE is_approved = true');
    const patientsCount = await query('SELECT COUNT(*) FROM patients');
    const activeBookings = await query("SELECT COUNT(*) FROM appointments WHERE status IN ('Waiting', 'In Consultation', 'Confirmed') AND appointment_date = CURRENT_DATE");
    const totalRevenue = await query("SELECT SUM(consultation_fee_amount) FROM appointments WHERE payment_status = 'Paid'");
    
    const trendResult = await query(`
      SELECT TO_CHAR(appointment_date, 'Mon DD') as date, COUNT(*) as count
      FROM appointments WHERE appointment_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY appointment_date ORDER BY appointment_date ASC
    `);

    const specialtyResult = await query(`
      SELECT specialty as name, COUNT(*) as value
      FROM doctors WHERE is_approved = true GROUP BY specialty
    `);

    return {
      activeDoctors: parseInt(doctorsCount.rows[0]?.count || '0'),
      totalPatients: parseInt(patientsCount.rows[0]?.count || '0'),
      liveBookings: parseInt(activeBookings.rows[0]?.count || '0'),
      grossRevenue: parseInt(totalRevenue.rows[0]?.sum || '0'),
      trendData: trendResult.rows.map((row: any) => ({ ...row, count: parseInt(row.count || '0') })) || [],
      specialtyData: specialtyResult.rows.map((row: any) => ({ ...row, value: parseInt(row.value || '0') })) || [],
    };
  } catch (error) {
    return { activeDoctors: 0, totalPatients: 0, liveBookings: 0, grossRevenue: 0, trendData: [], specialtyData: [] };
  }
}

export async function getAdminBookings() {
  try {
    const result = await query('SELECT * FROM appointments ORDER BY created_at DESC');
    return result.rows || [];
  } catch (error) {
    return [];
  }
}

export async function cancelAppointment(appointmentId: string) {
  try {
    await query("UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = $1", [appointmentId]);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getAllUsers(role: string) {
  try {
    const table = role === 'Doctor' ? 'doctors' : role === 'Patient' ? 'patients' : 'attendants';
    const result = await query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    return result.rows || [];
  } catch (error) {
    return [];
  }
}

export async function addDoctorDirectly(data: any) {
  const id = `DOC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  try {
    await query(`
      INSERT INTO doctors (
        doctor_id, full_name, phone_number, email, specialty, qualification, 
        experience_years, clinic_address, consultation_fee, is_approved,
        start_time, end_time, slot_duration, image_url, consultation_modes, reasons_for_visit, stops_booking_at_midnight
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12, $13, $14, $15, $16)
    `, [
      id, data.name, data.phone, data.email || null, data.specialty, data.qualification || '',
      parseInt(data.experience || '0'), data.address || '', parseInt(data.fees || '500'),
      data.startTime, data.endTime, parseInt(data.slotDuration || '15'), data.imageUrl || null,
      data.consultation_modes || 'Clinic,Home', JSON.stringify(data.reasons_for_visit || []),
      data.stops_booking_at_midnight || false
    ]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDoctor(doctorId: string, data: any) {
  try {
    await query(`
      UPDATE doctors SET
        full_name = $1, phone_number = $2, email = $3, specialty = $4, 
        qualification = $5, experience_years = $6, clinic_address = $7, 
        consultation_fee = $8, start_time = $9, end_time = $10, 
        slot_duration = $11, image_url = $12, consultation_modes = $13, reasons_for_visit = $14, stops_booking_at_midnight = $15
      WHERE doctor_id = $16
    `, [
      data.full_name, data.phone_number, data.email, data.specialty, data.qualification,
      data.experience_years, data.clinic_address, data.consultation_fee,
      data.start_time, data.end_time, data.slot_duration, data.image_url,
      data.consultation_modes, JSON.stringify(data.reasons_for_visit || []), data.stops_booking_at_midnight || false, doctorId
    ]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDoctor(doctorId: string) {
  try {
    await query('DELETE FROM doctors WHERE doctor_id = $1', [doctorId]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setAppSetting(key: string, value: any) {
  try {
    await query(`
      INSERT INTO app_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [key, JSON.stringify(value)]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAppSetting(key: string) {
  try {
    const res = await query('SELECT value FROM app_settings WHERE key = $1', [key]);
    if (res.rows.length > 0) {
      return { success: true, value: res.rows[0].value };
    }
    return { success: true, value: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
