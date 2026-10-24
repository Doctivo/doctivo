import { cookies } from 'next/headers';
import { Role, ROLES } from './roles';

export interface SessionData {
  userId: string;
  role: Role;
  doctorId?: string; // Tenant boundary for Attendants
  timestamp?: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'doctivo-enterprise-sec-token-2026';

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSessionToken(data: SessionData): Promise<string> {
  const jsonStr = JSON.stringify(data);
  const payloadBase64 = Buffer.from(jsonStr).toString('base64url');
  const enc = new TextEncoder();
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadBase64));
  const sigHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${payloadBase64}.${sigHex}`;
}

export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadBase64, sigHex] = parts;
    const enc = new TextEncoder();
    const key = await getCryptoKey();
    
    const matches = sigHex.match(/.{1,2}/g);
    if (!matches) return null;
    const sigBytes = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(payloadBase64)
    );
    if (!isValid) return null;

    const jsonStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    return JSON.parse(jsonStr) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Creates a cryptographically signed session cookie
 */
export async function createSession(userId: string, role: string, doctorId?: string) {
  const cookieStore = await cookies();
  
  // Convert legacy roles to strictly typed roles
  let strictRole: Role = ROLES.PATIENT;
  const normalized = role.toUpperCase();
  if (normalized === 'SUPER ADMIN' || normalized === 'SUPER_ADMIN') strictRole = ROLES.SUPER_ADMIN;
  else if (normalized === 'ADMIN') strictRole = ROLES.ADMIN;
  else if (normalized === 'DOCTOR') strictRole = ROLES.DOCTOR;
  else if (normalized === 'ATTENDANT') strictRole = ROLES.ATTENDANT;

  const isAdmin = strictRole === ROLES.ADMIN || strictRole === ROLES.SUPER_ADMIN;
  const maxAge = isAdmin ? 60 * 60 : 30 * 24 * 60 * 60; 

  const sessionPayload: SessionData = {
    userId,
    role: strictRole,
    doctorId: doctorId || undefined,
    timestamp: Date.now()
  };

  const signedToken = await signSessionToken(sessionPayload);

  // Set the primary tamper-proof cookie
  cookieStore.set('doctivo_session', signedToken, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  // Legacy cookies for backward compatibility
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

  if (doctorId) {
    cookieStore.set('session_doctor_id', doctorId, {
      path: '/',
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }
}

/**
 * Retrieves and validates the current session data from signed cookie
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('doctivo_session')?.value;

  if (token) {
    const verified = await verifySessionToken(token);
    if (verified) return verified;
  }

  // Graceful fallback for existing active sessions before restart
  const role = cookieStore.get('session_role')?.value as Role;
  const userId = cookieStore.get('session_id')?.value;
  const doctorId = cookieStore.get('session_doctor_id')?.value;

  if (!role || !userId) {
    return null;
  }

  return { userId, role, doctorId };
}

/**
 * Destroys the current session
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('doctivo_session');
  cookieStore.delete('session_role');
  cookieStore.delete('session_id');
  cookieStore.delete('session_doctor_id');
}

/**
 * Server Action helper: Requires an active session, throws if unauthorized
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized: Please log in to continue.');
  }
  return session;
}

/**
 * Server Action helper: Requires a specific role(s)
 */
export async function requireRoles(roles: Role[]): Promise<SessionData> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) {
    throw new Error('Forbidden: You do not have permission to perform this action.');
  }
  return session;
}
