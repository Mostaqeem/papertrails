import React from 'react';
import { useUser } from '../../context/UserContext';
import { hasRole } from '../../utils/roleUtils';

/**
 * RoleGuard Component - Conditionally renders children based on user role
 * 
 * @param {React.ReactNode} children - Content to render if user has required role
 * @param {string|string[]} role - Role(s) required to see children
 * @param {React.ReactNode} fallback - Content to render if user doesn't have role (optional)
 * @param {string} requiresAll - If true, user must have ALL roles; if false, ANY role (default: false)
 * 
 * @example
 * <RoleGuard role="superuser">
 *   <ConfigurationMenu />
 * </RoleGuard>
 * 
 * @example
 * <RoleGuard role={["superuser", "staff"]} requiresAll={false}>
 *   <AdminPanel />
 *   <p>You don't have access</p>
 * </RoleGuard>
 */
const RoleGuard = ({ 
  children, 
  role, 
  fallback = null, 
  requiresAll = false 
}) => {
  const { user, loading } = useUser();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // If no user, show fallback
  if (!user) {
    return fallback;
  }

  // Check roles
  let hasAccess = false;

  if (Array.isArray(role)) {
    if (requiresAll) {
      hasAccess = role.every((r) => hasRole(user, r));
    } else {
      hasAccess = role.some((r) => hasRole(user, r));
    }
  } else {
    hasAccess = hasRole(user, role);
  }

  return hasAccess ? children : fallback;
};

export default RoleGuard;
