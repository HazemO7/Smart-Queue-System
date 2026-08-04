const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const errorHandler = require('../middlewares/errorMiddleware');

// GET /api/admin/stats — Aggregated dashboard statistics
router.get('/stats', verifyToken, isAdmin, getAdminStats, errorHandler);

module.exports = router;
