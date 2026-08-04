const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// Notification Schema — Persists in-app notifications.
// Used for "your turn" alerts and other patient notifications.
// Auto-deleted after 7 days via TTL index.
// ─────────────────────────────────────────────────────────────

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a user'],
      index: true,
    },
    type: {
      type: String,
      enum: ['your-turn', 'booking-confirmed', 'queue-started', 'queue-closed'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-delete notifications after 7 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
