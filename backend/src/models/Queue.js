const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Queue must belong to a clinic'],
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: [true, 'Queue must be managed by an admin'],
    },
    date: {
      type: Date,
      default: Date.now, 
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    currentTicketNumber: {
      type: Number,
      default: 0,
    },
    averageServiceTime: {
      type: Number,
      default: 10,
    },
  },
  
  { timestamps: true }
);




const Queue = mongoose.model("Queue", queueSchema);
module.exports = Queue;