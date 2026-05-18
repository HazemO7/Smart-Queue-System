const Joi = require('joi');

exports.registerValidation = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().trim().required().messages({
            'string.empty': 'الرجاء إدخال الاسم',
            'any.required': 'حقل الاسم مطلوب'
        }),

        phone: Joi.string()
            .trim()
            .pattern(/^01[0125][0-9]{8}$/)
            .required()
            .messages({
                'string.empty': 'الرجاء إدخال رقم الهاتف',
                'string.pattern.base': 'الرجاء إدخال رقم هاتف مصري صحيح',
                'any.required': 'رقم الهاتف مطلوب'
            }),

        password: Joi.string().min(6).required().messages({
            'string.min': 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل',
            'string.empty': 'الرجاء إدخال كلمة المرور',
            'any.required': 'كلمة المرور مطلوبة'
        })
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }

    next();
};