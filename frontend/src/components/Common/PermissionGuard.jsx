import React from 'react';
import { useUser } from '../../context/UserContext';
import { canAccessDepartment } from '../../utils/roleUtils';

/**
 * PermissionGuard Component - Conditionally renders based on specific permissions
 * Currently checks department-based permissions
 * Can be extended for more granular permissions
 * 
 * @param {React.ReactNode} children - Content to render if user has permission
 * @param {number} departmentId - Department ID to check access for
 * @param {React.ReactNode} fallback - Content to render if no permission (optional)
 * @param {string} permission - Type of permission to check (future: 'view', 'edit', etc.)
 * 
 * @example
 * <PermissionGuard departmentId={5}>
 *   <DepartmentContent />
 * </PermissionGuard>
 */
const PermissionGuard = ({ 
  children, 
  departmentId, 
  fallback = null,
  permission = 'view' // 'view', 'edit', etc.
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

  // Check department access
  const hasAccess = canAccessDepartment(user, departmentId);

  if (!hasAccess) {
    return fallback;
  }

  // TODO: In future, add more granular permission checks
  // For now, just check if user can access the department
  // Example: 
  // if (permission === 'edit') {
  //   hasAccess = checkEditPermission(user, departmentId);
  // }

  return children;
};

export default PermissionGuard;
