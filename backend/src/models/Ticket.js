const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// Ticket Schema — Represents a patient's booking for a clinic.
//
// Decoupled Architecture:
//   - A ticket can exist WITHOUT a queue (pre-booking → status: 'Pending')
//   - When the admin opens the shift, pending tickets are "activated"
//     by linking them to the queue (queueId set, status → 'Live')
// ─────────────────────────────────────────────────────────────

const ticketSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Ticket must belong to a clinic'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ticket must belong to a user'],
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    ticketNumber: {
      type: Number,
      required: [true, 'Ticket number is required'],
    },
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Live', 'Served', 'No-Show'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

// index to ensure unique ticket numbers for each clinic and booking date
ticketSchema.index(
  { clinicId: 1, bookingDate: 1, ticketNumber: 1 },
  { unique: true }
);
// index to optimize queries for a user's tickets at a specific clinic and date
ticketSchema.index({ clinicId: 1, userId: 1, bookingDate: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;