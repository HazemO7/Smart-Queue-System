const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// Function to handle user registration
exports.registerUser = async (userData) => {
    const { name, phone, password, role } = userData;

  // check if user with the same phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
        const error = new Error('رقم الهاتف مسجل بالفعل');
        error.statusCode = 400;
        throw error;
    }

    // hash the password before saving the user
    
    const hashedPassword = await bcrypt.hash(password, 10);
    // create the new user in the database
    const newUser = await User.create({
        name,
        phone,
        password: hashedPassword,
    });

    const token = jwt.sign(
        { userId: newUser._id, role: newUser.role }, 
        process.env.JWT_SECRET || 'fallback_secret_key_for_development', 
        { expiresIn: '7d' }
    );
// remove password from the user object before returning it
    newUser.password = undefined;

    return { user: newUser, token };
};