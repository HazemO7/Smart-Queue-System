const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
    name:{
        type: String,
        required: [true , "Please enter your name"],
        trim: true,
    },
    phone:{
        type: String,
        required: [true , "Please enter your phone number"],
        unique: true,
        trim: true, 
    },
    password:{
        type: String,
        required: [true, "Please enter your password"],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    role:{
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
}
, {timestamps: true});

const User = mongoose.model('User', userSchema);
module.exports = User;