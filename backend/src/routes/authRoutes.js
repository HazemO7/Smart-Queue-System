const express = require('express');
const router = express.Router();
const {register , login} = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// POST /api/auth/register
router.post('/register', register);
router.post('/login', login);

module.exports = router;

