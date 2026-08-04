const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Ticket = require('../models/Ticket');
const Clinic = require('../models/Clinic');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendTurnNotificationEmail } = require('../services/emailService');

const startShift = async (req, res, next) => {
  try {
    const { clinicId } = req.body;

    if (!clinicId) {
      return res.status(400).json({ status: 'fail', message: 'clinicId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid clinic ID format' });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ status: 'fail', message: 'Clinic not found' });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

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

    const newQueue = await Queue.create({
      clinicId,
      date: now,
      status: 'Open',
      currentServingNumber: 0,
    });

    const activationResult = await Ticket.updateMany(
      {
        clinicId,
        bookingDate: { $gte: todayStart, $lte: todayEnd },
        status: 'Pending',
      },
      { $set: { queueId: newQueue._id, status: 'Live' } }
    );

    // Emit socket event after successful DB update
    const io = req.app.get('io');
    io.to(`clinic:${clinicId}`).emit('queue:started', {
      clinicId: clinicId.toString(),
      queue: {
        _id: newQueue._id,
        status: newQueue.status,
        currentServingNumber: newQueue.currentServingNumber,
      },
      activatedTickets: activationResult.modifiedCount,
    });

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

const closeShift = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    if (!queueId || !mongoose.Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({ status: 'fail', message: 'Valid queue ID is required' });
    }

    const updatedQueue = await Queue.findByIdAndUpdate(
      queueId,
      { status: 'Closed' },
      { new: true }
    );

    if (!updatedQueue) {
      return res.status(404).json({ status: 'fail', message: 'No queue found with that ID' });
    }

    const noShowResult = await Ticket.updateMany(
      { queueId: updatedQueue._id, status: 'Live' },
      { $set: { status: 'No-Show' } }
    );

    // Emit socket event after successful DB update
    const io = req.app.get('io');
    io.to(`clinic:${updatedQueue.clinicId}`).emit('queue:closed', {
      clinicId: updatedQueue.clinicId.toString(),
      queueId: updatedQueue._id.toString(),
      noShowTickets: noShowResult.modifiedCount,
    });

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

const getActiveQueues = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
      return res.status(400).json({ status: 'fail', message: 'Valid clinic ID is required' });
    }

    const activeQueues = await Queue.find({ clinicId, status: 'Open' });

    return res.status(200).json({
      status: 'success',
      results: activeQueues.length,
      data: { queues: activeQueues },
    });
  } catch (error) {
    next(error);
  }
};

/////////////// Call Next Patient ////////////////////

const callNext = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    if (!queueId || !mongoose.Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({ status: 'fail', message: 'Valid queue ID is required' });
    }

    const queue = await Queue.findById(queueId);
    if (!queue || queue.status !== 'Open') {
      return res.status(404).json({ status: 'fail', message: 'No open queue found with that ID' });
    }

    // Find the next Live ticket with the lowest ticketNumber
    const nextTicket = await Ticket.findOne({
      queueId: queue._id,
      status: 'Live',
    })
      .sort({ ticketNumber: 1 })
      .populate('userId', 'name phone');

    if (!nextTicket) {
      return res.status(400).json({ status: 'fail', message: 'No more patients in the queue' });
    }

    // Mark the ticket as Served
    nextTicket.status = 'Served';
    await nextTicket.save();

    // Update the queue's currentServingNumber
    queue.currentServingNumber = nextTicket.ticketNumber;
    await queue.save();

    // Emit socket event so all connected clients see the update instantly
    const io = req.app.get('io');

    // Create and send "your turn" notification
    const clinicDoc = await Clinic.findById(queue.clinicId).select('name');
    const notification = await Notification.create({
      userId: nextTicket.userId._id,
      type: 'your-turn',
      title: "It's your turn!",
      message: `Please proceed to ${clinicDoc?.name || 'the clinic'}.`,
      data: {
        clinicId: queue.clinicId.toString(),
        clinicName: clinicDoc?.name || '',
        ticketNumber: nextTicket.ticketNumber,
      },
    });

    // Emit targeted notification to the specific patient
    io.to(`user:${nextTicket.userId._id.toString()}`).emit('notification:yourTurn', {
      notification: {
        _id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      },
    });

    // Send email notification (fire-and-forget)
    const userForEmail = await User.findById(nextTicket.userId._id).select('email name');
    if (userForEmail?.email) {
      sendTurnNotificationEmail({
        to: userForEmail.email,
        patientName: userForEmail.name,
        clinicName: clinicDoc?.name || 'the clinic',
        ticketNumber: nextTicket.ticketNumber,
      }).catch(err => console.error('[Email] Failed to send turn notification:', err.message));
    }

    // Emit queue update to clinic room
    io.to(`clinic:${queue.clinicId}`).emit('queue:next', {
      clinicId: queue.clinicId.toString(),
      queueId: queue._id.toString(),
      currentServingNumber: queue.currentServingNumber,
      servedTicket: {
        _id: nextTicket._id.toString(),
        ticketNumber: nextTicket.ticketNumber,
        userId: nextTicket.userId._id.toString(),
        patientName: nextTicket.userId.name,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: `Now serving ticket #${nextTicket.ticketNumber}`,
      data: {
        queue,
        servedTicket: nextTicket,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { startShift, closeShift, getActiveQueues, callNext };


