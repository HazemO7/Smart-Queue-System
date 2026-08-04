const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Appointment must belong to a clinic'],
    },
    date: {
      type: String,
      required: [true, 'Appointment date is required (YYYY-MM-DD)'],
    },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
    },
    capacity: {
      type: Number,
    },
    booked: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Prevent duplicate dates for the same clinic
appointmentSchema.index({ clinicId: 1, date: 1 }, { unique: true });

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
