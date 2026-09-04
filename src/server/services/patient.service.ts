import { PatientRepository } from '../repositories/patient.repository';
import { UserProfile, Patient } from '@/types';

/**
 * Validates a name to ensure it contains only alphabets and no abusive content.
 */
function validateName(name: string): string | null {
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return 'Name must contain only alphabets and spaces.';
  }
  const abusiveWords = ['abuse', 'fuck', 'shit', 'bitch', 'ass', 'bastard', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'fag', 'nigger', 'chutiya', 'bhosadike', 'madarchod', 'behenchod', 'gandu', 'randi', 'kamina', 'harami', 'kutta']; 
  const nameLower = name.toLowerCase();
  for (const word of abusiveWords) {
    if (nameLower.includes(word)) {
      return 'Name contains inappropriate or abusive content.';
    }
  }
  return null;
}

export const PatientService = {
  async getPatientByPhone(phone: string): Promise<UserProfile | null> {
    return await PatientRepository.findByPhone(phone);
  },

  async getFamilyMembers(primaryUserId: string): Promise<Patient[]> {
    return await PatientRepository.findFamilyMembers(primaryUserId);
  },

  async upsertPatientProfile(profile: Partial<UserProfile>) {
    if (!profile.name || !profile.phone) {
      throw new Error('Name and Phone are mandatory.');
    }

    const nameError = validateName(profile.name);
    if (nameError) {
      throw new Error(nameError);
    }

    const data = await PatientRepository.upsertProfile(profile);
    return data;
  },

  async addFamilyMember(member: Patient, primaryUserId: string) {
    if (!member.name) {
      throw new Error('Family member name is mandatory.');
    }
    const nameError = validateName(member.name);
    if (nameError) {
      throw new Error(nameError);
    }
    const data = await PatientRepository.addFamilyMember(member, primaryUserId);
    return data;
  },

  async updateFamilyMember(member: Patient) {
    if (!member.name) {
      throw new Error('Family member name is mandatory.');
    }
    const nameError = validateName(member.name);
    if (nameError) {
      throw new Error(nameError);
    }
    const data = await PatientRepository.updateFamilyMember(member);
    return data;
  },

  async removeFamilyMember(memberId: string) {
    await PatientRepository.removeFamilyMember(memberId);
  },

  async deletePatientAccount(patientId: string) {
    await PatientRepository.deleteAccount(patientId);
  }
};
