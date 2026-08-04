const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Queue = require('../models/Queue');
const Clinic = require('../models/Clinic');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendBookingConfirmation } = require('../services/emailService');
const { getTicketWaitInfo, getAvgServiceDuration } = require('../services/waitTimeService');

const bookTicket = async (req, res, next) => {
  try {
    const { clinicId, bookingDate, appointmentDate } = req.body;
    const userId = req.user?.userId;

    const dateInput = appointmentDate || bookingDate;

    if (!clinicId || !dateInput) {
      return res.status(400).json({ status: 'fail', message: 'clinicId and appointmentDate/bookingDate are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid clinic ID format' });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ status: 'fail', message: 'Clinic not found' });
    }

    const parsedDate = new Date(dateInput);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ status: 'fail', message: 'Invalid booking date' });
    }

    let dateString = '';
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
       dateString = dateInput.substring(0, 10);
    } else {
       dateString = parsedDate.toISOString().split('T')[0];
    }

    // Validate Appointment exists and is Open
    const appointment = await Appointment.findOne({ clinicId, date: dateString });
    if (!appointment) {
      return res.status(404).json({ status: 'fail', message: 'No appointment available for this date' });
    }
    if (appointment.status !== 'Open') {
      return res.status(400).json({ status: 'fail', message: 'This appointment date is closed' });
    }
    if (appointment.capacity && appointment.booked >= appointment.capacity) {
      return res.status(400).json({ status: 'fail', message: 'This appointment date is fully booked' });
    }

    const dayStart = new Date(parsedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(parsedDate);
    dayEnd.setHours(23, 59, 59, 999);

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

    const lastTicket = await Ticket.findOne({
      clinicId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
    })
      .sort({ ticketNumber: -1 })
      .select('ticketNumber');

    const nextTicketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    const openQueue = await Queue.findOne({
      clinicId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: 'Open',
    });

    const ticketData = {
      clinicId,
      userId,
      bookingDate: dayStart,
      ticketNumber: nextTicketNumber,
      queueId: openQueue ? openQueue._id : null,
      status: openQueue ? 'Live' : 'Pending',
    };

    const newTicket = await Ticket.create(ticketData);

    // Atomically increment booked count
    await Appointment.findByIdAndUpdate(appointment._id, { $inc: { booked: 1 } });

    // Send booking confirmation email (fire-and-forget)
    const user = await User.findById(userId).select('name email');
    if (user?.email) {
      const position = openQueue ? await Ticket.countDocuments({
        clinicId,
        bookingDate: { $gte: dayStart, $lte: dayEnd },
        status: 'Live',
        ticketNumber: { $lt: nextTicketNumber },
      }) : null;

      const avgDuration = openQueue ? await getAvgServiceDuration(clinicId, dayStart, dayEnd) : null;

      sendBookingConfirmation({
        to: user.email,
        patientName: user.name,
        clinicName: clinic.name,
        ticketNumber: nextTicketNumber,
        bookingDate: dayStart.toISOString().split('T')[0],
        queuePosition: position,
        estimatedWait: position ? Math.ceil(position * avgDuration) : null,
      }).catch(err => console.error('[Email] Failed to send booking confirmation:', err.message));
    }

    // Emit socket event so admin queue table updates in real-time
    const io = req.app.get('io');
    io.to(`clinic:${clinicId}`).emit('ticket:new', {
      clinicId: clinicId.toString(),
      ticket: {
        _id: newTicket._id.toString(),
        ticketNumber: newTicket.ticketNumber,
        status: newTicket.status,
        userId: newTicket.userId.toString(),
      },
    });

    res.status(201).json({
      status: 'success',
      message: openQueue
        ? 'Ticket booked and activated (queue is open)'
        : 'Ticket pre-booked successfully (pending queue activation)',
      data: { ticket: newTicket },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'Duplicate ticket: this ticket number already exists for the clinic on this date',
      });
    }
    next(error);
  }
};

/////////////// Get My Tickets ////////////////////

const getMyTickets = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tickets = await Ticket.find({
      userId,
      bookingDate: { $gte: todayStart },
      status: { $in: ['Pending', 'Live'] },
    })
      .populate('clinicId', 'name description')
      .populate('queueId', 'currentServingNumber status')
      .sort({ bookingDate: 1 });

    const enhancedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const ticketObj = ticket.toObject();
        const waitInfo = await getTicketWaitInfo(ticketObj, ticket.queueId);

        return {
          ...ticketObj,
          clinicName: ticket.clinicId?.name || '',
          currentServingNumber: ticket.queueId?.currentServingNumber || 0,
          position: waitInfo.position,
          estimatedWaitMinutes: waitInfo.estimatedWaitMinutes,
          queueState: waitInfo.queueState,
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      results: enhancedTickets.length,
      data: { tickets: enhancedTickets },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { bookTicket, getMyTickets };
