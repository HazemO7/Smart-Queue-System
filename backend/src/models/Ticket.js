const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue', // Logical relation to the Queue collection
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Logical relation to the User collection
      required: true,
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
  { queueId: 1, ticketNumber: 1 },
  { unique: true }
);






const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;

