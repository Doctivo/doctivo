import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const res = await query(
      `SELECT patient_id, phone_number, full_name, age, gender, height_cm, weight_kg, 
              blood_group, state, city, area_society, pincode, secondary_phone, 
              past_medical_history, allergies_medications, is_profile_complete 
       FROM patients WHERE patient_id = $1`,
      [decoded.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: res.rows[0] });
  } catch (error: any) {
    console.error('Fetch patient profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName,
      age,
      gender,
      bloodGroup,
      heightCm,
      weightKg,
      city,
      state,
      pincode,
      areaSociety,
      secondaryPhone,
      pastMedicalHistory,
      allergiesMedications,
    } = body;

    const updateRes = await query(
      `UPDATE patients
       SET full_name = COALESCE($1, full_name),
           age = COALESCE($2, age),
           gender = COALESCE($3, gender),
           blood_group = COALESCE($4, blood_group),
           height_cm = COALESCE($5, height_cm),
           weight_kg = COALESCE($6, weight_kg),
           city = COALESCE($7, city),
           state = COALESCE($8, state),
           pincode = COALESCE($9, pincode),
           area_society = COALESCE($10, area_society),
           secondary_phone = COALESCE($11, secondary_phone),
           past_medical_history = COALESCE($12, past_medical_history),
           allergies_medications = COALESCE($13, allergies_medications),
           is_profile_complete = true
       WHERE patient_id = $14
       RETURNING *`,
      [
        fullName,
        age ? Number(age) : null,
        gender,
        bloodGroup,
        heightCm ? Number(heightCm) : null,
        weightKg ? Number(weightKg) : null,
        city,
        state,
        pincode,
        areaSociety,
        secondaryPhone,
        pastMedicalHistory,
        allergiesMedications,
        decoded.userId,
      ]
    );

    return NextResponse.json({ success: true, profile: updateRes.rows[0] });
  } catch (error: any) {
    console.error('Update patient profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { PatientService } = await import('@/server/services/patient.service');
    await PatientService.deletePatientAccount(decoded.userId);

    // Also cancel any active appointments for this patient
    await query(
      "UPDATE appointments SET status = 'Cancelled' WHERE booked_by_user_id = $1 AND status IN ('Confirmed', 'Waiting')",
      [decoded.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Account and personal medical data deleted permanently.',
    });
  } catch (error: any) {
    console.error('Delete patient account error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
