const Ticket = require('../models/ticketModel');
const Queue = require('../models/queueModel');

const createTicket = async (req, res) => {
    try{
        const  { queueId, patientId, ticketNumber } = req.body;
        if(!queueId || !patientId || !ticketNumber){
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if(ticketNumber <= 0){
            return res.status(400).json({ message: 'Ticket number must be a positive integer' });
        }
        const existingTicket = await Ticket.findOne({ queueId, ticketNumber });
        if(existingTicket){
            return res.status(400).json({ message: 'Ticket number already exists in this queue' });
        }
        const newTicket = new Ticket({ queueId, patientId, ticketNumber });
        await newTicket.save();
        res.status(201).json({
             message: 'Ticket created successfully',
              ticket: newTicket
             });
    } catch (error) {
        res.status(500).json({
             message: 'Error creating ticket',
              error
             });
    }
}