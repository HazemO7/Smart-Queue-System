const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Queue = require('../models/Queue');
const Clinic = require('../models/Clinic');

// ═══════════════════════════════════════════════════════════════
// PRE-BOOKING — POST /api/tickets/book
// ═══════════════════════════════════════════════════════════════
// The user books a ticket for a specific clinic on a specific date.
//
// Business Logic:
//   1. Calculate the next available ticketNumber for that
//      clinic + bookingDate combination.
//   2. Check if there is already an 'Open' queue for this
//      clinicId and bookingDate.
//   3. If an open queue exists → create ticket with queueId
//      set and status = 'Live'.
//   4. If NO open queue → create ticket with queueId = null
//      and status = 'Pending' (standard pre-booking).
// ═══════════════════════════════════════════════════════════════

const bookTicket = async (req, res, next) => {
  try {
    const { clinicId, bookingDate } = req.body;
    const userId = req.user?.userId;

    // ── Validate required fields ──────────────────────────────
    if (!clinicId || !bookingDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'clinicId and bookingDate are required',
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

    // ── Parse and normalize the booking date to day boundaries ─
    const parsedDate = new Date(bookingDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid booking date',
      });
    }

    // Normalize to the start of the day (00:00:00.000)
    const dayStart = new Date(parsedDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(parsedDate);
    dayEnd.setHours(23, 59, 59, 999);

    // ── Check if user already has a ticket for this clinic on this date ─
    const existingUserTicket = await Ticket.findOne({
      clinicId,
      userId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['Pending', 'Live'] },
    });

    if (existingUserTicket) {
      return res.status(400).json({
        status: 'fail',
        message: 'You already have an active ticket for this clinic on this date',
        ticket: existingUserTicket,
      });
    }

    // ── Calculate next ticket number ──────────────────────────
    // Find the highest ticketNumber for this clinic on this date,
    // then increment by 1. If no tickets exist, start at 1.
    const lastTicket = await Ticket.findOne({
      clinicId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
    })
      .sort({ ticketNumber: -1 })
      .select('ticketNumber');

    const nextTicketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    // ── Check for an open queue on this date ──────────────────
    const openQueue = await Queue.findOne({
      clinicId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: 'Open',
    });

    // ── Create the ticket ─────────────────────────────────────
    // If there's an open queue → attach to it (Live)
    // If no queue yet → pre-booking (Pending, queueId = null)
    const ticketData = {
      clinicId,
      userId,
      bookingDate: dayStart, // normalized to start of day
      ticketNumber: nextTicketNumber,
      queueId: openQueue ? openQueue._id : null,
      status: openQueue ? 'Live' : 'Pending',
    };

    const newTicket = await Ticket.create(ticketData);

    res.status(201).json({
      status: 'success',
      message: openQueue
        ? 'Ticket booked and activated (queue is open)'
        : 'Ticket pre-booked successfully (pending queue activation)',
      data: {
        ticket: newTicket,
      },
    });
  } catch (error) {
    // Handle the compound unique index violation gracefully
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'Duplicate ticket: this ticket number already exists for the clinic on this date',
      });
    }
    next(error);
  }
};

module.exports = { bookTicket };
