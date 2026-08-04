const express = require('express');
const router = express.Router();
const { createClinic, getClinics } = require('../controllers/clinicController');
const { getAppointments, createAppointment, updateAppointmentStatus, deleteAppointment } = require('../controllers/appointmentController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const errorHandler = require('../middlewares/errorMiddleware');

// Clinic Routes
router.get('/', verifyToken, getClinics, errorHandler);
router.post('/create', verifyToken, isAdmin, createClinic, errorHandler);

// Appointment Routes (nested under clinic)
router.get('/:clinicId/appointments', verifyToken, getAppointments, errorHandler);
router.post('/:clinicId/appointments', verifyToken, isAdmin, createAppointment, errorHandler);
router.patch('/:clinicId/appointments/:appointmentId', verifyToken, isAdmin, updateAppointmentStatus, errorHandler);
router.delete('/:clinicId/appointments/:appointmentId', verifyToken, isAdmin, deleteAppointment, errorHandler);

module.exports = router;
