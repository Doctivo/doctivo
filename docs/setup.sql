 
-- DOCTIVO PLATFORM - POSTGRESQL SCHEMA SETUP
-- Run this in your Postgres SQL Editor

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    patient_id VARCHAR(255) PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    height_cm NUMERIC,
    weight_kg NUMERIC,
    blood_group VARCHAR(10),
    state VARCHAR(100),
    city VARCHAR(100),
    area_society TEXT,
    pincode VARCHAR(10),
    onboarding_symptoms JSONB DEFAULT '[]',
    past_medical_history TEXT,
    allergies_medications TEXT,
    is_profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Family Members Table
CREATE TABLE IF NOT EXISTS family_members (
    member_id VARCHAR(255) PRIMARY KEY,
    primary_user_id VARCHAR(255) REFERENCES patients(patient_id),
    relationship VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    height_cm NUMERIC,
    weight_kg NUMERIC,
    blood_group VARCHAR(10),
    member_medical_history TEXT,
    member_allergies TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualification VARCHAR(255),
    experience_years INTEGER,
    consultation_fee INTEGER DEFAULT 0,
    clinic_address TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    added_by VARCHAR(255),
    working_days JSONB DEFAULT '[]',
    available_slots JSONB DEFAULT '[]',
    blocked_holidays JSONB DEFAULT '[]',
    blocked_slots JSONB DEFAULT '[]',
    allowed_free_attendants INTEGER DEFAULT 1,
    total_purchased_slots INTEGER DEFAULT 0,
    current_active_campaign VARCHAR(255),
    campaign_validity_end DATE,
    allow_revenue_deduction BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Attendants Table
CREATE TABLE IF NOT EXISTS attendants (
    attendant_id VARCHAR(255) PRIMARY KEY,
    doctor_id VARCHAR(255) REFERENCES doctors(doctor_id),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    account_status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id VARCHAR(255) PRIMARY KEY,
    doctor_id VARCHAR(255) REFERENCES doctors(doctor_id),
    doctor_name VARCHAR(255),
    booked_by_user_id VARCHAR(255) REFERENCES patients(patient_id),
    patient_type VARCHAR(50),
    patient_name VARCHAR(255),
    appointment_date VARCHAR(50),
    appointment_time_slot VARCHAR(20),
    current_symptoms TEXT,
    consultation_fee_amount INTEGER,
    payment_status VARCHAR(50),
    payment_mode VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_by VARCHAR(50),
    cancellation_reason TEXT,
    refund_status VARCHAR(50) DEFAULT 'Not Applicable',
    refund_transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Confirmed'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(booked_by_user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
