const express = require('express');
const router = express.Router();
const { createQueue , getActiveQueues , closeQueue } = require('../controllers/queueController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// POST / api/queue/create

router.post('/create', verifyToken, isAdmin, createQueue);
router.get('/active/:clinicId', verifyToken, isAdmin, getActiveQueues);
router.patch('/close/:queueId', verifyToken, isAdmin, closeQueue);


module.exports = router;
