const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');

const getAppointments = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) return res.status(400).json({ status: 'fail', message: 'Valid clinic ID is required' });

    let filter = { clinicId };
    
    // Patients only see available appointments
    if (req.user?.role !== 'admin') {
      filter.status = 'Open';
      filter.$or = [
        { capacity: { $exists: false } },
        { capacity: null },
        { $expr: { $lt: ["$booked", "$capacity"] } }
      ];
    }

    const appointments = await Appointment.find(filter).sort({ date: 1 });
    return res.status(200).json({ status: 'success', results: appointments.length, data: { appointments } });
  } catch (error) { next(error); }
};

const createAppointment = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { date, capacity } = req.body;

    if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) return res.status(400).json({ status: 'fail', message: 'Valid clinic ID is required' });
    if (!date) return res.status(400).json({ status: 'fail', message: 'Appointment date is required' });

    // Validate date string (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return res.status(400).json({ status: 'fail', message: 'Invalid date format. Use YYYY-MM-DD' });

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return res.status(400).json({ status: 'fail', message: 'Invalid date' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    if (parsedDate < today) return res.status(400).json({ status: 'fail', message: 'Cannot create appointments in the past' });

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return res.status(404).json({ status: 'fail', message: 'Clinic not found' });

    const newAppointment = await Appointment.create({
      clinicId,
      date,
      capacity: capacity ? Number(capacity) : undefined
    });

    res.status(201).json({ status: 'success', data: { appointment: newAppointment } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ status: 'fail', message: 'An appointment for this date already exists for this clinic' });
    next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { clinicId, appointmentId } = req.params;
    const { status, capacity } = req.body;

    if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) return res.status(400).json({ status: 'fail', message: 'Valid appointment ID is required' });

    const appointment = await Appointment.findOne({ _id: appointmentId, clinicId });
    if (!appointment) return res.status(404).json({ status: 'fail', message: 'Appointment not found' });

    if (status) {
      if (!['Open', 'Closed'].includes(status)) return res.status(400).json({ status: 'fail', message: 'Invalid status' });
      appointment.status = status;
    }

    if (capacity !== undefined) {
      const newCapacity = Number(capacity);
      if (newCapacity < appointment.booked) return res.status(400).json({ status: 'fail', message: `Cannot reduce capacity below current bookings (${appointment.booked})` });
      appointment.capacity = newCapacity;
    }

    await appointment.save();
    res.status(200).json({ status: 'success', data: { appointment } });
  } catch (error) { next(error); }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const { clinicId, appointmentId } = req.params;
    
    if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) return res.status(400).json({ status: 'fail', message: 'Valid appointment ID is required' });

    const appointment = await Appointment.findOne({ _id: appointmentId, clinicId });
    if (!appointment) return res.status(404).json({ status: 'fail', message: 'Appointment not found' });

    if (appointment.booked > 0) {
      return res.status(400).json({ status: 'fail', message: 'Cannot delete an appointment that has active bookings' });
    }

    await Appointment.findByIdAndDelete(appointmentId);
    res.status(200).json({ status: 'success', message: 'Appointment deleted successfully' });
  } catch (error) { next(error); }
};

module.exports = { getAppointments, createAppointment, updateAppointmentStatus, deleteAppointment };
