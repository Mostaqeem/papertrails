/**
 * Utility functions for role and permission checking
 */

/**
 * Check if user is a superuser
 * @param {Object} user - User object from context or localStorage
 * @returns {boolean}
 */
export const isSuperuser = (user) => {
  return user && user.is_superuser === true;
};

/**
 * Check if user is staff/admin
 * @param {Object} user - User object from context or localStorage
 * @returns {boolean}
 */
export const isStaff = (user) => {
  return user && user.is_staff === true;
};

/**
 * Check if user is executive
 * @param {Object} user - User object from context or localStorage
 * @returns {boolean}
 */
export const isExecutive = (user) => {
  return user && user.is_executive === true;
};

/**
 * Check if user has specific role
 * @param {Object} user - User object from context or localStorage
 * @param {string} role - Role to check ('superuser', 'staff', 'executive')
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  if (!user) return false;

  const roleChecks = {
    superuser: () => isSuperuser(user),
    staff: () => isStaff(user),
    executive: () => isExecutive(user),
  };

  const checker = roleChecks[role.toLowerCase()];
  return checker ? checker() : false;
};

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object from context or localStorage
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean}
 */
export const hasAnyRole = (user, roles) => {
  return roles.some((role) => hasRole(user, role));
};

/**
 * Check if user has all of the specified roles
 * @param {Object} user - User object from context or localStorage
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean}
 */
export const hasAllRoles = (user, roles) => {
  return roles.every((role) => hasRole(user, role));
};

/**
 * Check if user has permission for a specific department
 * @param {Object} user - User object from context or localStorage
 * @param {number} departmentId - Department ID to check
 * @returns {boolean}
 */
export const canAccessDepartment = (user, departmentId) => {
  if (!user) return false;

  // Superuser can access all departments
  if (isSuperuser(user)) return true;

  // Check if user belongs to the department
  if (user.department && user.department.id === departmentId) return true;

  // Check permitted departments
  if (user.permitted_departments) {
    return user.permitted_departments.some((dept) => dept.id === departmentId);
  }

  return false;
};

/**
 * Get user's full name
 * @param {Object} user - User object from context or localStorage
 * @returns {string}
 */
export const getUserFullName = (user) => {
  return user?.full_name || 'Guest User';
};

/**
 * Get user's email
 * @param {Object} user - User object from context or localStorage
 * @returns {string}
 */
export const getUserEmail = (user) => {
  return user?.email || '';
};

/**
 * Get user's department
 * @param {Object} user - User object from context or localStorage
 * @returns {Object|null}
 */
export const getUserDepartment = (user) => {
  return user?.department || null;
};

/**
 * Get list of departments the user can access
 * @param {Object} user - User object from context or localStorage
 * @returns {Array}
 */
export const getAccessibleDepartments = (user) => {
  if (!user) return [];

  // Superuser can access all departments (would need to fetch from backend)
  if (isSuperuser(user)) return [];

  const departments = [...(user.permitted_departments || [])];

  // Add user's own department if not already included
  if (user.department && !departments.find((d) => d.id === user.department.id)) {
    departments.unshift(user.department);
  }

  return departments;
};
