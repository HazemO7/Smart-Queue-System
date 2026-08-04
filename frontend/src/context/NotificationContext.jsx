import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const { socket, isConnected } = useSocket();
  const { isAuthenticated, user } = useAuth();

  // Fetch notifications on mount
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      const notifs = res.data?.data?.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('[NotificationContext] Failed to fetch notifications:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleYourTurn = (data) => {
      const notif = data.notification;
      // Deduplicate by _id
      setNotifications(prev => {
        if (prev.some(n => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount(prev => prev + 1);
      setToastNotification(notif);
      setShowToast(true);
    };

    socket.on('notification:yourTurn', handleYourTurn);

    return () => {
      socket.off('notification:yourTurn', handleYourTurn);
    };
  }, [socket, isConnected]);

  // Clear notifications on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationContext] Failed to mark as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all as read:', err);
    }
  }, []);

  const dismissNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const notif = prev.find(n => n._id === id);
        const newList = prev.filter(n => n._id !== id);
        if (notif && !notif.isRead) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return newList;
      });
    } catch (err) {
      console.error('[NotificationContext] Failed to dismiss notification:', err);
    }
  }, []);

  const dismissToast = useCallback(() => {
    setShowToast(false);
    setToastNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      showToast,
      toastNotification,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      dismissToast,
      refetchNotifications: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
