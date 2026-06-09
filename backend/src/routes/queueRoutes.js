const express = require('express');
const router = express.Router();
const { createQueue } = require('../controllers/queueController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// POST / api/queue/create

router.post('/create', verifyToken, isAdmin, createQueue);


module.exports = router;
