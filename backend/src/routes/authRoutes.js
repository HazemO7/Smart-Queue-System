const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation } = require('../validations/authValidation');

// مسار التسجيل: POST /api/auth/register
router.post('/register', registerValidation, authController.register);

module.exports = router;