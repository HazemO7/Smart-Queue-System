const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

const DEFAULT_SERVICE_MINUTES = 7;
const MAX_VALID_SERVICE_MINUTES = 30;
const MIN_VALID_SERVICE_MINUTES = 0.5;

/**
 * Calculate average service duration for a clinic's queue today.
 * Uses timestamps of Served tickets (createdAt/updatedAt delta or consecutive served deltas).
 * Falls back to DEFAULT_SERVICE_MINUTES (7) if no historical data.
 * @param {string|mongoose.Types.ObjectId} clinicId
 * @param {Date} dayStart
 * @param {Date} dayEnd
 * @returns {Promise<number>} Average minutes per patient
 */
async function getAvgServiceDuration(clinicId, dayStart = null, dayEnd = null) {
  try {
    if (!dayStart || !dayEnd) {
      const now = new Date();
      dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayEnd = new Date(now);
      dayEnd.setHours(23, 59, 59, 999);
    }

    const servedTickets = await Ticket.find({
      clinicId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
      status: 'Served',
    }).sort({ updatedAt: 1 });

    if (servedTickets.length < 2) {
      if (servedTickets.length === 1) {
        const diffMs = new Date(servedTickets[0].updatedAt).getTime() - new Date(servedTickets[0].createdAt).getTime();
        const diffMins = diffMs / (1000 * 60);
        if (diffMins >= MIN_VALID_SERVICE_MINUTES && diffMins <= MAX_VALID_SERVICE_MINUTES) {
          return Math.round(diffMins * 10) / 10;
        }
      }
      return DEFAULT_SERVICE_MINUTES;
    }

    let totalMins = 0;
    let count = 0;
    for (let i = 1; i < servedTickets.length; i++) {
      const diffMs = new Date(servedTickets[i].updatedAt).getTime() - new Date(servedTickets[i - 1].updatedAt).getTime();
      const diffMins = diffMs / (1000 * 60);
      if (diffMins >= MIN_VALID_SERVICE_MINUTES && diffMins <= MAX_VALID_SERVICE_MINUTES) {
        totalMins += diffMins;
        count++;
      }
    }

    if (count === 0) {
      return DEFAULT_SERVICE_MINUTES;
    }

    const avg = totalMins / count;
    return Math.max(1, Math.round(avg * 10) / 10);
  } catch (err) {
    console.error('[WaitTimeService] Error calculating avg service duration:', err.message);
    return DEFAULT_SERVICE_MINUTES;
  }
}

/**
 * Calculate position and estimated wait time for a specific ticket.
 * @param {Object} ticket - Mongoose document or object
 * @param {Object|null} queue - Queue document or object
 * @param {number|null} precomputedAvg - Optional precomputed average duration
 * @returns {Promise<{ position: number, estimatedWaitMinutes: number|null, queueState: string }>}
 */
async function getTicketWaitInfo(ticket, queue, precomputedAvg = null) {
  if (!queue) {
    return { position: 0, estimatedWaitMinutes: null, queueState: 'not-started' };
  }

  if (queue.status === 'Closed') {
    return { position: 0, estimatedWaitMinutes: null, queueState: 'closed' };
  }

  // If ticket is already served or no-show, return 0 wait
  if (ticket.status === 'Served' || ticket.status === 'No-Show') {
    return { position: 0, estimatedWaitMinutes: null, queueState: queue.status === 'Paused' ? 'paused' : 'open' };
  }

  // Count Live tickets ahead in line
  const dayStart = new Date(ticket.bookingDate || new Date());
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const position = await Ticket.countDocuments({
    clinicId: ticket.clinicId,
    bookingDate: { $gte: dayStart, $lte: dayEnd },
    status: 'Live',
    ticketNumber: { $lt: ticket.ticketNumber },
  });

  if (queue.status === 'Paused') {
    return { position, estimatedWaitMinutes: null, queueState: 'paused' };
  }

  if (position === 0) {
    return { position: 0, estimatedWaitMinutes: 0, queueState: 'your-turn' };
  }

  const avgServiceDuration = precomputedAvg !== null ? precomputedAvg : await getAvgServiceDuration(ticket.clinicId, dayStart, dayEnd);
  const estimatedWaitMinutes = Math.ceil(position * avgServiceDuration);

  return { position, estimatedWaitMinutes, queueState: 'open' };
}

/**
 * Calculate position and wait info for ALL Live tickets in a clinic today.
 * Used for broadcasting after queue state changes or patient call.
 * @param {string|mongoose.Types.ObjectId} queueId
 * @param {string|mongoose.Types.ObjectId} clinicId
 * @param {Object|null} queue
 * @returns {Promise<Array<{ userId: string, ticketNumber: number, position: number, estimatedWaitMinutes: number|null, queueState: string, currentServingNumber: number }>>}
 */
async function getAllTicketWaitInfo(queueId, clinicId, queue) {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const liveTickets = await Ticket.find({
    clinicId,
    bookingDate: { $gte: dayStart, $lte: dayEnd },
    status: 'Live',
  }).sort({ ticketNumber: 1 });

  if (liveTickets.length === 0) {
    return [];
  }

  const avgDuration = await getAvgServiceDuration(clinicId, dayStart, dayEnd);
  const currentServingNumber = queue ? queue.currentServingNumber : 0;

  return liveTickets.map((ticket, idx) => {
    const position = idx; // 0-indexed sorted by ticketNumber means index is exact number of patients ahead
    const userId = ticket.userId._id ? ticket.userId._id.toString() : ticket.userId.toString();
    const ticketNumber = ticket.ticketNumber;

    if (!queue) {
      return { userId, ticketNumber, position: 0, estimatedWaitMinutes: null, queueState: 'not-started', currentServingNumber: 0 };
    }

    if (queue.status === 'Closed') {
      return { userId, ticketNumber, position: 0, estimatedWaitMinutes: null, queueState: 'closed', currentServingNumber };
    }

    if (queue.status === 'Paused') {
      return { userId, ticketNumber, position, estimatedWaitMinutes: null, queueState: 'paused', currentServingNumber };
    }

    if (position === 0) {
      return { userId, ticketNumber, position: 0, estimatedWaitMinutes: 0, queueState: 'your-turn', currentServingNumber };
    }

    const estimatedWaitMinutes = Math.ceil(position * avgDuration);
    return { userId, ticketNumber, position, estimatedWaitMinutes, queueState: 'open', currentServingNumber };
  });
}

module.exports = {
  getAvgServiceDuration,
  getTicketWaitInfo,
  getAllTicketWaitInfo,
  DEFAULT_SERVICE_MINUTES,
};
