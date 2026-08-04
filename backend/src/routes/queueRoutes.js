const express = require('express');
const router = express.Router();
const { startShift, getActiveQueues, closeShift, callNext, pauseShift, resumeShift } = require('../controllers/queueController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const errorHandler = require('../middlewares/errorMiddleware');

// POST /api/queue/start-shift — Admin opens today's shift (creates queue + activates tickets)
router.post('/start-shift', verifyToken, isAdmin, startShift, errorHandler);

// GET /api/queue/active/:clinicId — Get all open queues for a clinic
router.get('/active/:clinicId', verifyToken, isAdmin, getActiveQueues, errorHandler);

// PATCH /api/queue/next/:queueId — Admin calls the next patient (marks current as Served)
router.patch('/next/:queueId', verifyToken, isAdmin, callNext, errorHandler);

// PATCH /api/queue/close/:queueId — Admin closes a queue (end of shift)
router.patch('/close/:queueId', verifyToken, isAdmin, closeShift, errorHandler);

// PATCH /api/queue/pause/:queueId — Admin pauses an open queue
router.patch('/pause/:queueId', verifyToken, isAdmin, pauseShift, errorHandler);

// PATCH /api/queue/resume/:queueId — Admin resumes a paused queue
router.patch('/resume/:queueId', verifyToken, isAdmin, resumeShift, errorHandler);

module.exports = router;
