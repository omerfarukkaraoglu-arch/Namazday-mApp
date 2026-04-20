export interface UserJwtPayload {
  id: string;
  username: string;
  role: string;
  displayName: string;
  institutionId: string;
  institutionName?: string;
  [key: string]: any;
}

// Helper function for role checks to prevent case-sensitivity and whitespace issues
export const checkRole = (userRole: string | undefined, targetRole: string) => {
  if (!userRole) return false;
  return userRole.trim().toUpperCase() === targetRole.trim().toUpperCase();
};

/**
 * Checks if the user is a global system administrator with power over all institutions.
 */
export const isSystemAdmin = (userData: any) => {
  if (!userData) return false;
  const role = typeof userData === 'string' ? userData : userData.role;
  const username = typeof userData === 'object' ? userData.username : undefined;
  
  return checkRole(role, 'SYSTEM_ADMIN') || username === 'admin' || username === 'admin ';
};

/**
 * Universal admin privilege check.
 * Handles both role strings and full user objects for VIP bypass.
 * Returns true for SYSTEM_ADMIN, SUPER_ADMIN (Institution Admin), or 'admin' role.
 */
export const hasAdminPrivileges = (userData: any) => {
  if (!userData) return false;
  
  // Extract role and username
  const role = typeof userData === 'string' ? userData : userData.role;
  const username = typeof userData === 'object' ? userData.username : undefined;
  
  const hasRole = checkRole(role, 'SUPER_ADMIN') || 
                   checkRole(role, 'SYSTEM_ADMIN') || 
                   checkRole(role, 'admin') ||
                   checkRole(role, 'ADMIN');
  const isVIP = username === 'admin' || username === 'admin ';
  
  return hasRole || isVIP;
};

// VIP Bypass for the primary admin account
export const isVIPAdmin = (user: any) => {
  if (!user) return false;
  return user.username === 'admin' || user.username === 'admin ';
};

