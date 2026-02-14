import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RightPanel.css';

export const RightPanel = ({
  show,
  onClose,
  notifications = [],
  notificationCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onAddNotification
}) => {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <motion.div
            className="panel-overlay active"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Sliding Panel */}
          <motion.div
            className="right-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            {/* Header */}
            <div className="right-panel-header">
              <h2>Notifications ({notificationCount})</h2>
              <div className="right-panel-actions">
                <button className="btn-mark-all" onClick={onMarkAllAsRead}>
                  Mark all as read
                </button>
                <button className="btn-close" onClick={onClose}>
                  ×
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="notifications-container">
              {notifications.length > 0 ? (
                <div className="notifications-list">
                  {notifications.map((note, index) => (
                    <motion.div
                      key={index}
                      className={`notification-item ${note.unread ? 'unread' : ''}`}
                      onClick={() => onMarkAsRead && onMarkAsRead(index)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="notification-header">
                        <h3 className="notification-title">{note.title}</h3>
                        {note.unread && (
                          <div className="unread-indicator">
                            <div className="unread-dot"></div>
                          </div>
                        )}
                      </div>
                      <p className="notification-content">{note.message}</p>
                      <div className="notification-meta">
                        {note.sender && (
                          <span className="notification-sender">{note.sender}</span>
                        )}
                        <span className="notification-time">{note.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="no-notifications"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="no-notifications-icon">🔔</div>
                  <p>No new notifications</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="panel-footer">
              <button className="btn-demo" onClick={onAddNotification}>
                Add Demo Notification
              </button>
              <button className="btn-clear-all" onClick={onClearAll}>
                Clear All Notifications
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RightPanel;
