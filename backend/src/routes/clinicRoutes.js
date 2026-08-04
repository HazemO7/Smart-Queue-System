const express = require('express');
const router = express.Router();
const {createClinic} = require('../controllers/clinicController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const errorHandler = require('../middlewares/errorMiddleware');

// POST /api/clinic/create

router.post('/create', verifyToken, isAdmin, createClinic, errorHandler);



module.exports = router;
