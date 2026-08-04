const Notification = require('../models/Notification');

/////////////// Get My Notifications ////////////////////

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
};

/////////////// Mark Single Notification as Read ////////////////////

const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ status: 'fail', message: 'Notification not found' });
    }

    return res.status(200).json({
      status: 'success',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

/////////////// Mark All Notifications as Read ////////////////////

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      status: 'success',
      message: `${result.modifiedCount} notification(s) marked as read`,
    });
  } catch (error) {
    next(error);
  }
};

/////////////// Delete Notification ////////////////////

const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ status: 'fail', message: 'Notification not found' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
