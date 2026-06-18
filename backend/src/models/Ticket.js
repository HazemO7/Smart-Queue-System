const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Ticket must belong to a clinic'],
    },
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue', 
      required: false, 
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    ticketNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'completed', 'cancelled'],
      default: 'waiting',
    },
  },
  { timestamps: true }
);

ticketSchema.index(
  { clinicId: 1, bookingDate: 1, ticketNumber: 1 },
  { unique: true }
);

ticketSchema.index({ clinicId: 1, patientId: 1, bookingDate: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;