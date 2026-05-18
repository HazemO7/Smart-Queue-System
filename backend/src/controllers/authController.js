const authService = require('../services/authService');

// Function to handle user registration
exports.register = async (req, res) => {
    try {
        // تم التحقق من البيانات مسبقاً في الـ Middleware
        // لذا نقوم باستدعاء الـ Service مباشرة
        const result = await authService.registerUser(req.body);

        // إرسال استجابة النجاح
        res.status(201).json({
            success: true,
            message: 'تم تسجيل الحساب بنجاح',
            data: result.user,
            token: result.token
        });

    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};