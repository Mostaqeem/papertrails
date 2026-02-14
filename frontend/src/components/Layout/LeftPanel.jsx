import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import { getMenuItems, isMenuItemVisible } from "./MenuConfig";

import "./LeftPanel.css";

const LeftPanel = ({ show, onClose }) => {
  const { user } = useUser();
  
  // Using an object to track multiple open sub-menus simultaneously
  const [openMenus, setOpenMenus] = useState({
    "user-management": false,
    configurations: false,
  });

  // Get filtered menu items based on user role
  const menuItems = getMenuItems(user);

  const [expandedMenu, setExpandedMenu] = useState(null);
  const toggleMenu = (id, level = 0, siblingIds = []) => {
    setOpenMenus((prev) => {
      // If the clicked menu is already open, close it
      if (prev[id]) {
        return {
          ...prev,
          [id]: false,
        };
      }

      // If clicking a top-level menu (level 0)
      if (level === 0) {
        // Close all menus and open only this one
        const allClosed = Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {});
        allClosed[id] = true;
        return allClosed;
      } else {
        // If clicking a nested menu (level > 0)
        // Close all siblings and open only this one
        const updated = { ...prev };
        siblingIds.forEach((siblingId) => {
          updated[siblingId] = false;
        });
        updated[id] = true;
        return updated;
      }
    });
  };

  // Recursive function to render menu levels
  const renderMenuItems = (items, level = 0) => {
    const siblingIds = items.map((item) => item.id);

    return items.map((item) => {
      const isExpanded = openMenus[item.id];
      const hasChildren = !!item.children;

      return (
        <li key={item.id || item.path || item.label} className="nav-item">
          {hasChildren ? (
            <>
              {/* Parent Item */}
              <div
                className={`nav-link parent-trigger ${
                  isExpanded ? "parent-active" : ""
                } level-${level}`}
                onClick={() => toggleMenu(item.id, level, siblingIds)}
              >
                <div className="link-content">
                  {item.icon && <img src={item.icon} className="icon" alt="" />}
                  <span>{item.label}</span>
                </div>
                {isExpanded ? (
                  <FaChevronDown className="chevron-icon" />
                ) : (
                  <FaChevronRight className="chevron-icon" />
                )}
              </div>

              {/* Recursive Child List */}
              {isExpanded && (
                <ul className={`submenu-list level-${level}`}>
                  {renderMenuItems(item.children, level + 1)}
                </ul>
              )}
            </>
          ) : (
            /* Final Link Item */
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? level > 0
                    ? "active-sub-link"
                    : "active-link"
                  : level > 0
                  ? "sub-link"
                  : "nav-link"
              }
            >
              <div className="link-content">
                {item.icon && <img src={item.icon} className="icon" alt="" />}
                <span>{item.label}</span>
              </div>
              {item.hasSubmenu && <FaChevronRight className="chevron-icon" />}
            </NavLink>
          )}
        </li>
      );
    });
  };

  return (
    <div className={`left-panel${show ? " active" : ""}`}>
      <button
        className="close-sidebar-btn"
        onClick={onClose}
        aria-label="Close menu"
      >
        ×
      </button>

      <nav>
        <div className="menu-header">Menu</div>
        <ul className="nav-list">{renderMenuItems(menuItems)}</ul>
      </nav>
    </div>
  );
};

export default LeftPanel;
