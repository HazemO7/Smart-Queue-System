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





// get all active queues for a clinic
const getActiveQueues = async (req, res) => {
  try {
    const { clinicId } = req.params;

    if (!clinicId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Clinic ID is required',
      });
    }
    const activeQueues = await Queue.find({ clinicId, isActive: true });

    return res.status(200).json({
      status: 'success',
      results: activeQueues.length,
      data: {
        queues: activeQueues,
      },
    });

  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong on the server',
      error: err.message, 
    });
  }
};



// close a specific queue (Update isActive to false)
const closeQueue = async (req, res) => {
  try {
    const { queueId } = req.params;

    if (!queueId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Queue ID is required',
      });
    }
    const updatedQueue = await Queue.findByIdAndUpdate(
      queueId,
      { isActive: false },
      { new: true }
    );

    if (!updatedQueue) {
      return res.status(404).json({
        status: 'fail',
        message: 'No queue found with that ID',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Queue has been closed successfully',
      data: {
        queue: updatedQueue,
      },
    });

  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong while closing the queue',
      error: err.message,
    });
  }
};


// Exporting the functions to be used in routes

module.exports = { createQueue, getActiveQueues , closeQueue };
