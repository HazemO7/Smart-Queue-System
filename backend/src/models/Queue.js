const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// Queue Schema — Represents a clinic's daily shift/session.
// A queue is created when an admin "starts the shift" for a day.
// ─────────────────────────────────────────────────────────────

const queueSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Queue must belong to a clinic'],
    },
    date: {
      type: Date,
      required: [true, 'Queue date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Open', 'Paused', 'Closed'],
      default: 'Open',
    },
    currentServingNumber: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index: quickly find the active queue for a clinic on a given date
queueSchema.index({ clinicId: 1, date: 1, status: 1 });

const Queue = mongoose.model("Queue", queueSchema);
module.exports = Queue;