const express = require('express');
const router = express.Router();
const { bookTicket, getMyTickets } = require('../controllers/ticketController');
const { verifyToken } = require('../middlewares/authMiddleware');
const errorHandler = require('../middlewares/errorMiddleware');

// GET /api/ticket/my-tickets — Get authenticated user's active tickets
router.get('/my-tickets', verifyToken, getMyTickets, errorHandler);

// POST /api/ticket/book — Pre-book a ticket (any authenticated user)
router.post('/book', verifyToken, bookTicket, errorHandler);

module.exports = router;
