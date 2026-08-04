const express = require('express');
const router = express.Router();
const {register , login} = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const errorHandler = require('../middlewares/errorMiddleware');

// POST /api/auth/register
router.post('/register', register, errorHandler);
router.post('/login', login, errorHandler);

module.exports = router;

