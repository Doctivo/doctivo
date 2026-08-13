import { Role, ROLES } from './roles';

export type Permission = 
  | 'view:dashboard'
  | 'view:financials'
  | 'manage:doctors'
  | 'manage:patients'
  | 'manage:bookings'
  | 'manage:billing'
  | 'manage:payroll'
  | 'manage:settings'
  | 'manage:users'
  | 'manage:admins'
  | 'book:appointment'
  | 'manage:appointments' // For own appointments
  | 'view:medical_records';

const rolePermissions: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [
    'view:dashboard', 'view:financials', 'manage:doctors', 'manage:patients', 
    'manage:bookings', 'manage:billing', 'manage:payroll', 'manage:settings', 
    'manage:users', 'manage:admins'
  ],
  [ROLES.ADMIN]: [
    'view:dashboard', 'manage:doctors', 'manage:patients', 'manage:bookings', 'manage:users'
  ],
  [ROLES.DOCTOR]: [
    'view:dashboard', 'manage:appointments', 'view:medical_records'
  ],
  [ROLES.PATIENT]: [
    'book:appointment', 'manage:appointments', 'view:medical_records'
  ],
  [ROLES.ATTENDANT]: [
    'manage:bookings', 'manage:patients'
  ]
};

/**
 * Check if a specific role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: Role, route: string): boolean {
  if (route.startsWith('/admin')) {
    return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
  }
  if (route.startsWith('/doctor')) {
    return role === ROLES.DOCTOR || role === ROLES.SUPER_ADMIN;
  }
  if (route.startsWith('/attendant')) {
    return role === ROLES.ATTENDANT || role === ROLES.SUPER_ADMIN;
  }
  // Public or generic authenticated routes (patients can access most standard routes)
  return true; 
}
