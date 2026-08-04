import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FiBell } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';

function NotificationToast() {
  const { showToast, toastNotification, dismissToast } = useNotifications();

  if (!toastNotification) return null;

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      <Toast
        show={showToast}
        onClose={dismissToast}
        delay={8000}
        autohide
        className="notification-toast border-0 shadow-lg"
      >
        <Toast.Header className="notification-toast-header border-0">
          <div className="notification-toast-icon me-2">
            <FiBell size={18} />
          </div>
          <strong className="me-auto">{toastNotification.title}</strong>
        </Toast.Header>
        <Toast.Body className="notification-toast-body">
          {toastNotification.message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

export default NotificationToast;
