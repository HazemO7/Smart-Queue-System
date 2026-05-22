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
      data: { name: user.name, phone: user.phone, role: user.role }
    });
  } catch (error) {
    console.log(error);
  }
};

//////////////// login user ///////////////////////

module.exports = {
    register
};