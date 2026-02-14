/**
 * Menu configuration - extracted for reusability and easier maintenance
 * Defines the menu structure with icons and routes
 */

import dashboardIcon from "../../assets/icons/dashboard.svg";
import userManagementIcon from "../../assets/icons/UserManagement.svg";
import configurationIcon from "../../assets/icons/Configurations.svg";
import agreementIcon from "../../assets/icons/Agreement.svg";
import invoiceIcon from "../../assets/icons/Invoice.svg";
import letterIcon from "../../assets/icons/letter.svg";
import requisitionIcon from "../../assets/icons/Requisitions.svg";
import reportIcon from "../../assets/icons/Reports.svg";
import settingIcon from "../../assets/icons/Settings.svg";

/**
 * Menu structure with role-based access control
 * @param {Object} user - Current user object with is_superuser flag
 * @returns {Array} - Filtered menu items based on user role
 */
export const getMenuItems = (user) => {
  const baseMenuItems = [
    { path: "/", label: "Dashboard", icon: dashboardIcon },
    {
      label: "User Management",
      icon: userManagementIcon,
      id: "user-management",
      requiresRole: "superuser", // Only superuser can see
      children: [
        { path: "/user-management/all-users", label: "All users" },
        { path: "/user-management/roles", label: "User Roles" },
      ],
    },
    {
      label: "Configurations",
      icon: configurationIcon,
      id: "configurations",
      requiresRole: "superuser", // Only superuser can see
      children: [
        {
          label: "Accounts",
          id: "conf-accounts",
          children: [
            {
              path: "/configurations/accounts/departments",
              label: "Departments",
            },
            {
              path: "/configurations/accounts/signatories",
              label: "Signatories",
            },
            {
              path: "/configurations/accounts/designations",
              label: "Designations",
            },
          ],
        },
        {
          label: "Agreements",
          id: "conf-agreements",
          children: [
            { path: "/configurations/agreements/vendors", label: "Vendors" },
            {
              path: "/configurations/agreements/types",
              label: "Agreement Types",
            },
          ],
        },
        {
          label: "Letters",
          id: "conf-letters",
          children: [
            { path: "/configurations/letters/categories", label: "Categories" },
            {
              path: "/configurations/letters/organizations",
              label: "Organizations",
            },
            { path: "/configurations/letters/recipients", label: "Recipients" },
          ],
        },
      ],
    },
    { path: "/agreements", label: "Agreements", icon: agreementIcon },
    { path: "/invoices", label: "Invoices", icon: invoiceIcon },
    { path: "/letters", label: "Letters", icon: letterIcon },
    { path: "/requisitions", label: "Requisitions", icon: requisitionIcon },
    { path: "/reports", label: "Reports", icon: reportIcon, hasSubmenu: true },
    {
      path: "/settings",
      label: "Settings",
      icon: settingIcon,
      hasSubmenu: true,
    },
  ];

  // Filter menu items based on user role
  return filterMenuByRole(baseMenuItems, user);
};

/**
 * Recursively filter menu items based on user roles
 * @param {Array} items - Menu items to filter
 * @param {Object} user - Current user object
 * @returns {Array} - Filtered menu items
 */
const filterMenuByRole = (items, user) => {
  if (!user) return [];

  return items
    .filter((item) => {
      // If item requires a role, check if user has it
      if (item.requiresRole) {
        return user.is_superuser === true;
      }
      return true;
    })
    .map((item) => {
      // Recursively filter children if they exist
      if (item.children) {
        return {
          ...item,
          children: filterMenuByRole(item.children, user),
        };
      }
      return item;
    });
};

/**
 * Check if a menu item or its children should be visible
 * @param {Object} item - Menu item to check
 * @param {Object} user - Current user object
 * @returns {boolean} - Whether item should be visible
 */
export const isMenuItemVisible = (item, user) => {
  if (!user) return false;

  // If item requires a specific role
  if (item.requiresRole === "superuser") {
    return user.is_superuser === true;
  }

  // Check if any child is visible
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => isMenuItemVisible(child, user));
  }

  return true;
};

/**
 * Get all routes from menu items (for route configuration)
 * @param {Array} items - Menu items
 * @returns {Array} - All routes from menu items
 */
export const extractRoutesFromMenu = (items) => {
  const routes = [];

  items.forEach((item) => {
    if (item.path) {
      routes.push(item.path);
    }
    if (item.children) {
      routes.push(...extractRoutesFromMenu(item.children));
    }
  });

  return routes;
};
