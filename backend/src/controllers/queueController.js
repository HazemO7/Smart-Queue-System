const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Ticket = require('../models/Ticket');
const Clinic = require('../models/Clinic');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendTurnNotificationEmail } = require('../services/emailService');
const { getAllTicketWaitInfo } = require('../services/waitTimeService');

const startShift = async (req, res, next) => {
  try {
    const { clinicId } = req.body;

    if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
      return res.status(400).json({ status: 'fail', message: 'Valid clinic ID is required' });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ status: 'fail', message: 'Clinic not found' });
    }

    const existingQueue = await Queue.findOne({ clinicId, status: { $in: ['Open', 'Paused'] } });
    if (existingQueue) {
      return res.status(400).json({ status: 'fail', message: 'An active shift already exists for this clinic today' });
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const newQueue = await Queue.create({
      clinicId,
      status: 'Open',
      currentServingNumber: 0,
    });

    const activationResult = await Ticket.updateMany(
      {
        clinicId,
        bookingDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'Pending',
      },
      {
        $set: {
          status: 'Live',
          queueId: newQueue._id,
        },
      }
    );

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

    // Broadcast updated positions, wait times, and queue-started notification to all activated patients
    const waitInfos = await getAllTicketWaitInfo(newQueue._id, clinicId, newQueue);
    await Promise.all(
      waitInfos.map(async (info) => {
        io.to(`user:${info.userId}`).emit('queue:update', {
          clinicId: clinicId.toString(),
          ticketNumber: info.ticketNumber,
          position: info.position,
          estimatedWaitMinutes: info.estimatedWaitMinutes,
          queueState: info.queueState,
          currentServingNumber: info.currentServingNumber,
        });

        try {
          const notif = await Notification.create({
            userId: info.userId,
            type: 'queue-started',
            title: 'Queue Started',
            message: `The queue has started. Your position is #${info.position}.`,
            data: { clinicId: clinicId.toString(), ticketNumber: info.ticketNumber, position: info.position },
          });
          io.to(`user:${info.userId}`).emit('notification:new', { notification: notif.toObject() });
        } catch (err) {
          console.error('[Notification] Error creating queue-started notification:', err.message);
        }
      })
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

    const liveTicketsToClose = await Ticket.find({ queueId: updatedQueue._id, status: 'Live' }).select('userId ticketNumber');

    const noShowResult = await Ticket.updateMany(
      { queueId: updatedQueue._id, status: 'Live' },
      { $set: { status: 'No-Show' } }
    );

    const io = req.app.get('io');
    io.to(`clinic:${updatedQueue.clinicId}`).emit('queue:closed', {
      clinicId: updatedQueue.clinicId.toString(),
      queueId: updatedQueue._id.toString(),
      noShowTickets: noShowResult.modifiedCount,
    });

    // Notify all affected patients that the queue is closed
    await Promise.all(
      liveTicketsToClose.map(async (ticket) => {
        const uId = ticket.userId._id ? ticket.userId._id.toString() : ticket.userId.toString();
        io.to(`user:${uId}`).emit('queue:update', {
          clinicId: updatedQueue.clinicId.toString(),
          ticketNumber: ticket.ticketNumber,
          position: 0,
          estimatedWaitMinutes: null,
          queueState: 'closed',
          currentServingNumber: updatedQueue.currentServingNumber || 0,
        });

        try {
          const notif = await Notification.create({
            userId: uId,
            type: 'queue-closed',
            title: 'Queue Closed',
            message: 'The shift has ended and the queue has closed.',
            data: { clinicId: updatedQueue.clinicId.toString(), ticketNumber: ticket.ticketNumber },
          });
          io.to(`user:${uId}`).emit('notification:new', { notification: notif.toObject() });
        } catch (err) {
          console.error('[Notification] Error creating queue-closed notification:', err.message);
        }
      })
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

    const nextTicket = await Ticket.findOne({
      queueId: queue._id,
      status: 'Live',
    })
      .sort({ ticketNumber: 1 })
      .populate('userId', 'name phone');

    if (!nextTicket) {
      return res.status(400).json({ status: 'fail', message: 'No more patients in the queue' });
    }

    nextTicket.status = 'Served';
    await nextTicket.save();

    queue.currentServingNumber = nextTicket.ticketNumber;
    await queue.save();

    const io = req.app.get('io');

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
    io.to(`user:${nextTicket.userId._id.toString()}`).emit('notification:new', {
      notification: notification.toObject(),
    });

    const userForEmail = await User.findById(nextTicket.userId._id).select('email name');
    if (userForEmail?.email) {
      sendTurnNotificationEmail({
        to: userForEmail.email,
        patientName: userForEmail.name,
        clinicName: clinicDoc?.name || 'the clinic',
        ticketNumber: nextTicket.ticketNumber,
      }).catch(err => console.error('[Email] Failed to send turn notification:', err.message));
    }

    // Recalculate positions, wait times, and send proximity notifications for remaining patients
    const waitInfos = await getAllTicketWaitInfo(queue._id, queue.clinicId, queue);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    await Promise.all(
      waitInfos.map(async (info) => {
        io.to(`user:${info.userId}`).emit('queue:update', {
          clinicId: queue.clinicId.toString(),
          ticketNumber: info.ticketNumber,
          position: info.position,
          estimatedWaitMinutes: info.estimatedWaitMinutes,
          queueState: info.queueState,
          currentServingNumber: info.currentServingNumber,
        });

        // Proximity notifications (5 ahead and 2 ahead) with deduplication
        if (info.position === 5 || info.position === 2) {
          try {
            const existingNotif = await Notification.findOne({
              userId: info.userId,
              type: 'approaching-turn',
              'data.position': info.position,
              createdAt: { $gte: todayStart },
            });

            if (!existingNotif) {
              const title = info.position === 5 ? '5 Patients Ahead' : 'Almost Your Turn!';
              const message = info.position === 5
                ? 'There are 5 patients ahead of you. Please begin heading toward the clinic.'
                : 'Only 2 patients left ahead of you! Please be ready at the clinic door.';

              const notif = await Notification.create({
                userId: info.userId,
                type: 'approaching-turn',
                title,
                message,
                data: {
                  clinicId: queue.clinicId.toString(),
                  ticketNumber: info.ticketNumber,
                  position: info.position,
                },
              });
              io.to(`user:${info.userId}`).emit('notification:new', { notification: notif.toObject() });
            }
          } catch (err) {
            console.error('[Notification] Error creating approaching-turn notification:', err.message);
          }
        }
      })
    );

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
      updatedWaitList: waitInfos,
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

const pauseShift = async (req, res, next) => {
  try {
    const { queueId } = req.params;
    if (!queueId || !mongoose.Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({ status: 'fail', message: 'Valid queue ID is required' });
    }
    const queue = await Queue.findById(queueId);
    if (!queue || queue.status !== 'Open') {
      return res.status(404).json({ status: 'fail', message: 'No open queue found with that ID to pause' });
    }
    queue.status = 'Paused';
    await queue.save();

    const io = req.app.get('io');
    io.to(`clinic:${queue.clinicId}`).emit('queue:paused', {
      clinicId: queue.clinicId.toString(),
      queueId: queue._id.toString(),
    });

    const waitInfos = await getAllTicketWaitInfo(queue._id, queue.clinicId, queue);
    await Promise.all(
      waitInfos.map(async (info) => {
        io.to(`user:${info.userId}`).emit('queue:update', {
          clinicId: queue.clinicId.toString(),
          ticketNumber: info.ticketNumber,
          position: info.position,
          estimatedWaitMinutes: null,
          queueState: 'paused',
          currentServingNumber: info.currentServingNumber,
        });

        try {
          const notif = await Notification.create({
            userId: info.userId,
            type: 'queue-paused',
            title: 'Queue Paused',
            message: 'The queue has been temporarily paused. Please stay tuned for resumption.',
            data: { clinicId: queue.clinicId.toString(), ticketNumber: info.ticketNumber },
          });
          io.to(`user:${info.userId}`).emit('notification:new', { notification: notif.toObject() });
        } catch (err) {
          console.error('[Notification] Error creating queue-paused notification:', err.message);
        }
      })
    );

    return res.status(200).json({ status: 'success', message: 'Queue paused successfully', data: { queue } });
  } catch (error) {
    next(error);
  }
};

const resumeShift = async (req, res, next) => {
  try {
    const { queueId } = req.params;
    if (!queueId || !mongoose.Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({ status: 'fail', message: 'Valid queue ID is required' });
    }
    const queue = await Queue.findById(queueId);
    if (!queue || queue.status !== 'Paused') {
      return res.status(404).json({ status: 'fail', message: 'No paused queue found with that ID to resume' });
    }
    queue.status = 'Open';
    await queue.save();

    const io = req.app.get('io');
    io.to(`clinic:${queue.clinicId}`).emit('queue:resumed', {
      clinicId: queue.clinicId.toString(),
      queueId: queue._id.toString(),
    });

    const waitInfos = await getAllTicketWaitInfo(queue._id, queue.clinicId, queue);
    await Promise.all(
      waitInfos.map(async (info) => {
        io.to(`user:${info.userId}`).emit('queue:update', {
          clinicId: queue.clinicId.toString(),
          ticketNumber: info.ticketNumber,
          position: info.position,
          estimatedWaitMinutes: info.estimatedWaitMinutes,
          queueState: info.queueState,
          currentServingNumber: info.currentServingNumber,
        });

        try {
          const notif = await Notification.create({
            userId: info.userId,
            type: 'queue-resumed',
            title: 'Queue Resumed',
            message: `The queue has resumed moving. Your updated position is #${info.position}.`,
            data: { clinicId: queue.clinicId.toString(), ticketNumber: info.ticketNumber, position: info.position },
          });
          io.to(`user:${info.userId}`).emit('notification:new', { notification: notif.toObject() });
        } catch (err) {
          console.error('[Notification] Error creating queue-resumed notification:', err.message);
        }
      })
    );

    return res.status(200).json({ status: 'success', message: 'Queue resumed successfully', data: { queue } });
  } catch (error) {
    next(error);
  }
};

module.exports = { startShift, closeShift, getActiveQueues, callNext, pauseShift, resumeShift };
