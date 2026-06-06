const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const { registerSchema, loginSchema } = require("../validations/authValidation");

/////////////// register user ////////////////////
const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        msg: error.details.map((err) => err.message),
      });
    }

    // get Data
    const { name, phone, password, role } = value;
    // Validated Data
    if (!name || !phone || !password)
      return res.status(400).json({ msg: "Missing Data" });

    const existUser = await User.findOne({ phone });
    if (existUser)
      return res.status(400).json({ msg: "Account Already Exist" });
    // Create New User
    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone,
      password: hashPassword,
      role,
    });
    // Response
    res.status(201).json({
      msg: "Done Created User",
      data: [{ name: user.name, phone: user.phone, role: user.role }]
    });
  } catch (error) {
    console.log(error);
  }
};



/////////////// login user ////////////////////
const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });


    if (error) {
      return res.status(400).json({
        msg: error.details.map((err) => err.message),
      });
    }

    const { phone, password } = value;
    // search for user by phone number
    const user = await User.findOne({ phone }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({ msg: "Invalid phone number or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
   
    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Invalid phone number or password" });
    }
    // genrate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: "1d" }  
     );

    // respone with token and user data (excluding password)
    res.status(200).json({
      msg: "Login successful",
      token: token,  
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

/////////////// logout user /////////////

const logout = async (req, res) => {
  try {   
    res.status(200).json({
      msg: "Logout successful",     
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = {
    register , login, logout
};


