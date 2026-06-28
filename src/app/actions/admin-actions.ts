'use server';

import { query } from '@/lib/db';

/**
 * Initializes all database tables in the correct order of dependency.
 * Includes migrations for missing columns and NOT NULL constraints.
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
        image_url TEXT,
        schedule JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Appointments Table
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        appointment_id VARCHAR(50) PRIMARY KEY,
        doctor_id VARCHAR(50) REFERENCES doctors(doctor_id),
        doctor_name VARCHAR(100),
        booked_by_user_id VARCHAR(50) REFERENCES patients(patient_id),
        patient_type VARCHAR(50),
        patient_name VARCHAR(100),
        appointment_date DATE,
        appointment_time_slot VARCHAR(50),
        current_symptoms TEXT,
        consultation_fee_amount INT,
        payment_status VARCHAR(50),
        payment_mode VARCHAR(50),
        transaction_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Confirmed',
        token_number INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Add token_number column if missing
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='token_number') THEN 
          ALTER TABLE appointments ADD COLUMN token_number INT DEFAULT 1; 
        END IF;
      END $$;
    `);

    // 5. Attendants Table
    await query(`
      CREATE TABLE IF NOT EXISTS attendants (
        attendant_id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        base_salary INT DEFAULT 10000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Payroll Adjustments Table
    await query(`
      CREATE TABLE IF NOT EXISTS payroll_adjustments (
        adjustment_id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) REFERENCES attendants(attendant_id),
        employee_name VARCHAR(100),
        type VARCHAR(20),
        amount INT,
        reason TEXT,
        processed_date DATE DEFAULT CURRENT_DATE,
        is_settled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Admins Table
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

    // Migration: Handle legacy 'name' column and NOT NULL constraints in admins table
    await query(`
      DO $$ 
      BEGIN 
        -- 1. Ensure full_name exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admins' AND column_name='full_name') THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admins' AND column_name='name') THEN
            ALTER TABLE admins RENAME COLUMN name TO full_name;
          ELSE
            ALTER TABLE admins ADD COLUMN full_name VARCHAR(100);
          END IF;
        END IF;

        -- 2. CRITICAL: Remove NOT NULL from legacy 'name' column if it still exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admins' AND column_name='name') THEN
          ALTER TABLE admins ALTER COLUMN name DROP NOT NULL;
        END IF;
      END $$;
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
      net_balance: parseInt(r.base_salary) + parseInt(r.total_bonuses) - parseInt(r.total_advances) - parseInt(r.total_penalties)
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

export async function addDoctorDirectly(doc: any) {
  const id = `DOC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  try {
    const result = await query(`
      INSERT INTO doctors (
        doctor_id, full_name, phone_number, email, specialty, 
        qualification, experience_years, clinic_address, is_approved, consultation_fee,
        start_time, end_time, slot_duration, image_url, schedule, working_days
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `, [
      id, doc.name, doc.phone, doc.email, doc.specialty, doc.qualification, 
      parseInt(doc.experience || '0'), doc.address, parseInt(doc.fees || '500'),
      doc.startTime || '09:00', doc.endTime || '17:00', parseInt(doc.slotDuration || '15'),
      doc.imageUrl || null, JSON.stringify(doc.schedule || {}), JSON.stringify(doc.working_days || [])
    ]);
    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDoctor(doctorId: string, doc: any) {
  try {
    await query(`
      UPDATE doctors SET
        full_name = $1, phone_number = $2, email = $3, specialty = $4,
        qualification = $5, experience_years = $6, clinic_address = $7,
        consultation_fee = $8, start_time = $9, end_time = $10,
        slot_duration = $11, image_url = $12, schedule = $13, working_days = $14
      WHERE doctor_id = $15
    `, [
      doc.full_name, doc.phone_number, doc.email, doc.specialty,
      doc.qualification, parseInt(String(doc.experience_years || '0')), doc.clinic_address,
      parseInt(String(doc.consultation_fee || '500')), doc.start_time, doc.end_time,
      parseInt(String(doc.slot_duration || '15')), doc.image_url, JSON.stringify(doc.schedule || {}),
      JSON.stringify(doc.working_days || []), doctorId
    ]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDoctorBilling(doctorId: string, data: any) {
  try {
    await query(`
      UPDATE doctors 
      SET allowed_free_attendants = $1, total_purchased_slots = $2, 
          allow_revenue_deduction = $3, current_active_campaign = $4
      WHERE doctor_id = $5
    `, [data.allowed_free_attendants, data.total_purchased_slots, data.allow_revenue_deduction, data.current_active_campaign, doctorId]);
    return { success: true };
  } catch (error) {
    return { success: false };
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
    console.error('createAdminUser Error:', error.message);
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

export async function adminLogin(email: string) {
  try {
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) return { success: false, error: 'Admin account not found' };
    return { success: true, admin: result.rows[0] };
  } catch (error) {
    return { success: false, error: 'System error during login' };
  }
}

export async function getAdminMetrics() {
  try {
    const doctorsCount = await query('SELECT COUNT(*) FROM doctors WHERE is_approved = true');
    const patientsCount = await query('SELECT COUNT(*) FROM patients');
    const activeBookings = await query("SELECT COUNT(*) FROM appointments WHERE status IN ('Waiting', 'In Consultation', 'Confirmed') AND appointment_date = CURRENT_DATE");
    const totalRevenue = await query("SELECT SUM(consultation_fee_amount) FROM appointments WHERE payment_status = 'Paid'");
    
    // Get last 7 days booking trend
    const trendResult = await query(`
      SELECT 
        TO_CHAR(appointment_date, 'Mon DD') as date,
        COUNT(*) as count
      FROM appointments 
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY appointment_date
      ORDER BY appointment_date ASC
    `);

    // Get specialty distribution
    const specialtyResult = await query(`
      SELECT specialty as name, COUNT(*) as value
      FROM doctors
      WHERE is_approved = true
      GROUP BY specialty
    `);

    return {
      activeDoctors: parseInt(doctorsCount.rows[0]?.count || '0'),
      totalPatients: parseInt(patientsCount.rows[0]?.count || '0'),
      liveBookings: parseInt(activeBookings.rows[0]?.count || '0'),
      grossRevenue: parseInt(totalRevenue.rows[0]?.sum || '0'),
      trendData: trendResult.rows || [],
      specialtyData: specialtyResult.rows || [],
    };
  } catch (error) {
    return { 
      activeDoctors: 0, 
      totalPatients: 0, 
      liveBookings: 0, 
      grossRevenue: 0,
      trendData: [],
      specialtyData: []
    };
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