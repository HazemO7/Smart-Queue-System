const express = require('express');
const router = express.Router();
const { bookTicket } = require('../controllers/ticketController');
const { verifyToken } = require('../middlewares/authMiddleware');
const errorHandler = require('../middlewares/errorMiddleware');

// POST /api/ticket/book — Pre-book a ticket (any authenticated user)
router.post('/book', verifyToken, bookTicket, errorHandler);

module.exports = router;
