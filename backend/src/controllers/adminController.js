const User = require('../models/User');
const Clinic = require('../models/Clinic');
const Ticket = require('../models/Ticket');
const Appointment = require('../models/Appointment');

/////////////// Get Admin Dashboard Stats ////////////////////

const getAdminStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Run all counts in parallel for performance
    const [
      totalClinics,
      totalPatients,
      pendingToday,
      liveToday,
      servedToday,
      noShowToday,
      upcomingAppointments,
    ] = await Promise.all([
      Clinic.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Ticket.countDocuments({
        bookingDate: { $gte: todayStart, $lte: todayEnd },
        status: 'Pending',
      }),
      Ticket.countDocuments({
        bookingDate: { $gte: todayStart, $lte: todayEnd },
        status: 'Live',
      }),
      Ticket.countDocuments({
        bookingDate: { $gte: todayStart, $lte: todayEnd },
        status: 'Served',
      }),
      Ticket.countDocuments({
        bookingDate: { $gte: todayStart, $lte: todayEnd },
        status: 'No-Show',
      }),
      Appointment.countDocuments({
        status: 'Open',
        date: { $gte: now.toISOString().split('T')[0] },
      }),
    ]);

    const totalTicketsToday = pendingToday + liveToday + servedToday + noShowToday;

    return res.status(200).json({
      status: 'success',
      data: {
        totalClinics,
        totalPatients,
        todayStats: {
          totalTickets: totalTicketsToday,
          pending: pendingToday,
          live: liveToday,
          served: servedToday,
          noShow: noShowToday,
        },
        upcomingAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminStats };
