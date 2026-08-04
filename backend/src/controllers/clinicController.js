const Clinic = require("../models/Clinic");
const Queue = require("../models/Queue");
const Ticket = require("../models/Ticket");

/////////////// create clinic ////////////////////

const createClinic = async (req, res, next) =>{
    try{
        const {name, description} = req.body;
        if(!name) return res.status(400).json({msg: "Missing Data"});
        const existClinic = await Clinic.findOne({name});
        if(existClinic) return res.status(400).json({msg: "Clinic Already Exist"});
        const newClinic = await Clinic.create({name, description});
        res.status(201).json({
            msg: "Done Created Clinic",
            data: newClinic
        });
      
    }catch(error){
        next(error);
    }

}

/////////////// get all clinics with queue status ////////////////////

const getClinics = async (req, res, next) => {
  try {
    const clinics = await Clinic.find();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const enrichedClinics = await Promise.all(
      clinics.map(async (clinic) => {
        // Find today's open queue (if any)
        const activeQueue = await Queue.findOne({
          clinicId: clinic._id,
          date: { $gte: todayStart, $lte: todayEnd },
          status: 'Open',
        });

        // Count waiting (Live) tickets for today
        const waitingCount = await Ticket.countDocuments({
          clinicId: clinic._id,
          bookingDate: { $gte: todayStart, $lte: todayEnd },
          status: 'Live',
        });

        // Count served tickets for today
        const servedCount = await Ticket.countDocuments({
          clinicId: clinic._id,
          bookingDate: { $gte: todayStart, $lte: todayEnd },
          status: 'Served',
        });

        // Get waiting tickets with patient names (for admin queue table)
        const waitingTickets = await Ticket.find({
          clinicId: clinic._id,
          bookingDate: { $gte: todayStart, $lte: todayEnd },
          status: 'Live',
        })
          .populate('userId', 'name')
          .sort({ ticketNumber: 1 });

        // Get next ticket number
        const lastTicket = await Ticket.findOne({
          clinicId: clinic._id,
          bookingDate: { $gte: todayStart, $lte: todayEnd },
        })
          .sort({ ticketNumber: -1 })
          .select('ticketNumber');

        return {
          _id: clinic._id,
          name: clinic.name,
          description: clinic.description,
          queue: activeQueue
            ? {
                _id: activeQueue._id,
                status: activeQueue.status,
                currentServingNumber: activeQueue.currentServingNumber,
              }
            : null,
          waitingCount,
          servedCount,
          nextTicketNumber: lastTicket ? lastTicket.ticketNumber + 1 : 1,
          waitingTickets: waitingTickets.map((t) => ({
            _id: t._id,
            ticketNumber: t.ticketNumber,
            patientName: t.userId?.name || 'Unknown',
            timeJoined: t.createdAt,
            status: 'waiting',
          })),
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      results: enrichedClinics.length,
      data: { clinics: enrichedClinics },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {createClinic, getClinics};
