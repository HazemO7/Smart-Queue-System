const Joi = require('joi');

// Validation schema for registration
    const registerSchema = Joi.object({
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

        email: Joi.string().email().allow('').optional().messages({
            'string.email': 'Please enter a valid email address',
        }),

        password: Joi.string().min(6).required().messages({
            'string.min': 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل',
            'string.empty': 'الرجاء إدخال كلمة المرور',
            'any.required': 'كلمة المرور مطلوبة'
        })
    });


// Validation schema for login
    const loginSchema = Joi.object({
        phone: Joi.string().pattern(/^01[0125][0-9]{8}$/).required().messages({
            'string.pattern.base': 'الرجاء إدخال رقم هاتف مصري صحيح',
            'string.empty': 'الرجاء إدخال رقم الهاتف',
            'any.required': 'رقم الهاتف مطلوب'
        }),
        password: Joi.string().required().messages({
            'string.empty': 'الرجاء إدخال كلمة المرور',
            'any.required': 'كلمة المرور مطلوبة'
        })
    });


module.exports = { registerSchema , loginSchema };