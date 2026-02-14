import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { hasRole, hasAnyRole } from '../../utils/roleUtils';

/**
 * RoleBasedAccess - Generic component for role-based route protection
 * Allows flexible role checking with single or multiple role requirements
 * 
 * @param {React.ReactNode} children - Component to render if user has required role(s)
 * @param {string|string[]} requiredRole - Single role or array of roles required
 * @param {boolean} requireAll - If true, user must have ALL roles; if false, ANY role (default: false)
 * @param {string} redirectTo - Path to redirect if access denied (default: '/')
 * 
 * @example
 * // Only superusers can access
 * <Route path="/admin" element={<RoleBasedAccess requiredRole="superuser"><AdminPanel /></RoleBasedAccess>} />
 * 
 * @example
 * // Either superuser or staff can access
 * <Route path="/moderation" element={<RoleBasedAccess requiredRole={["superuser", "staff"]}><Moderation /></RoleBasedAccess>} />
 * 
 * @example
 * // User must have both superuser AND staff roles
 * <Route path="/super-admin" element={<RoleBasedAccess requiredRole={["superuser", "staff"]} requireAll={true}><SuperAdmin /></RoleBasedAccess>} />
 */
export const RoleBasedAccess = ({
  children,
  requiredRole = [],
  requireAll = false,
  redirectTo = '/',
}) => {
  const { user, loading } = useUser();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in - redirect to signin
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check roles
  let hasAccess = false;

  if (Array.isArray(requiredRole)) {
    if (requiredRole.length === 0) {
      // If no roles specified, allow access
      hasAccess = true;
    } else if (requireAll) {
      // User must have ALL roles
      hasAccess = requiredRole.every((role) => hasRole(user, role));
    } else {
      // User must have ANY role
      hasAccess = hasAnyRole(user, requiredRole);
    }
  } else if (typeof requiredRole === 'string') {
    hasAccess = hasRole(user, requiredRole);
  }

  // If user doesn't have required role, redirect
  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  // User has required role - render component
  return children;
};

export default RoleBasedAccess;
