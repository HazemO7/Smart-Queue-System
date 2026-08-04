const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');
const errorHandler = require('../middlewares/errorMiddleware');

// GET /api/notifications — Get authenticated user's notifications
router.get('/', verifyToken, getMyNotifications, errorHandler);

// PATCH /api/notifications/read-all — Mark all notifications as read
router.patch('/read-all', verifyToken, markAllAsRead, errorHandler);

// PATCH /api/notifications/:id/read — Mark single notification as read
router.patch('/:id/read', verifyToken, markAsRead, errorHandler);

// DELETE /api/notifications/:id — Delete a notification
router.delete('/:id', verifyToken, deleteNotification, errorHandler);

module.exports = router;
