import { query } from '@/lib/db';
import { UserProfile, Patient } from '@/lib/types';

export const PatientRepository = {
  async findByPhone(phone: string): Promise<UserProfile | null> {
    const result = await query('SELECT * FROM patients WHERE phone_number = $1', [phone]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.patient_id,
      phone: row.phone_number,
      name: row.full_name,
      age: row.age?.toString(),
      gender: row.gender,
      height_cm: row.height_cm?.toString(),
      weight_kg: row.weight_kg?.toString(),
      blood_group: row.blood_group,
      state: row.state,
      city: row.city,
      area: row.area_society,
      pincode: row.pincode,
      secondaryPhone: row.secondary_phone,
      medicalHistory: row.past_medical_history,
      allergies: row.allergies_medications,
      isProfileComplete: row.is_profile_complete,
      imageUrl: row.image_url
    } as UserProfile;
  },

  async findFamilyMembers(primaryUserId: string): Promise<Patient[]> {
    if (!primaryUserId) return [];
    const result = await query('SELECT * FROM family_members WHERE primary_user_id = $1', [primaryUserId]);
    return result.rows.map((row: any) => ({
      id: row.member_id,
      name: row.full_name,
      age: row.age?.toString(),
      gender: row.gender,
      height_cm: row.height_cm?.toString(),
      weight_kg: row.weight_kg?.toString(),
      blood_group: row.blood_group,
      phone: row.phone_number,
      secondaryPhone: row.secondary_phone,
      medicalHistory: row.member_medical_history,
      allergies: row.member_allergies,
      relation: row.relationship,
      imageUrl: row.image_url
    })) as Patient[];
  },

  async upsertProfile(profile: Partial<UserProfile>): Promise<any> {
    const checkSql = 'SELECT patient_id FROM patients WHERE phone_number = $1';
    const checkResult = await query(checkSql, [profile.phone]);
    const existingId = checkResult.rows[0]?.patient_id;

    const sql = `
      INSERT INTO patients (
        patient_id, phone_number, full_name, age, gender, 
        height_cm, weight_kg, blood_group,
        state, city, area_society, pincode, secondary_phone,
        past_medical_history, allergies_medications, 
        is_profile_complete, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (phone_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        height_cm = EXCLUDED.height_cm,
        weight_kg = EXCLUDED.weight_kg,
        blood_group = EXCLUDED.blood_group,
        state = EXCLUDED.state,
        city = EXCLUDED.city,
        area_society = EXCLUDED.area_society,
        pincode = EXCLUDED.pincode,
        secondary_phone = EXCLUDED.secondary_phone,
        past_medical_history = EXCLUDED.past_medical_history,
        allergies_medications = EXCLUDED.allergies_medications,
        is_profile_complete = EXCLUDED.is_profile_complete,
        image_url = EXCLUDED.image_url
      RETURNING *;
    `;

    const values = [
      existingId || profile.id || `PAT-${Date.now()}`,
      profile.phone,
      profile.name,
      parseInt(String(profile.age || '0')),
      profile.gender || 'Male',
      parseFloat(String(profile.height_cm || '0')),
      parseFloat(String(profile.weight_kg || '0')),
      profile.blood_group || '',
      profile.state || '',
      profile.city || '',
      profile.area || '',
      profile.pincode || '',
      profile.secondaryPhone || '',
      profile.medicalHistory || '',
      profile.allergies || '',
      profile.isProfileComplete || false,
      profile.imageUrl || null
    ];

    const result = await query(sql, values);
    return result.rows[0];
  },

  async addFamilyMember(member: Patient, primaryUserId: string): Promise<any> {
    const sql = `
      INSERT INTO family_members (
        member_id, primary_user_id, relationship, full_name, age, gender, 
        height_cm, weight_kg, blood_group, phone_number, secondary_phone,
        member_medical_history, member_allergies, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const values = [
      member.id || `MEM-${Date.now()}`,
      primaryUserId,
      member.relation || 'Other',
      member.name,
      parseInt(String(member.age || '0')),
      member.gender || 'Male',
      parseFloat(String(member.height_cm || '0')),
      parseFloat(String(member.weight_kg || '0')),
      member.blood_group || '',
      member.phone || '',
      member.secondaryPhone || '',
      member.medicalHistory || '',
      member.allergies || '',
      member.imageUrl || null
    ];

    const result = await query(sql, values);
    return result.rows[0];
  },

  async updateFamilyMember(member: Patient): Promise<any> {
    const sql = `
      UPDATE family_members SET
        relationship = $1,
        full_name = $2,
        age = $3,
        gender = $4,
        height_cm = $5,
        weight_kg = $6,
        blood_group = $7,
        phone_number = $8,
        secondary_phone = $9,
        member_medical_history = $10,
        member_allergies = $11,
        image_url = $12
      WHERE member_id = $13
      RETURNING *;
    `;

    const values = [
      member.relation || 'Other',
      member.name,
      parseInt(String(member.age || '0')),
      member.gender || 'Male',
      parseFloat(String(member.height_cm || '0')),
      parseFloat(String(member.weight_kg || '0')),
      member.blood_group || '',
      member.phone || '',
      member.secondaryPhone || '',
      member.medicalHistory || '',
      member.allergies || '',
      member.imageUrl || null,
      member.id
    ];

    const result = await query(sql, values);
    return result.rows[0];
  },

  async removeFamilyMember(memberId: string): Promise<void> {
    await query('DELETE FROM family_members WHERE member_id = $1', [memberId]);
  },

  async deleteAccount(patientId: string): Promise<void> {
    await query(`
      UPDATE patients 
      SET 
        is_deleted = TRUE,
        phone_number = phone_number || '_DEL_' || EXTRACT(EPOCH FROM NOW())::INT
      WHERE patient_id = $1
    `, [patientId]);
  }
};
