import { cookies } from 'next/headers';
import { Role, ROLES } from './roles';

export interface SessionData {
  userId: string;
  role: Role;
}

/**
 * Creates a session by setting HTTP-only cookies
 */
export async function createSession(userId: string, role: string) {
  const cookieStore = await cookies();
  
  // Convert legacy roles to strictly typed roles
  let strictRole: Role = ROLES.PATIENT;
  if (role.toUpperCase() === 'SUPER ADMIN' || role.toUpperCase() === 'SUPER_ADMIN') strictRole = ROLES.SUPER_ADMIN;
  else if (role.toUpperCase() === 'ADMIN') strictRole = ROLES.ADMIN;
  else if (role.toUpperCase() === 'DOCTOR') strictRole = ROLES.DOCTOR;
  else if (role.toUpperCase() === 'ATTENDANT') strictRole = ROLES.ATTENDANT;

  // Max age logic: 30 days for general users, 1 hour for admins
  const isAdmin = strictRole === ROLES.ADMIN || strictRole === ROLES.SUPER_ADMIN;
  const maxAge = isAdmin ? 60 * 60 : 30 * 24 * 60 * 60; 

  cookieStore.set('session_role', strictRole, { 
    path: '/', 
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  cookieStore.set('session_id', userId, { 
    path: '/', 
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
}

/**
 * Retrieves the current session data from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get('session_role')?.value as Role;
  const userId = cookieStore.get('session_id')?.value;

  if (!role || !userId) {
    return null;
  }

  return { userId, role };
}

/**
 * Destroys the current session
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('session_role');
  cookieStore.delete('session_id');
}
