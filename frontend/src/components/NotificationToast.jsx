import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FiBell, FiClock, FiPauseCircle, FiPlayCircle, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';

function NotificationToast() {
  const { showToast, toastNotification, dismissToast } = useNotifications();

  if (!toastNotification) return null;

  const getHeaderIcon = (type) => {
    switch (type) {
      case 'your-turn': return <FiBell size={18} className="text-success" />;
      case 'approaching-turn': return <FiClock size={18} className="text-info" />;
      case 'queue-paused': return <FiPauseCircle size={18} className="text-warning" />;
      case 'queue-resumed': 
      case 'queue-started': return <FiPlayCircle size={18} className="text-primary" />;
      case 'queue-closed': return <FiAlertCircle size={18} className="text-danger" />;
      default: return <FiCheckCircle size={18} className="text-success" />;
    }
  };

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      <Toast
        show={showToast}
        onClose={dismissToast}
        delay={8000}
        autohide
        className="notification-toast border-0 shadow-lg"
      >
        <Toast.Header className="notification-toast-header border-0 d-flex align-items-center">
          <div className="notification-toast-icon me-2 d-flex align-items-center">
            {getHeaderIcon(toastNotification.type)}
          </div>
          <strong className="me-auto">{toastNotification.title}</strong>
        </Toast.Header>
        <Toast.Body className="notification-toast-body text-secondary">
          {toastNotification.message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

export default NotificationToast;
