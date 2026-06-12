const mongoose = require("mongoose");

const clinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
  }
});


const Clinic = mongoose.model("Clinic", clinicSchema);
module.exports = Clinic;
