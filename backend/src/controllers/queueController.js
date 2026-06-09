const  Queue = require("../models/Queue");

// create new queue for clinic

const createQueue = async (req, res) => {
  try {
    const { clinicId, adminId, date, averageServiceTime } = req.body;

 
    const existingQueue = await Queue.findOne({
      clinicId,
      isActive: true,
    });

    if (existingQueue) {
      return res.status(400).json({
        status: 'fail',
        message: 'There is already an active queue for this clinic.',
      });
    }

    // Create the new queue
    const newQueue = await Queue.create({
      clinicId,
      adminId, // usually taken from req.user.id if using auth middleware
      date: date || Date.now(),
      averageServiceTime,
    });

    res.status(201).json({
      status: 'success',
      data: {
        queue: newQueue,
      },
    });
    
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

module.exports = { createQueue };

