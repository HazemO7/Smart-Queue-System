import React from 'react';
import { FiBell, FiCheckCircle, FiX, FiClock, FiPauseCircle, FiPlayCircle, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

function timeAgo(dateStr, t) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return t('justNow');
  if (diffMin < 60) return `${diffMin} ${t('minutesAgo')}`;
  if (diffHr < 24) return `${diffHr} ${t('hoursAgo')}`;
  return date.toLocaleDateString();
}

function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } = useNotifications();
  const { t } = useLanguage();

  const getIcon = (type) => {
    if (type === 'your-turn') {
      return (
        <div className="notification-item-icon your-turn text-success bg-success-subtle p-2 rounded-circle d-flex align-items-center justify-content-center">
          <FiBell size={18} />
        </div>
      );
    }
    if (type === 'approaching-turn') {
      return (
        <div className="notification-item-icon text-info bg-info-subtle p-2 rounded-circle d-flex align-items-center justify-content-center">
          <FiClock size={18} />
        </div>
      );
    }
    if (type === 'queue-paused') {
      return (
        <div className="notification-item-icon text-warning bg-warning-subtle p-2 rounded-circle d-flex align-items-center justify-content-center">
          <FiPauseCircle size={18} />
        </div>
      );
    }
    if (type === 'queue-resumed' || type === 'queue-started') {
      return (
        <div className="notification-item-icon text-primary bg-primary-subtle p-2 rounded-circle d-flex align-items-center justify-content-center">
          <FiPlayCircle size={18} />
        </div>
      );
    }
    if (type === 'queue-closed') {
      return (
        <div className="notification-item-icon text-danger bg-danger-subtle p-2 rounded-circle d-flex align-items-center justify-content-center">
          <FiAlertCircle size={18} />
        </div>
      );
    }
    return (
      <div className="notification-item-icon booking text-success bg-success-subtle p-2 rounded-circle d-flex align-items-center justify-content-center">
        <FiCheckCircle size={18} />
      </div>
    );
  };

  const handleItemClick = (n) => {
    if (!n.isRead) {
      markAsRead(n._id);
    }
  };

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    dismissNotification(id);
  };

  return (
    <div className="notification-dropdown shadow-lg border-0 rounded-3">
      <div className="notification-dropdown-header d-flex justify-content-between align-items-center p-3 border-bottom">
        <h6 className="mb-0 fw-bold">{t('notifications') || 'Notifications'}</h6>
        {unreadCount > 0 && (
          <button className="btn btn-link btn-sm text-decoration-none p-0" onClick={markAllAsRead}>
            {t('markAllRead') || 'Mark all read'}
          </button>
        )}
      </div>

      <div className="notification-dropdown-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div className="notification-empty p-4 text-center text-muted">
            <div className="notification-empty-icon mb-2 fs-4">
              <FiBell />
            </div>
            <div>{t('noNotifications') || 'No new notifications'}</div>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notification-item d-flex align-items-start gap-3 p-3 border-bottom position-relative ${n.isRead ? '' : 'bg-light fw-medium'}`}
              onClick={() => handleItemClick(n)}
              style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
            >
              {getIcon(n.type)}
              <div className="notification-item-content flex-grow-1 pe-3">
                <div className="notification-item-title fw-bold small text-dark mb-1">
                  {n.title}
                </div>
                <div className="notification-item-message small text-muted mb-1">
                  {n.message}
                </div>
                <div className="notification-item-time text-secondary" style={{ fontSize: '0.75rem' }}>
                  {timeAgo(n.createdAt, t)}
                </div>
              </div>
              {!n.isRead && <div className="notification-unread-dot bg-primary rounded-circle mt-1" style={{ width: '8px', height: '8px' }} />}
              <button
                className="btn btn-sm text-muted p-0 border-0 ms-2 align-self-start hover-text-danger"
                onClick={(e) => handleDismiss(e, n._id)}
                aria-label="Dismiss"
              >
                <FiX size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
