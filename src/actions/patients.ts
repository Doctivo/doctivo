'use server';

import { UserProfile, Patient } from '@/types';
import { requireAuth } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/roles';
import { logger } from '@/lib/logger';
import { PatientService } from '@/server/services/patient.service';

/**
 * Fetches a patient profile by phone number.
 */
export async function getPatientByPhone(phone: string) {
  try {
    return await PatientService.getPatientByPhone(phone);
  } catch (error: any) {
    logger.error('getPatientByPhone Error::', { error: error.message || error });
    return null;
  }
}

/**
 * Fetches all family members for a primary user.
 */
export async function getFamilyMembers(primaryUserId: string) {
  try {
    return await PatientService.getFamilyMembers(primaryUserId);
  } catch (error: any) {
    logger.error('getFamilyMembers Error::', { error: error.message || error });
    return [];
  }
}

/**
 * Creates or updates a primary patient profile.
 */
export async function upsertPatientProfile(profile: Partial<UserProfile>) {
  const session = await requireAuth();
  if (profile.id && session.userId !== profile.id && session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Forbidden: You can only update your own profile.');
  }
  
  try {
    const data = await PatientService.upsertPatientProfile(profile);
    return { success: true, data };
  } catch (error: any) {
    console.error('Upsert Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Adds a new family member to the primary user's account.
 */
export async function addFamilyMember(member: Patient, primaryUserId: string) {
  const session = await requireAuth();
  if (session.userId !== primaryUserId && session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Forbidden: You can only add family members to your own account.');
  }

  try {
    const data = await PatientService.addFamilyMember(member, primaryUserId);
    return { success: true, data };
  } catch (error: any) {
    console.error('Add Family Member Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Updates an existing family member profile.
 */
export async function updateFamilyMember(member: Patient) {
  const session = await requireAuth();
  try {
    const data = await PatientService.updateFamilyMember(member);
    return { success: true, data };
  } catch (error: any) {
    console.error('Update Family Member Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Removes a family member.
 */
export async function removeFamilyMember(memberId: string) {
  const session = await requireAuth();
  try {
    await PatientService.removeFamilyMember(memberId);
    return { success: true };
  } catch (error: any) {
    logger.error('Remove Family Member Error::', { error: error.message || error });
    return { success: false, error: error.message || 'Failed to delete' };
  }
}

/**
 * Soft deletes a patient account.
 */
export async function deletePatientAccount(patientId: string) {
  const session = await requireAuth();
  if (session.userId !== patientId && session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Forbidden: You can only delete your own account.');
  }
  try {
    await PatientService.deletePatientAccount(patientId);
    return { success: true };
  } catch (error: any) {
    console.error('Delete Patient Account Error:', error.message);
    return { success: false, error: error.message };
  }
}

