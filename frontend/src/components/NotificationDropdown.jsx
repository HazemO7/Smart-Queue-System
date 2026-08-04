import React from 'react';
import { FiBell, FiCheckCircle, FiX } from 'react-icons/fi';
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
        <div className="notification-item-icon your-turn">
          <FiBell size={18} />
        </div>
      );
    }
    return (
      <div className="notification-item-icon booking">
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
    <div className="notification-dropdown">
      <div className="notification-dropdown-header">
        <h6>{t('notifications')}</h6>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead}>
            {t('markAllRead')}
          </button>
        )}
      </div>

      <div className="notification-dropdown-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <div className="notification-empty-icon">
              <FiBell />
            </div>
            <div>{t('noNotifications')}</div>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notification-item ${n.isRead ? '' : 'unread'}`}
              onClick={() => handleItemClick(n)}
            >
              {getIcon(n.type)}
              <div className="notification-item-content">
                <div className="notification-item-title">
                  {n.title}
                </div>
                <div className="notification-item-message">
                  {n.message}
                </div>
                <div className="notification-item-time">
                  {timeAgo(n.createdAt, t)}
                </div>
              </div>
              {!n.isRead && <div className="notification-unread-dot" />}
              <button
                className="notification-item-dismiss"
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
