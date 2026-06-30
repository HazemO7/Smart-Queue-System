const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Ticket = require('../models/Ticket');
const Clinic = require('../models/Clinic');

// ═══════════════════════════════════════════════════════════════
// START SHIFT — POST /api/queues/start-shift
// ═══════════════════════════════════════════════════════════════
// The admin opens the clinic's shift for today.
//
// Business Logic:
//   1. Create a new Queue document (status: 'Open') for the
//      clinic with today's date.
//   2. Immediately run Ticket.updateMany() to find all
//      'Pending' tickets for this clinic where bookingDate
//      falls within today's date range.
//   3. Set their queueId to the new Queue's _id and change
//      their status to 'Live'.
//   4. Return the queue and the count of activated tickets.
// ═══════════════════════════════════════════════════════════════

const startShift = async (req, res, next) => {
  try {
    const { clinicId } = req.body;

    // ── Validate required field ───────────────────────────────
    if (!clinicId) {
      return res.status(400).json({
        status: 'fail',
        message: 'clinicId is required',
      });
    }
    

    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid clinic ID format',
      });
    }

    // ── Verify the clinic exists ──────────────────────────────
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({
        status: 'fail',
        message: 'Clinic not found',
      });
    }

    // ── Calculate today's date boundaries ─────────────────────
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // ── Check if a queue is already open for today ────────────
    const existingQueue = await Queue.findOne({
      clinicId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'Open',
    });

    if (existingQueue) {
      return res.status(400).json({
        status: 'fail',
        message: 'There is already an open queue for this clinic today',
        data: { queue: existingQueue },
      });
    }

    // ── Create the new Queue ──────────────────────────────────
    const newQueue = await Queue.create({
      clinicId,
      date: now,
      status: 'Open',
      currentServingNumber: 0,
    });

    // ── Activate all pending tickets for today ────────────────
    // Find tickets where:
    //   - clinicId matches
    //   - bookingDate falls within today
    //   - status is 'Pending'
    // Update them:
    //   - Set queueId to the new queue's _id
    //   - Change status to 'Live'
    const activationResult = await Ticket.updateMany(
      {
        clinicId,
        bookingDate: { $gte: todayStart, $lte: todayEnd },
        status: 'Pending',
      },
      {
        $set: {
          queueId: newQueue._id,
          status: 'Live',
        },
      }
    );

    res.status(201).json({
      status: 'success',
      message: `Shift started. ${activationResult.modifiedCount} ticket(s) activated.`,
      data: {
        queue: newQueue,
        activatedTickets: activationResult.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════
// CLOSE SHIFT — PATCH /api/queues/close/:queueId
// ═══════════════════════════════════════════════════════════════
// The admin closes the queue (end of shift).
// All remaining 'Live' tickets become 'No-Show'.
// ═══════════════════════════════════════════════════════════════

const closeShift = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    if (!queueId || !mongoose.Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid queue ID is required',
      });
    }

    // ── Find and close the queue ──────────────────────────────
    const updatedQueue = await Queue.findByIdAndUpdate(
      queueId,
      { status: 'Closed' },
      { new: true }
    );

    if (!updatedQueue) {
      return res.status(404).json({
        status: 'fail',
        message: 'No queue found with that ID',
      });
    }

    // ── Mark remaining Live tickets as No-Show ────────────────
    const noShowResult = await Ticket.updateMany(
      {
        queueId: updatedQueue._id,
        status: 'Live',
      },
      {
        $set: { status: 'No-Show' },
      }
    );

    return res.status(200).json({
      status: 'success',
      message: `Queue closed. ${noShowResult.modifiedCount} remaining ticket(s) marked as No-Show.`,
      data: {
        queue: updatedQueue,
        noShowTickets: noShowResult.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════
// GET ACTIVE QUEUES — GET /api/queues/active/:clinicId
// ═══════════════════════════════════════════════════════════════
// Returns all open queues for a specific clinic.
// ═══════════════════════════════════════════════════════════════

const getActiveQueues = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid clinic ID is required',
      });
    }

    const activeQueues = await Queue.find({
      clinicId,
      status: 'Open',
    });

    return res.status(200).json({
      status: 'success',
      results: activeQueues.length,
      data: {
        queues: activeQueues,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Exporting the functions to be used in routes
module.exports = { startShift, closeShift, getActiveQueues };


